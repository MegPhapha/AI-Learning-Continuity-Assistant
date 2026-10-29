"""
Chat endpoints for AI tutoring
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional
import logging
import uuid
from datetime import datetime
import asyncio
import json
import os
import re
import urllib.request
import re

from backend.models.chat import (
    AIRequest,
    AIResponse,
    ChatStartRequest,
    ChatStartResponse,
    MessageBase,
    MessageResponse,
    ChatSession,
    ConversationSummary,
)
from backend.models.document import DocumentStatus
from backend.api.documents import DEMO_DOCUMENTS

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for demo mode
_sessions: dict = {}
# Pending practice question per session: session_id -> question state
_pending_practice: dict = {}

# AI answer backends, in priority order:
#   1. Mistral API (api.mistral.ai) when MISTRAL_API_KEY is set — real Mistral
#      models hosted in the EU; ideal when connectivity exists.
#   2. Local Ollama models (mistral first, then lighter fallbacks) — fully
#      offline sovereignty when there is no network.
# If none answer, the tutor gives its honest "I can't answer that yet" reply.
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")
MISTRAL_API_MODEL = os.environ.get("MISTRAL_API_MODEL", "ministral-3b-latest")


def _tutor_prompt(question: str, subject: str, grade: str, language: str) -> str:
    return (
        f"You are a kind, encouraging tutor for {grade} students, teaching {subject}. "
        f"Answer in {'French' if language == 'fr' else 'English'} in at most 150 words, "
        "at a Grade 3 reading level, with simple examples. "
        f"Question: {question}"
    )


def get_mistral_api_answer(prompt: str) -> str | None:
    """Ask Mistral's hosted API (EU infrastructure) using MISTRAL_API_KEY."""
    if not MISTRAL_API_KEY:
        return None
    payload = json.dumps({
        "model": MISTRAL_API_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
        "temperature": 0.4,
    }).encode()
    req = urllib.request.Request(
        "https://api.mistral.ai/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode())
            return (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip() or None
    except Exception:
        return None


def get_llm_answer(question: str, subject: str, grade: str, language: str) -> tuple[str | None, str | None]:
    """Answer an off-curriculum question.

    Returns (answer, model_label) where model_label describes which backend
    answered (e.g. "Mistral Ministral 3B (EU)" or "local model") so students
    and teachers always know where an answer came from.
    """
    prompt = _tutor_prompt(question, subject, grade, language)

    # 1. Mistral's own API — real Mistral model, EU-hosted
    api_answer = get_mistral_api_answer(prompt)
    if api_answer:
        # e.g. "ministral-3b-latest" → "Mistral Ministral 3B (EU)"
        display = MISTRAL_API_MODEL.replace("-latest", "").replace("-", " ").title()
        return api_answer, f"Mistral {display} (EU)"

    # 2. Local Ollama models — fully offline fallback chain
    models = [OLLAMA_MODEL, "mistral", "llama3.2"]
    seen = set()
    for model in models:
        if model in seen:
            continue
        seen.add(model)
        payload = json.dumps({
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.4, "num_predict": 300},
        }).encode()
        try:
            req = urllib.request.Request(
                f"{OLLAMA_URL}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode())
                answer = (data.get("response") or "").strip()
                if answer:
                    label = f"Mistral 7B (local)" if "mistral" in model else "local model"
                    return answer, label
        except Exception:
            continue
    return None, None


# Demo responses based on document and query
DEMO_RESPONSES = {
    "demo-math": {
        "en": {
            "add": {
                "content": "**Adding Numbers with Carrying**\n\nLet's add 245 + 178 step by step:\n\n```text\n  245\n+ 178\n-----\n```\n\n**Step-by-step:**\n\n1. **Units column:** 5 + 8 = 13 → write **3**, carry **1**\n2. **Tens column:** 4 + 7 + 1 = 12 → write **2**, carry **1**\n3. **Hundreds column:** 2 + 1 + 1 = **4**\n\n**So 245 + 178 = 423**\n\n*Remember: always start from the rightmost column, and carry over when a column sums to 10 or more!*",
                "practice": "Try this: 456 + 289 = ?",
                "feedback": "Good effort! Remember to carry over when the sum is 10 or more.",
                "activity": "Practice adding three-digit numbers with your family members.",
            },
            "multiply": {
                "content": "**Multiplication Basics**\n\nMultiplication is repeated addition. For example:\n\n- 5 × 3 means 5 + 5 + 5 = 15\n- 4 × 6 means 4 + 4 + 4 + 4 + 4 + 4 = 24\n\n**Practice:** Try 7 × 4 on your own!\n\n**Tip:** You can also think of multiplication as equal groups. 5 × 3 means 5 groups of 3.",
                "practice": "What is 8 × 5?",
                "feedback": "Great job! Use multiplication tables to practice more.",
                "activity": "Create flash cards for multiplication facts up to 10 × 10.",
            },
            "subtract": {
                "content": "**Subtraction with Borrowing** ➖\n\nLet's subtract 523 − 178 step by step:\n\n```text\n  523\n− 178\n-----\n```\n\n1. **Units column:** 3 − 8 → we can't! Borrow 10: 13 − 8 = **5**\n2. **Tens column:** we borrowed, so 1 − 7 → borrow again: 11 − 7 = **4**\n3. **Hundreds column:** 4 − 1 = **3**\n\n**So 523 − 178 = 345**\n\n*Remember: start from the rightmost column, and borrow from the next column when the top digit is too small!*",
                "practice": "Try this: 523 - 178 = ?",
                "feedback": "Hint: start from the units column and borrow when you need to!",
                "activity": "Practice subtracting prices when you go shopping with your family.",
            },
            "fractions": {
                "content": "**Fractions — Parts of a Whole** 🍕\n\nA fraction shows equal parts of something whole:\n\n- **1/2** (one half) — a pizza cut into 2 equal slices\n- **1/4** (one quarter) — a pizza cut into 4 equal slices\n\n**Adding fractions with the same bottom number is easy:**\n\n1/4 + 1/4 = **2/4** (and 2/4 is the same as 1/2!)\n\n1/2 + 1/2 = **1 whole pizza** 🍕\n\n*Remember: the bottom number tells you how many equal parts the whole is cut into!*",
                "practice": "If you cut a pizza into 4 equal slices and eat 1 slice, what fraction is left?",
                "feedback": "Hint: count the slices that are left, out of all the slices!",
                "activity": "Cut a tortilla or a piece of paper into equal parts and label each fraction.",
            },
            "default": {
                "content": "Welcome to **Mathematics for Grade 3**!\n\nI can help you with:\n\n📌 **Addition and Subtraction**\n   - Adding 2-digit and 3-digit numbers\n   - Subtraction with borrowing\n   - Word problems\n\n📌 **Multiplication and Division**\n   - Basic multiplication facts\n   - Division as sharing\n   - Simple word problems\n\n📌 **Fractions**\n   - Understanding halves, thirds, quarters\n   - Comparing fractions\n   - Simple fraction addition\n\n📌 **Geometry**\n   - Shapes and their properties\n   - Perimeter and area basics\n   - Symmetry\n\n**What would you like to learn today?**",
                "practice": "What is 15 + 27?",
                "feedback": "Try solving it step by step.",
                "activity": "Practice with numbers you see in everyday life.",
            },
        },
        "fr": {
            "add": {
                "content": "**Addition avec retenue**\n\nAdditionnons 245 + 178 étape par étape :\n\n```text\n  245\n+ 178\n-----\n```\n\n**Étape par étape :**\n\n1. **Colonne des unités :** 5 + 8 = 13 → écrivez **3**, retenez **1**\n2. **Colonne des dizaines :** 4 + 7 + 1 = 12 → écrivez **2**, retenez **1**\n3. **Colonne des centaines :** 2 + 1 + 1 = **4**\n\n**Donc 245 + 178 = 423**\n\n*Souvenez-vous : commencez toujours par la colonne de droite, et retenez quand une colonne dépasse 10 !*",
                "practice": "Essayez ceci: 456 + 289 = ?",
                "feedback": "Bon effort! N'oubliez pas de retenir quand la somme est 10 ou plus.",
                "activity": "Pratiquez l'addition de nombres à trois chiffres avec les membres de votre famille.",
            },
            "subtract": {
                "content": "**Soustraction avec emprunt** ➖\n\nSoustrayons 523 − 178 étape par étape :\n\n```text\n  523\n− 178\n-----\n```\n\n1. **Colonne des unités :** 3 − 8 → impossible ! Empruntez 10 : 13 − 8 = **5**\n2. **Colonne des dizaines :** on a emprunté, donc 1 − 7 → empruntez encore : 11 − 7 = **4**\n3. **Colonne des centaines :** 4 − 1 = **3**\n\n**Donc 523 − 178 = 345**\n\n*Souvenez-vous : commencez par la colonne de droite, et empruntez à la colonne suivante quand le chiffre du haut est trop petit !*",
                "practice": "Essayez ceci: 523 - 178 = ?",
                "feedback": "Indice : commencez par les unités et empruntez quand c'est nécessaire !",
                "activity": "Pratiquez la soustraction des prix quand vous faites les courses avec votre famille.",
            },
            "fractions": {
                "content": "**Les fractions — des parties d'un tout** 🍕\n\nUne fraction montre des parties égales d'un tout :\n\n- **1/2** (un demi) — une pizza coupée en 2 parts égales\n- **1/4** (un quart) — une pizza coupée en 4 parts égales\n\n**Additionner des fractions avec le même chiffre en bas, c'est facile :**\n\n1/4 + 1/4 = **2/4** (et 2/4 est la même chose que 1/2 !)\n\n1/2 + 1/2 = **1 pizza entière** 🍕\n\n*Souvenez-vous : le chiffre du bas indique en combien de parts égales le tout est coupé !*",
                "practice": "Si vous coupez une pizza en 4 parts égales et que vous en mangez 1, quelle fraction reste-t-il ?",
                "feedback": "Indice : comptez les parts qui restent, sur toutes les parts !",
                "activity": "Coupez une galette ou une feuille de papier en parts égales et nommez chaque fraction.",
            },
            "default": {
                "content": "Bienvenue dans **les mathématiques pour la classe 3**!\n\nJe peux vous aider avec:\n\n📌 **Addition et soustraction**\n   - Addition de nombres à 2 et 3 chiffres\n   - Soustraction avec emprunt\n   - Problèmes de mots\n\n📌 **Multiplication et division**\n   - Faits de multiplication de base\n   - Division comme partage\n   - Problèmes de mots simples\n\n**Que souhaitez-vous apprendre aujourd'hui?**",
                "practice": "Quelle est la somme de 15 + 27?",
                "feedback": "Essayez de résoudre cela étape par étape.",
                "activity": "Pratiquez avec des nombres que vous voyez dans la vie quotidienne.",
            },
        },
    },
    "demo-science": {
        "en": {
            "oxygen": {
                "content": "**Oxygen and Air** 🌬️\n\nAir is all around us — and **oxygen** is the part of air that people and animals need to live!\n\n1. **We breathe in oxygen** — our bodies use it to get energy from food\n2. **Plants make oxygen** — during the day, plants take in air and release oxygen\n3. **Oxygen is everywhere** — it is one of the gases that makes up the air around us\n\n**Why it matters:** Without oxygen, people and animals could not survive. Plants keep our air fresh — that's why trees are our friends! 🌳\n\n**Fun fact:** A big tree can make enough oxygen for two people every day!",
                "practice": "What do plants release during the day that we need to breathe?",
                "feedback": "Hint: it's the invisible part of air that keeps us alive!",
                "activity": "Take a walk and find three plants near your home. Draw them in your notebook!",
            },
            "plants": {
                "content": "**Plants Around Us** 🌱\n\nPlants are living things that make their own food!\n\n**Parts of a plant:**\n- **Roots** — drink water and hold the plant in the soil\n- **Stem** — carries water to the leaves\n- **Leaves** — catch sunlight to make food\n- **Flowers** — make seeds\n\n**Life cycle of a plant:**\n\nseed → sprout → young plant → plant with flowers → new seeds 🌻",
                "practice": "Which part of the plant makes food using sunlight?",
                "feedback": "Hint: it's the green part that loves the sun!",
                "activity": "Grow a bean in a cup of soil and record how it changes each day.",
            },
            "weather": {
                "content": "**Weather and Seasons** 🌦️\n\nWeather is what the sky and air are like outside right now:\n\n- ☀️ **Sunny** — few clouds and the sun warms us\n- 🌧️ **Rainy** — water falls from the clouds\n- ☁️ **Cloudy** — clouds cover the sky\n- 💨 **Windy** — moving air we can feel but cannot see!\n\n**Seasons:** In many places the year has a **dry season** and a **rainy season**.\n\n**Measuring weather:** scientists use a **thermometer** to measure temperature and a **rain gauge** to measure rainfall.",
                "practice": "Which tool would you use to measure how hot or cold it is?",
                "feedback": "Hint: it's a tool with a scale and liquid inside!",
                "activity": "Record the weather every day for one week and draw a symbol for each day.",
            },
            "osmosis": {
                "content": "**How Plants Drink Water (Osmosis)** 💧\n\nOsmosis is how water moves into a plant's roots!\n\n1. **Roots** are like tiny straws in the soil\n2. **Water moves** from the wet soil, through the roots, into the plant\n3. **The water travels** up the stem to the leaves\n\n**Why it matters:** without osmosis, plants could not drink and would dry up. Osmosis happens in our bodies too — it's how our cells take in water!\n\n**Try it at home:** put a dry raisin in a cup of water overnight — osmosis will make it plump again! 🍇",
                "practice": "Which part of the plant drinks water from the soil?",
                "feedback": "Hint: it's the part under the ground!",
                "activity": "Put a white flower in colored water and watch osmosis color its petals.",
            },
            "machines": {
                "content": "**Simple Machines** 🔧\n\nSimple machines make work easier! They have few or no moving parts:\n\n- **Lever** — a bar that turns on a point (a see-saw, a bottle opener)\n- **Pulley** — a wheel with a rope (a flag pole, a well with a bucket)\n- **Wheel and axle** — helps things roll (a bicycle, a cart)\n- **Inclined plane** — a ramp (a slide, a road up a hill)\n\n**Why it matters:** simple machines help us lift, pull, and move heavy things with much less effort!",
                "practice": "Which simple machine uses a wheel and a rope to lift things?",
                "feedback": "Hint: think of a flag pole!",
                "activity": "Find three simple machines at home and draw them in your notebook.",
            },
            "plantwater": {
                "content": "**Why Plants Need Water** 💧🌱\n\nPlants need water to live and grow, just like you!\n\n- **Making food:** leaves use water + sunlight + air to make food for the plant\n- **Standing tall:** water fills the stem and keeps the plant upright\n- **Growing:** water carries food from the soil to every part of the plant\n\n**Without enough water, a plant wilts** — its leaves droop and it looks sad. Give it a good drink, and it stands up again! 🌻",
                "practice": "Name two things a plant needs to make its own food.",
                "feedback": "Hint: one comes from the sky in the morning, one comes from the soil!",
                "activity": "Water one plant every day and skip another for a week. Compare how they grow!",
            },
            "matter": {
                "content": "**The Three States of Matter** 🧊💧☁️\n\nEverything around us is made of matter — and it comes in three states:\n\n1. **Solid** — keeps its shape (ice, stone, a pencil)\n2. **Liquid** — flows and takes the shape of its container (water, milk)\n3. **Gas** — spreads out to fill the space (steam, the air)\n\n**Fun fact:** water can be all three!\n\nIce 🧊 (solid) → water 💧 (liquid) → steam ☁️ (gas)",
                "practice": "What do we call water when it is frozen solid?",
                "feedback": "Hint: you put it in your drink to keep it cold!",
                "activity": "Find one solid, one liquid, and one gas in your kitchen.",
            },
            "water": {
                "content": "**The Water Cycle**\n\nThe water cycle describes how water moves through the environment:\n\n1. **Evaporation** - Sun heats water (rivers, lakes, oceans), turning it into water vapor that rises into the air\n2. **Condensation** - Water vapor cools in the atmosphere and forms clouds\n3. **Precipitation** - Water falls from clouds as rain, snow, sleet, or hail\n4. **Collection** - Water gathers in rivers, lakes, and oceans, starting the cycle again\n\n**Why it's important:** The water cycle keeps Earth's water supply fresh and available for all living things!\n\n**Fun fact:** The water you drink today might have been a dinosaur's bath water millions of years ago!",
                "practice": "What is the process called when water turns into vapor?",
                "feedback": "Hint: think about a puddle on a sunny day — where does the water go?",
                "activity": "Draw the water cycle and label each stage.",
            },
            "default": {
                "content": "**Welcome to Science for Grade 3!**\n\nLet's explore the amazing world around us:\n\n🌱 **Plants**\n   - Parts of a plant and their functions\n   - Life cycle of a plant\n   - How plants make their own food\n\n🌍 **The Water Cycle**\n   - Evaporation, condensation, precipitation\n   - Importance of water to life\n   - Water conservation\n\n🌦️ **Weather and Climate**\n   - Types of weather\n   - Measuring weather\n   - Seasons and their effects\n\n🔬 **Simple Machines**\n   - Levers, pulleys, and wheels\n   - How simple machines make work easier\n   - Everyday examples\n\n**What would you like to discover today?**",
                "practice": "Name the three states of water.",
                "feedback": "Hint: one state is solid, one is liquid, and one is a gas — can you name them?",
                "activity": "Observe and record the weather for a week.",
            },
        },
        "fr": {
            "oxygen": {
                "content": "**L'oxygène et l'air** 🌬️\n\nL'air est partout autour de nous — et **l'oxygène** est la partie de l'air dont les humains et les animaux ont besoin pour vivre !\n\n1. **Nous respirons l'oxygène** — notre corps l'utilise pour tirer de l'énergie de la nourriture\n2. **Les plantes produisent de l'oxygène** — pendant la journée, les plantes prennent l'air et libèrent de l'oxygène\n3. **L'oxygène est partout** — c'est l'un des gaz qui composent l'air autour de nous\n\n**Pourquoi c'est important :** sans oxygène, les humains et les animaux ne pourraient pas survivre. Les plantes gardent notre air frais — c'est pourquoi les arbres sont nos amis ! 🌳\n\n**Fait amusant :** un grand arbre peut produire chaque jour assez d'oxygène pour deux personnes !",
                "practice": "Que libèrent les plantes pendant la journée et dont nous avons besoin pour respirer ?",
                "feedback": "Indice : c'est la partie invisible de l'air qui nous garde en vie !",
                "activity": "Promenez-vous et trouvez trois plantes près de chez vous. Dessinez-les dans votre cahier !",
            },
            "plants": {
                "content": "**Les plantes autour de nous** 🌱\n\nLes plantes sont des êtres vivants qui fabriquent leur propre nourriture !\n\n**Les parties d'une plante :**\n- **Les racines** — boivent l'eau et tiennent la plante dans le sol\n- **La tige** — transporte l'eau vers les feuilles\n- **Les feuilles** — attrapent la lumière du soleil pour fabriquer la nourriture\n- **Les fleurs** — produisent les graines\n\n**Cycle de vie d'une plante :**\n\ngraine → pousse → jeune plante → plante avec fleurs → nouvelles graines 🌻",
                "practice": "Quelle partie de la plante fabrique la nourriture grâce au soleil ?",
                "feedback": "Indice : c'est la partie verte qui adore le soleil !",
                "activity": "Plantez une graine de haricot dans un gobelet et notez ses changements chaque jour.",
            },
            "weather": {
                "content": "**La météo et les saisons** 🌦️\n\nLa météo, c'est l'état du ciel et de l'air à l'extérieur en ce moment :\n\n- ☀️ **Ensoleillé** — peu de nuages et le soleil nous réchauffe\n- 🌧️ **Pluvieux** — l'eau tombe des nuages\n- ☁️ **Nuageux** — les nuages couvrent le ciel\n- 💨 **Venteux** — l'air en mouvement que l'on sent sans le voir !\n\n**Les saisons :** dans de nombreux endroits, l'année a une **saison sèche** et une **saison des pluies**.\n\n**Mesurer la météo :** les scientifiques utilisent un **thermomètre** pour la température et un **pluviomètre** pour la pluie.",
                "practice": "Quel outil utiliseriez-vous pour mesurer s'il fait chaud ou froid ?",
                "feedback": "Indice : c'est un outil avec une échelle et du liquide à l'intérieur !",
                "activity": "Notez la météo chaque jour pendant une semaine et dessinez un symbole pour chaque jour.",
            },
            "osmosis": {
                "content": "**Comment les plantes boivent (l'osmose)** 💧\n\nL'osmose, c'est la façon dont l'eau entre dans les racines d'une plante !\n\n1. **Les racines** sont comme de petites pailles dans le sol\n2. **L'eau se déplace** du sol mouillé, à travers les racines, vers la plante\n3. **L'eau monte** ensuite dans la tige jusqu'aux feuilles\n\n**Pourquoi c'est important :** sans osmose, les plantes ne pourraient pas boire et se dessécheraient. L'osmose se produit aussi dans notre corps — c'est ainsi que nos cellules absorbent l'eau !\n\n**Essayez à la maison :** mettez un raisin sec dans un verre d'eau pendant la nuit — l'osmose le fera regonfler ! 🍇",
                "practice": "Quelle partie de la plante boit l'eau du sol ?",
                "feedback": "Indice : c'est la partie sous la terre !",
                "activity": "Mettez une fleur blanche dans de l'eau colorée et regardez l'osmose colorer ses pétales.",
            },
            "machines": {
                "content": "**Les machines simples** 🔧\n\nLes machines simples facilitent le travail ! Elles ont peu ou pas de pièces mobiles :\n\n- **Le levier** — une barre qui tourne sur un point (une balançoire à bascule, un ouvre-bouteille)\n- **La poulie** — une roue avec une corde (un mât de drapeau, un puits avec un seau)\n- **La roue et l'essieu** — aide les choses à rouler (un vélo, une charrette)\n- **Le plan incliné** — une rampe (un toboggan, une route en montée)\n\n**Pourquoi c'est important :** les machines simples nous aident à soulever, tirer et déplacer des objets lourds avec beaucoup moins d'effort !",
                "practice": "Quelle machine simple utilise une roue et une corde pour soulever des objets ?",
                "feedback": "Indice : pensez à un mât de drapeau !",
                "activity": "Trouvez trois machines simples à la maison et dessinez-les dans votre cahier.",
            },
            "plantwater": {
                "content": "**Pourquoi les plantes ont besoin d'eau** 💧🌱\n\nLes plantes ont besoin d'eau pour vivre et grandir, tout comme vous !\n\n- **Fabriquer la nourriture :** les feuilles utilisent l'eau + la lumière du soleil + l'air pour fabriquer la nourriture\n- **Rester droites :** l'eau remplit la tige et garde la plante droite\n- **Grandir :** l'eau transporte la nourriture du sol vers toutes les parties de la plante\n\n**Sans assez d'eau, une plante fane** — ses feuilles retombent et elle paraît triste. Donnez-lui une bonne boisson, et elle se redresse ! 🌻",
                "practice": "Nommez deux choses dont une plante a besoin pour fabriquer sa nourriture.",
                "feedback": "Indice : l'une vient du ciel le matin, l'autre vient du sol !",
                "activity": "Arrosez une plante chaque jour et une autre jamais pendant une semaine. Comparez leur croissance !",
            },
            "matter": {
                "content": "**Les trois états de la matière** 🧊💧☁️\n\nTout ce qui nous entoure est de la matière — et elle existe en trois états :\n\n1. **Solide** — garde sa forme (la glace, la pierre, un crayon)\n2. **Liquide** — coule et prend la forme de son récipient (l'eau, le lait)\n3. **Gaz** — se répand partout (la vapeur, l'air)\n\n**Fait amusant :** l'eau peut être les trois !\n\nGlace 🧊 (solide) → eau 💧 (liquide) → vapeur ☁️ (gaz)",
                "practice": "Comment appelle-t-on l'eau quand elle est gelée solide ?",
                "feedback": "Indice : on en met dans les boissons pour les garder fraîches !",
                "activity": "Trouvez un solide, un liquide et un gaz dans votre cuisine.",
            },
            "water": {
                "content": "**Le cycle de l'eau**\n\nLe cycle de l'eau décrit comment l'eau se déplace dans l'environnement:\n\n1. **Évaporation** - Le soleil chauffe l'eau (rivières, lacs, océans), la transformant en vapeur qui monte dans l'air\n2. **Condensation** - La vapeur d'eau se refroidit dans l'atmosphère et forme des nuages\n3. **Précipitations** - L'eau tombe des nuages sous forme de pluie, neige, grêle\n4. **Collecte** - L'eau se rassemble dans les rivières, les lacs et les océans, commençant le cycle à nouveau\n\n**Pourquoi c'est important:** Le cycle de l'eau maintient l'approvisionnement en eau douce de la Terre disponible pour toutes les choses vivantes!\n\n**Fait amusant:** L'eau que vous buvez aujourd'hui aurait pu être l'eau du bain d'un dinosaure il y a des millions d'années!",
                "practice": "Quel est le processus appelé quand l'eau se transforme en vapeur?",
                "feedback": "Indice : pensez à une flaque d'eau un jour de soleil — où va l'eau ?",
                "activity": "Dessinez le cycle de l'eau et étiquetez chaque étape.",
            },
            "default": {
                "content": "**Bienvenue dans les Sciences pour la classe 3!**\n\nExplorons le monde amazant qui nous entoure:\n\n🌱 **Les Plantes**\n   - Parties d'une plante et leurs fonctions\n   - Cycle de vie d'une plante\n   - Comment les plantes fabriquent leur propre nourriture\n\n🌍 **Le Cycle de l'Eau**\n   - Évaporation, condensation, précipitations\n   - Importance de l'eau pour la vie\n   - Conservation de l'eau\n\n**Que souhaitez-vous découvrir aujourd'hui?**",
                "practice": "Nommez les trois états de l'eau.",
                "feedback": "Indice : un état est solide, un autre liquide, un autre gazeux — pouvez-vous les nommer ?",
                "activity": "Observez et enregistrez la météo pendant une semaine.",
            },
        },
    },
    "demo-french": {
        "en": {
            "default": {
                "content": "**French Language Learning for Grade 3**\n\nBonjour! Let's learn French together:\n\n📝 **Greetings**\n   - Bonjour = Hello / Good morning\n   - Salut = Hi (informal)\n   - Au revoir = Goodbye\n   - Merci = Thank you\n   - S'il vous plaît = Please\n\n🧑‍🤝‍🧑 **Introducing Yourself**\n   - Je m'appelle... = My name is...\n   - Comment tu t'appelles ? = What's your name?\n   - Ça va ? = How are you?\n   - Je vais bien = I'm fine\n\n🏠 **Common Words**\n   - la maison = the house\n   - l'école = the school\n   - le livre = the book\n   - le crayon = the pencil\n   - l'ami / l'amie = the friend\n\n**Practice:** Try saying these words out loud!\n\n**Activity:** Label objects in your classroom with French words.",
                "practice": "How do you say 'thank you' in French?",
                "feedback": "Great! Try using it in a sentence.",
                "activity": "Create a French-English picture dictionary.",
            },
        },
        "fr": {
            "default": {
                "content": "**Apprentissage du Français pour la Classe 3**\n\nBonjour ! Apprenons le français ensemble :\n\n📝 **Salutations**\n   - Bonjour = Hello / Good morning\n   - Salut = Hi (informel)\n   - Au revoir = Goodbye\n   - Merci = Thank you\n   - S'il vous plaît = Please\n\n🧑‍🤝‍🧑 **Se présenter**\n   - Je m'appelle... = My name is...\n   - Comment tu t'appelles ? = What's your name ?\n   - Ça va ? = How are you ?\n   - Je vais bien = I'm fine\n\n🏠 **Mots courants**\n   - la maison = the house\n   - l'école = the school\n   - le livre = the book\n   - le crayon = the pencil\n   - l'ami / l'amie = the friend\n\n**Pratique :** essayez de dire ces mots à haute voix !\n\n**Activité :** étiquetez les objets de votre classe avec des mots français.",
                "practice": "Comment dit-on 'merci' en français?",
                "feedback": "Super! Essayez de l'utiliser dans une phrase.",
                "activity": "Créez un dictionnaire illustré français-anglais.",
            },
        },
    },
    "demo-health": {
        "en": {
            "wash": {
                "content": "**Why Hand Washing is Important**\n\nWashing your hands properly is one of the best ways to stay healthy:\n\n✅ **Removes germs** - Gets rid of bacteria and viruses that can make you sick\n✅ **Prevents diseases** - Stops the spread of colds, flu, and other illnesses\n✅ **Protects others** - Keeps your friends and family from getting sick\n✅ **Keeps you in school** - Healthy students can learn better!\n\n**Proper hand washing technique:**\n1. **Wet** your hands with clean running water\n2. **Apply** soap and lather well\n3. **Scrub** for at least 20 seconds (sing Happy Birthday twice!)\n4. **Rinse** well under clean water\n5. **Dry** with a clean towel\n\n**When to wash:**\n- Before eating\n- After using the bathroom\n- After playing outside\n- After touching animals\n- When hands look dirty",
                "practice": "How long should you scrub your hands?",
                "feedback": "Hint: it's about as long as singing the Happy Birthday song twice!",
                "activity": "Time yourself washing your hands properly.",
            },
            "default": {
                "content": "**Health Education for Grade 3**\n\nStaying healthy helps you learn better! Let's learn about:\n\n🧼 **Personal Hygiene**\n   - Importance of hand washing\n   - Bathing regularly\n   - Brushing teeth properly\n   - Wearing clean clothes\n\n🍎 **Healthy Eating**\n   - Food groups and balanced meals\n   - Importance of fruits and vegetables\n   - Drinking enough water\n   - Limiting sugary foods\n\n🏃 **Exercise and Movement**\n   - Importance of physical activity\n   - Different types of exercise\n   - Safety during activities\n   - Rest and sleep\n\n🤒 **Preventing Illness**\n   - How germs spread\n   - Covering coughs and sneezes\n   - Staying home when sick\n   - Basic first aid\n\n**What would you like to learn about health?**",
                "practice": "Name one thing you can do to stay healthy.",
                "feedback": "Great choice! There are many ways to stay healthy.",
                "activity": "Create a poster about one health topic.",
            },
        },
        "fr": {
            "wash": {
                "content": "**Pourquoi le lavage des mains est important**\n\nSe laver les mains correctement est l'une des meilleures façons de rester en bonne santé:\n\n✅ **Élimine les germes** - Élimine les bactéries et virus qui peuvent vous rendre malade\n✅ **Prévient les maladies** - Arrête la propagation des rhumes, grippes et autres maladies\n✅ **Protège les autres** - Empêche vos amis et votre famille de tomber malades\n✅ **Vous garde à l'école** - Les élèves en bonne santé apprennent mieux!\n\n**Technique de lavage des mains appropriée:**\n1. **Mouillez** vos mains avec de l'eau propre\n2. **Appliquez** du savon et faites mousser\n3. **Frottez** pendant au moins 20 secondes (chantez Joyeux Anniversaire deux fois!)\n4. **Rincez** bien à l'eau propre\n5. **Séchez** avec une serviette propre\n\n**Quand se laver:**\n- Avant de manger\n- Après être allé aux toilettes\n- Après avoir joué dehors\n- Après avoir touché des animaux\n- Quand les mains paraissent sales",
                "practice": "Combien de temps devriez-vous frotter vos mains?",
                "feedback": "Indice : c'est environ le temps de chanter Joyeux Anniversaire deux fois !",
                "activity": "Chronométrez-vous en vous lavant les mains correctement.",
            },
            "default": {
                "content": "**Éducation à la Santé pour la Classe 3**\n\nRester en bonne santé vous aide à mieux apprendre! Apprenons:\n\n🧼 **Hygiène Personnelle**\n   - Importance du lavage des mains\n   - Se baigner régulièrement\n   - Se brosser les dents correctement\n   - Porter des vêtements propres\n\n🍎 **Alimentation Saine**\n   - Groupes alimentaires et repas équilibrés\n   - Importance des fruits et légumes\n   - Boire suffisamment d'eau\n   - Limiter les aliments sucrés\n\n🏃 **Exercice et Mouvement**\n   - Importance de l'activité physique\n   - Différents types d'exercices\n   - Sécurité pendant les activités\n   - Repos et sommeil\n\n🤒 **Prévention des Maladies**\n   - Comment les germes se propagent\n   - Se couvrir la bouche quand on tousse ou éternue\n   - Rester à la maison quand on est malade\n   - Premiers soins de base\n\n**Que souhaitez-vous apprendre sur la santé?**",
                "practice": "Nommez une chose que vous pouvez faire pour rester en bonne santé.",
                "feedback": "Bon choix! Il existe de nombreuses façons de rester en bonne santé.",
                "activity": "Créez une affiche sur un sujet de santé.",
            },
        },
    },
}


def _norm_text(s: str) -> str:
    """Normalize text so practice questions can be matched regardless of punctuation/case"""
    return re.sub(r"[^a-z0-9àâäéèêëîïôöùûüç ]+", " ", s.lower()).strip()


# Expected answers for the seeded practice questions. Keywords are regex
# fragments matched against the normalized answer; "number" extracts digits.
EXPECTED_ANSWERS: dict = {
    _norm_text("What is 8 × 5?"): {"number": 40, "answer": "8 × 5 = 40"},
    _norm_text("What is 15 + 27?"): {"number": 42, "answer": "15 + 27 = 42"},
    _norm_text("What is the process called when water turns into vapor?"): {
        "all": [r"evaporat"], "answer": "Evaporation",
    },
    _norm_text("Name the three states of water."): {
        "all": [r"solid|solide|ice|glace", r"liquid|liquide", r"gas|gaz|vapor|vapeur"],
        "answer": "Solid (ice), liquid (water), and gas (water vapor)",
    },
    _norm_text("What do plants release during the day that we need to breathe?"): {
        "all": [r"oxyg"], "answer": "Oxygen",
    },
    _norm_text("Which part of the plant makes food using sunlight?"): {
        "all": [r"leaf|leaves|feuille"], "answer": "The leaves",
    },
    _norm_text("Which tool would you use to measure how hot or cold it is?"): {
        "all": [r"thermom"], "answer": "A thermometer",
    },
    _norm_text("How do you say 'thank you' in French?"): {
        "all": [r"merci"], "answer": "Merci",
    },
    _norm_text("How long should you scrub your hands?"): {
        "number": 20, "answer": "About 20 seconds (as long as singing Happy Birthday twice)",
    },
    _norm_text("Name one thing you can do to stay healthy."): {
        "any": [r"wash|lavez|hygiene|hygiène", r"eat|manger|fruit|vegetable|légume", r"exercis|sport|jouer", r"sleep|dormir", r"water|eau|drink|boire", r"brush|brosse|dents"],
        "answer": "Any healthy habit counts (washing hands, eating well, exercising, sleeping enough…)",
    },
    _norm_text("Essayez ceci: 456 + 289 = ?"): {"number": 745, "answer": "456 + 289 = 745"},
    _norm_text("Quelle est la somme de 15 + 27?"): {"number": 42, "answer": "15 + 27 = 42"},
    _norm_text("Quel est le processus appelé quand l'eau se transforme en vapeur?"): {
        "all": [r"é?vaporation"], "answer": "L'évaporation",
    },
    _norm_text("Nommez les trois états de l'eau."): {
        "all": [r"solide|solid|glace|ice", r"liquide|liquid", r"gaz|gas|vapeur|vapor"],
        "answer": "Solide (glace), liquide (eau), et gaz (vapeur d'eau)",
    },
    _norm_text("Que libèrent les plantes pendant la journée et dont nous avons besoin pour respirer ?"): {
        "all": [r"oxyg"], "answer": "L'oxygène",
    },
    _norm_text("Quelle partie de la plante fabrique la nourriture grâce au soleil ?"): {
        "all": [r"feuille|leaf"], "answer": "Les feuilles",
    },
    _norm_text("Quel outil utiliseriez-vous pour mesurer s'il fait chaud ou froid ?"): {
        "all": [r"thermom"], "answer": "Le thermomètre",
    },
    _norm_text("Comment dit-on 'merci' en français?"): {
        "all": [r"merci"], "answer": "Merci",
    },
    _norm_text("Combien de temps devriez-vous frotter vos mains?"): {
        "number": 20, "answer": "Environ 20 secondes (le temps de chanter Joyeux Anniversaire deux fois)",
    },
    _norm_text("Nommez une chose que vous pouvez faire pour rester en bonne santé."): {
        "any": [r"lavez|wash|hygiène", r"manger|eat|fruit|légume", r"exercice|sport|jouer", r"dormir|sleep", r"eau|water|boire", r"brosse|dents|brush"],
        "answer": "Toute bonne habitude compte (se laver les mains, bien manger, bouger, dormir…)",
    },
}


def _grade_answer(message: str, expected: dict) -> bool:
    """Check a student's answer attempt against the expected answer spec"""
    norm = _norm_text(message)
    if not norm:
        return False
    if "number" in expected:
        return str(expected["number"]) in re.findall(r"\d+", norm)
    for kw in expected.get("all", []):
        if not re.search(kw, norm):
            return False
    if expected.get("any"):
        if not any(re.search(kw, norm) for kw in expected["any"]):
            return False
    return True


# Expected answers for the seeded practice questions. Keywords are regex
# fragments matched against the normalized answer; "number" extracts digits.
EXPECTED_ANSWERS: dict = {
    _norm_text("What is 8 × 5?"): {"number": 40, "answer": "8 × 5 = 40"},
    _norm_text("What is 15 + 27?"): {"number": 42, "answer": "15 + 27 = 42"},
    _norm_text("What is the process called when water turns into vapor?"): {
        "all": [r"evaporat"], "answer": "Evaporation",
    },
    _norm_text("Name the three states of water."): {
        "all": [r"solid|solide|ice|glace", r"liquid|liquide", r"gas|gaz|vapor|vapeur"],
        "answer": "Solid (ice), liquid (water), and gas (water vapor)",
    },
    _norm_text("What do plants release during the day that we need to breathe?"): {
        "all": [r"oxyg"], "answer": "Oxygen",
    },
    _norm_text("Which part of the plant makes food using sunlight?"): {
        "all": [r"leaf|leaves|feuille"], "answer": "The leaves",
    },
    _norm_text("Which tool would you use to measure how hot or cold it is?"): {
        "all": [r"thermom"], "answer": "A thermometer",
    },
    _norm_text("How do you say 'thank you' in French?"): {
        "all": [r"merci"], "answer": "Merci",
    },
    _norm_text("How long should you scrub your hands?"): {
        "number": 20, "answer": "About 20 seconds (as long as singing Happy Birthday twice)",
    },
    _norm_text("Name one thing you can do to stay healthy."): {
        "any": [r"wash|lavez|hygiene|hygiène", r"eat|manger|fruit|vegetable|légume", r"exercis|sport|jouer", r"sleep|dormir", r"water|eau|drink|boire", r"brush|brosse|dents"],
        "answer": "Any healthy habit counts (washing hands, eating well, exercising, sleeping enough…)",
    },
    _norm_text("Essayez ceci: 456 + 289 = ?"): {"number": 745, "answer": "456 + 289 = 745"},
    _norm_text("Try this: 523 - 178 = ?"): {"number": 345, "answer": "523 - 178 = 345"},
    _norm_text("Essayez ceci: 523 - 178 = ?"): {"number": 345, "answer": "523 - 178 = 345"},
    _norm_text("Which part of the plant drinks water from the soil?"): {
        "all": [r"root|racine"], "answer": "The roots",
    },
    _norm_text("Quelle partie de la plante boit l'eau du sol ?"): {
        "all": [r"racine|root"], "answer": "Les racines",
    },
    _norm_text("Which simple machine uses a wheel and a rope to lift things?"): {
        "all": [r"pulley|poulie"], "answer": "A pulley",
    },
    _norm_text("Quelle machine simple utilise une roue et une corde pour soulever des objets ?"): {
        "all": [r"poulie|pulley"], "answer": "La poulie",
    },
    _norm_text("Name two things a plant needs to make its own food."): {
        "all": [r"water|eau", r"sun|soleil|light|lumière"], "answer": "Water and sunlight (plus air from the sky!)",
    },
    _norm_text("Nommez deux choses dont une plante a besoin pour fabriquer sa nourriture."): {
        "all": [r"eau|water", r"soleil|sun|lumière|light"], "answer": "L'eau et la lumière du soleil (plus l'air !)",
    },
    _norm_text("What do we call water when it is frozen solid?"): {
        "all": [r"\bice\b|glace"], "answer": "Ice (la glace)",
    },
    _norm_text("Comment appelle-t-on l'eau quand elle est gelée solide ?"): {
        "all": [r"glace|\bice\b"], "answer": "La glace",
    },
    _norm_text("If you cut a pizza into 4 equal slices and eat 1 slice, what fraction is left?"): {
        "all": [r"\b3\b|three|trois", r"\b4\b|four|quart|quatre"], "answer": "3/4 (three quarters)",
    },
    _norm_text("Si vous coupez une pizza en 4 parts égales et que vous en mangez 1, quelle fraction reste-t-il ?"): {
        "all": [r"\b3\b|trois|three", r"4|quart|quatre"], "answer": "3/4 (trois quarts)",
    },
    _norm_text("Quelle est la somme de 15 + 27?"): {"number": 42, "answer": "15 + 27 = 42"},
    _norm_text("Quel est le processus appelé quand l'eau se transforme en vapeur?"): {
        "all": [r"é?vaporation"], "answer": "L'évaporation",
    },
    _norm_text("Nommez les trois états de l'eau."): {
        "all": [r"solide|solid|glace|ice", r"liquide|liquid", r"gaz|gas|vapeur|vapor"],
        "answer": "Solide (glace), liquide (eau), et gaz (vapeur d'eau)",
    },
    _norm_text("Que libèrent les plantes pendant la journée et dont nous avons besoin pour respirer ?"): {
        "all": [r"oxyg"], "answer": "L'oxygène",
    },
    _norm_text("Quelle partie de la plante fabrique la nourriture grâce au soleil ?"): {
        "all": [r"feuille|leaf"], "answer": "Les feuilles",
    },
    _norm_text("Quel outil utiliseriez-vous pour mesurer s'il fait chaud ou froid ?"): {
        "all": [r"thermom"], "answer": "Le thermomètre",
    },
    _norm_text("Comment dit-on 'merci' en français?"): {
        "all": [r"merci"], "answer": "Merci",
    },
    _norm_text("Combien de temps devriez-vous frotter vos mains?"): {
        "number": 20, "answer": "Environ 20 secondes (le temps de chanter Joyeux Anniversaire deux fois)",
    },
    _norm_text("Nommez une chose que vous pouvez faire pour rester en bonne santé."): {
        "any": [r"lavez|wash|hygiène", r"manger|eat|fruit|légume", r"exercice|sport|jouer", r"dormir|sleep", r"eau|water|boire", r"brosse|dents|brush"],
        "answer": "Toute bonne habitude compte (se laver les mains, bien manger, bouger, dormir…)",
    },
}


def _grade_answer(message: str, expected: dict) -> bool:
    """Check a student's answer attempt against the expected answer spec"""
    norm = _norm_text(message)
    if not norm:
        return False
    if "number" in expected:
        return str(expected["number"]) in re.findall(r"\d+", norm)
    for kw in expected.get("all", []):
        if not re.search(kw, norm):
            return False
    if expected.get("any"):
        if not any(re.search(kw, norm) for kw in expected["any"]):
            return False
    return True


def _topic_list(lang_data: dict, language: str) -> str:
    """List the topics this demo tutor can teach for the given document/language"""
    topics = [k for k in lang_data.keys() if k != "default"]
    names = {
        "oxygen": "oxygen and air",
        "plants": "plants",
        "weather": "weather",
        "water": "the water cycle",
        "osmosis": "how plants drink water (osmosis)",
        "machines": "simple machines",
        "plantwater": "why plants need water",
        "matter": "the three states of matter",
        "multiply": "multiplication",
        "add": "addition",
        "subtract": "subtraction",
        "fractions": "fractions",
        "wash": "hand washing and hygiene",
    }
    pretty = [names.get(t, t.replace("_", " ")) for t in topics]
    if language == "fr":
        return "les sujets : " + ", ".join(pretty)
    return "topics such as " + ", ".join(pretty)


def get_demo_response(document_id: str, message: str, language: str = "en", session_id: str | None = None, attempting: str | None = None) -> AIResponse:
    """Generate a demo response based on document, query, and session state.

    The tutor keeps a pending practice question per session so the student's
    next message can be graded against the expected answer. The client can
    pass `attempting` (the practice question text) to register the attempt.
    """
    # Find the document
    doc = next((d for d in DEMO_DOCUMENTS if d["id"] == document_id), None)
    if not doc:
        doc = DEMO_DOCUMENTS[0]

    subject_key = doc["id"]
    lang_data = DEMO_RESPONSES.get(subject_key, {}).get(language, DEMO_RESPONSES.get(subject_key, {}).get("en", {}))

    message_lower = message.lower()
    norm_message = _norm_text(message)
    sid = session_id or ""

    def _respond(content: str, *, verified: bool, sources: list, metadata: dict) -> AIResponse:
        return AIResponse(
            content=content,
            sources=sources,
            verified=verified,
            metadata=metadata,
            session_id=session_id,
        )

    def _grounded() -> list:
        return [{"doc_name": doc["name"], "page": 1}]

    # ---- 1. Grade a pending practice question ----
    pending = _pending_practice.get(sid)
    if not pending and attempting:
        # The client told us which practice question the student is attempting
        expected = EXPECTED_ANSWERS.get(_norm_text(attempting))
        pending = {
            "question": attempting,
            "expected": expected,
            "hint": "Take your time and do your best!",
        }
    if pending:
        expected = pending["expected"]
        if expected and _grade_answer(message, expected):
            # Correct!
            _pending_practice.pop(sid, None)
            if language == "fr":
                content = (
                    f"🎉 **Bravo, c'est exact !**\n\n"
                    f"**{pending['question']}**\n\n"
                    f"→ **{expected.get('answer', '')}**\n\n"
                    "Excellent travail ! Continuez comme ça ! 🌟"
                )
                feedback = "Excellent ! Bonne réponse !"
            else:
                content = (
                    f"🎉 **Correct — well done!**\n\n"
                    f"**{pending['question']}**\n\n"
                    f"→ **{expected.get('answer', '')}**\n\n"
                    "Excellent work! Keep it up! 🌟"
                )
                feedback = "Excellent — correct answer!"
            return _respond(content, verified=True, sources=_grounded(), metadata={
                "subject": doc["subject"],
                "difficulty": "beginner",
                "feedback": feedback,
                "graded": True,
                "correct": True,
            })
        # Wrong attempt: if the message looks like an answer (short, no question
        # mark, not a new topic request), prompt to try again and keep pending
        looks_like_answer = "?" not in message and len(message) < 120
        if looks_like_answer:
            # Hints are stored with a "Hint:"/"Indice:" prefix in some topics — strip it
            raw_hint = re.sub(r"^(hint|indice)\s*:?\s*", "", pending["hint"], flags=re.I)
            if language == "fr":
                content = (
                    "**Pas encore tout à fait !** 🤔\n\n"
                    f"💡 Indice : {raw_hint}\n\n"
                    "Essayez encore une fois — vous pouvez le faire ! 💪\n\n"
                    "(Ou dites-moi « nouvelle question » pour changer d'exercice.)"
                )
                feedback = "Pas encore correct — réessayez !"
            else:
                content = (
                    "**Not quite yet!** 🤔\n\n"
                    f"💡 Hint: {raw_hint}\n\n"
                    "Try once more — you can do it! 💪\n\n"
                    "(Or say \"new question\" to try a different one.)"
                )
                feedback = "Not correct yet — try again!"
            return _respond(content, verified=False, sources=[], metadata={
                "subject": doc["subject"],
                "difficulty": "beginner",
                "practice_question": pending["question"],
                "feedback": feedback,
                "graded": True,
                "correct": False,
            })

    # ---- 1b. "new question" skips the pending exercise ----
    if pending and re.search(r"new question|nouvelle question", message_lower):
        _pending_practice.pop(sid, None)
        pending = None

    # ---- 1c. Greetings get the topic welcome menu (honestly unverified) ----
    if re.match(r"^(hi|hello|hey|bonjour|salut|bonsoir|coucou|good (morning|afternoon|evening))\b", message_lower):
        return _respond(lang_data.get("default", {}).get("content", ""), verified=False, sources=[], metadata={
            "subject": doc["subject"],
            "difficulty": "beginner",
        })

    # ---- 2. Student sends a known practice question → set it as pending ----
    if norm_message:
        for subject_topics in DEMO_RESPONSES.values():
            for lang_topics in subject_topics.values():
                for topic_data in lang_topics.values():
                    practice_q = topic_data.get("practice", "")
                    if practice_q and _norm_text(practice_q) == norm_message:
                        expected = EXPECTED_ANSWERS.get(norm_message)
                        _pending_practice[sid] = {
                            "question": practice_q,
                            "expected": expected,
                            "hint": topic_data.get("feedback", "Take your time and do your best!"),
                        }
                        if language == "fr":
                            content = (
                                "**C'est la bonne question d'entraînement !** 🎯\n\n"
                                "Maintenant, à vous de jouer : envoyez-moi votre réponse dans le chat, "
                                "et je vous dirai si elle est correcte ! 💪"
                            )
                        else:
                            content = (
                                "**That's the practice question — now it's your turn!** 🎯\n\n"
                                "Send me your answer in the chat and I'll check it for you! 💪"
                            )
                        return _respond(content, verified=True, sources=_grounded(), metadata={
                            "subject": doc["subject"],
                            "difficulty": "beginner",
                            "practice_question": practice_q,
                            "awaiting_attempt": True,
                            "revision_activity": topic_data.get("activity", "Practice more."),
                        })

    # ---- 3. Student sends an exercise (e.g. "456 + 289 = ?") → guide, then grade ----
    exercise_match = (
        re.search(r"(\d+)\s*([+\-*×]|\bx\b)\s*(\d+)\s*=\s*\?", message)
        or re.search(r"what\s+is\s+(\d+)\s*([+\-*×]|\bx\b)\s*(\d+)", message_lower)
        or re.search(r"quelle\s+est\s+la\s+somme\s+de\s+(\d+)\s*(\+)\s*(\d+)", message_lower)
    )
    # If the student sends a known practice question (e.g. by clicking the
    # "Try this question" button), prompt them to attempt it — do NOT teach
    # the full lesson, which would give the answer away.
    norm_message = _norm_text(message)
    if norm_message:
        for subject_topics in DEMO_RESPONSES.values():
            for lang_topics in subject_topics.values():
                for topic_data in lang_topics.values():
                    practice_q = topic_data.get("practice", "")
                    if practice_q and _norm_text(practice_q) == norm_message:
                        if language == "fr":
                            content = (
                                "**C'est la bonne question d'entraînement !** 🎯\n\n"
                                "Maintenant, à vous de jouer : envoyez-moi votre réponse dans le chat, "
                                "et je vous dirai si elle est correcte ! 💪\n\n"
                                f"💡 {topic_data.get('feedback', 'Prenez votre temps et faites de votre mieux !')}"
                            )
                        else:
                            content = (
                                "**That's the practice question — now it's your turn!** 🎯\n\n"
                                "Send me your answer in the chat and I'll check it for you! 💪\n\n"
                                f"💡 {topic_data.get('feedback', 'Take your time and do your best!')}"
                            )
                        return AIResponse(
                            content=content,
                            sources=[{"doc_name": doc["name"], "page": 1}],
                            verified=True,
                            metadata={
                                "subject": doc["subject"],
                                "difficulty": "beginner",
                                "practice_question": practice_q,
                                "feedback": topic_data.get("feedback", "Take your time and do your best!"),
                                "revision_activity": topic_data.get("activity", "Practice more."),
                            },
                        )

    is_exercise = bool(
        exercise_match
    )
    if is_exercise and exercise_match:
        a, op, b = int(exercise_match.group(1)), exercise_match.group(2), int(exercise_match.group(3))
        if op in ("×", "*", "x"):
            result, sign = a * b, "×"
        elif op == "-":
            result, sign = a - b, "−"
        else:
            result, sign = a + b, "+"
        question = f"{a} {sign} {b} = ?"
        _pending_practice[sid] = {
            "question": question,
            "expected": {"number": result, "answer": f"{a} {op} {b} = {result}"},
            "hint": language == "fr" and "Alignez les nombres par valeur de position, colonne par colonne !" or "Align the numbers by place value and work column by column!",
        }
        if language == "fr":
            content = (
                "**À vous de jouer !** 🎯\n\n"
                f"Résolvons **{question}** ensemble :\n\n"
                "1. **Alignez les nombres par valeur de position**\n"
                "2. **Commencez par la colonne des unités**\n"
                "3. **Écrivez votre réponse** pour chaque colonne\n\n"
                "Envoyez-moi votre réponse et je vérifierai ! 💪"
            )
        else:
            content = (
                "**Your turn to try!** 🎯\n\n"
                f"Let's solve **{question}** together:\n\n"
                "1. **Align the numbers by place value**\n"
                "2. **Start with the units column** (the rightmost digit)\n"
                "3. **Write your answer** for each column\n\n"
                "Send me your answer and I'll check it! 💪"
            )
        return _respond(content, verified=True, sources=_grounded(), metadata={
            "subject": doc["subject"],
            "difficulty": "beginner",
            "practice_question": question,
            "awaiting_attempt": True,
        })
    if is_exercise:
        # Recognized exercise phrasing without a parseable expression
        if language == "fr":
            content = "**À vous de jouer !** 🎯\n\nRésolvez étape par étape, puis envoyez-moi votre réponse ! 💪"
        else:
            content = "**Your turn to try!** 🎯\n\nWork through it step by step, then send me your answer! 💪"
        return _respond(content, verified=True, sources=_grounded(), metadata={
            "subject": doc["subject"],
            "difficulty": "beginner",
        })

    # ---- 4. Topic keyword matching (first matching topic wins) ----
    topic_keywords = [
        ("osmosis", ["osmosis", "osmose", "raisin", "absorb"]),
        ("machines", ["machine", "lever", "pulley", "poulie", "levier", "inclined", "rampe", "see-saw", "balançoire"]),
        ("plantwater", ["plants need water", "plant needs water", "besoin d'eau", "pourquoi les plantes ont besoin"]),
        ("matter", ["matter", "states of", "state of", "matière", "états de la", "freeze", "melt", "steam", "geler", "fondre", "vapeur", "solide", "liquide"]),
        ("oxygen", ["oxygen", "oxygène", "air", "breathe", "respir", "lung", "poumon"]),
        ("plants", ["plant", "plante", "seed", "graine", "leaf", "leaves", "feuille", "flower", "fleur", "photosynthesis", "photosynthèse", "tree", "arbre", "root", "racine"]),
        ("weather", ["weather", "climate", "season", "rain", "météo", "climat", "saison", "cloud", "nuage", "wind", "vent", "storm", "orage", "thermometer", "thermomètre"]),
        ("water", ["water", "cycle", "eau", "evaporation", "évaporation", "condensation", "puddle", "flaque"]),
        ("fractions", ["fraction", "half", "halves", "quarter", "quarters", "demi", "quart", "1/2", "1/4", "pizza", "slice", "part", "moitié"]),
        ("subtract", ["subtract", "minus", "soustraction", "moins", "borrow", "emprunt", "take away", "difference", "différence", "enlever"]),
        ("multiply", ["multiply", "multiplication", "multiplie", "times", "×", "*"]),
        ("add", ["add", "addition", "additionne", "sum", "somme", "+", "carry", "retenue"]),
        ("wash", ["wash", "hygiene", "hygiène", "lavage", "germ", "microbe", "savon", "soap", "sick", "malade", "disease", "maladie"]),
    ]
    data = lang_data.get("default", {})
    matched_topic = None
    for topic_key, keywords in topic_keywords:
        if topic_key in lang_data and any(k in message_lower for k in keywords):
            data = lang_data[topic_key]
            matched_topic = topic_key
            break

    # ---- 5. Explicit request for a practice question ----
    wants_practice = bool(
        re.search(r"practice question|give me a (practice )?question|question.*practic|question d'entraînement|donnez-moi une question", message_lower)
    )
    if wants_practice:
        question = data.get("practice", "Try a practice question.")
        hint = data.get("feedback", "Take your time and do your best!")
        expected = None
        for subject_topics in DEMO_RESPONSES.values():
            for lang_topics in subject_topics.values():
                for topic_data in lang_topics.values():
                    if topic_data.get("practice") == question:
                        expected = EXPECTED_ANSWERS.get(_norm_text(question))
                        break
        _pending_practice[sid] = {
            "question": question,
            "expected": expected,
            "hint": hint,
        }
        if language == "fr":
            content = (
                f"**Voici une question d'entraînement pour vous !** 🎯\n\n> {question}\n\n"
                f"💡 {hint}\n\nEnvoyez-moi votre réponse et je vous dirai si elle est correcte ! 💪"
            )
        else:
            content = (
                f"**Here's a practice question for you!** 🎯\n\n> {question}\n\n"
                f"💡 {hint}\n\nSend me your answer and I'll tell you if it's correct! 💪"
            )
        return _respond(content, verified=True, sources=_grounded(), metadata={
            "subject": doc["subject"],
            "difficulty": "beginner",
            "practice_question": question,
            "awaiting_attempt": True,
            "revision_activity": data.get("activity", "Practice more."),
        })

    # ---- 6. Topic lesson (grounded in the curriculum) ----
    if matched_topic is not None:
        return _respond(data.get("content", ""), verified=True, sources=_grounded(), metadata={
            "subject": doc["subject"],
            "difficulty": "beginner",
            "practice_question": data.get("practice"),
            "revision_activity": data.get("activity"),
        })

    # ---- 7. Outside the canned topics: try the local LLM, then honest fallback ----
    llm_answer, model_label = get_llm_answer(message, doc.get("subject", "General"), doc.get("grade", "Grade 3"), language)
    if llm_answer:
        return _respond(llm_answer, verified=False, sources=[], metadata={
            "subject": doc["subject"],
            "difficulty": "beginner",
            "model": model_label,
        })

    if language == "fr":
        content = (
            "Désolé, je ne peux pas encore répondre à cette question. 🙈\n\n"
            f"Pour l'instant, je peux vous aider avec {_topic_list(lang_data, language)}.\n\n"
            "Essayez l'un de ces sujets, ou demandez une question d'entraînement !"
        )
    else:
        content = (
            "Sorry, I can't answer that question yet. 🙈\n\n"
            f"Right now I can help with {_topic_list(lang_data, language)}.\n\n"
            "Try one of those topics, or ask me for a practice question!"
        )
    return _respond(content, verified=False, sources=[], metadata={
        "subject": doc["subject"],
        "difficulty": "beginner",
    })


@router.post("", summary="Send a message", description="Send a message to the AI and get a response")
@router.post("", summary="Send a message", description="Send a message to the AI and get a response")
@router.post("/", summary="Send a message", description="Send a message to the AI and get a response")
async def chat(request: AIRequest) -> AIResponse:
    """
    Send a message to the AI tutor and receive a response.

    This endpoint:
    - Validates the message and the document
    - Grades a pending practice attempt for the session, if any
    - Generates a response grounded in the selected curriculum
    - Returns the response with sources and a session ID for follow-ups
    """
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    # Validate the document: must exist and be approved for student use
    doc = next((d for d in DEMO_DOCUMENTS if d["id"] == (request.document_id or "")), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("status") != "approved":
        raise HTTPException(status_code=404, detail="This document is not available for students")

    logger.info(f"Processing chat request for document: {request.document_id}, message: {message[:50]}...")

    session_id = request.session_id or f"session-{uuid.uuid4().hex[:8]}"

    # Run in a thread so a slow local-model call can't block other requests
    response = await asyncio.to_thread(
        get_demo_response,
        request.document_id,
        message,
        request.language,
        session_id=session_id,
        attempting=request.attempting,
    )

    logger.info(f"Generated response with {len(response.sources or [])} sources")
    return response


@router.post("/stream", summary="Stream a message", description="Send a message and receive a streaming response")
async def chat_stream(request: AIRequest):
    """
    Send a message and receive a streaming response.
    
    This is useful for:
    - Long responses that take time to generate
    - Showing thinking progress to users
    - Better user experience
    """
    logger.info(f"Starting stream for message: {request.message[:50]}...")
    
    # In demo mode, simulate streaming
    response = get_demo_response(
        request.document_id or "demo-math",
        request.message,
        request.language
    )
    
    async def generate():
        # Simulate streaming by yielding chunks
        content = response.content
        words = content.split()
        
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3])
            yield f"data: {chunk}\n\n"
            await asyncio.sleep(0.1)  # Simulate processing time
        
        # Yield the complete response at the end
        yield f"data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


@router.post("/start", summary="Start a new chat session", description="Start a new chat session")
async def start_chat(request: ChatStartRequest) -> ChatStartResponse:
    """Start a new chat session"""
    logger.info(f"Starting new chat session for document: {request.document_id}")
    
    session_id = f"session-{uuid.uuid4().hex[:8]}"
    
    # In production, you would:
    # 1. Create a new session in the database
    # 2. Set the document context
    # 3. Generate a welcome message
    
    return ChatStartResponse(
        session_id=session_id,
        message="Welcome! I'm your AI Learning Assistant. How can I help you today?"
    )


@router.get("/sessions/{session_id}", summary="Get chat session", description="Get messages from a chat session")
async def get_session(session_id: str) -> ChatSession:
    """Get all messages from a chat session"""
    logger.info(f"Getting session: {session_id}")
    
    # In demo mode, return a mock session
    return ChatSession(
        id=session_id,
        user_id="demo-user",
        document_id="demo-math",
        messages=[
            MessageResponse(
                id="msg-1",
                role="assistant",
                content="Hello! I'm your AI Learning Assistant. How can I help you today?",
                timestamp=datetime.now(),
                verified=True,
            )
        ],
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/history/{session_id}", summary="Get chat history", description="Get the full history of a chat session")
async def get_chat_history(session_id: str) -> List[MessageResponse]:
    """Get the full history of messages in a session"""
    logger.info(f"Getting chat history for session: {session_id}")
    
    # In demo mode, return mock messages
    return [
        MessageResponse(
            id="msg-1",
            role="assistant",
            content="Hello! I'm your AI Learning Assistant. How can I help you today?",
            timestamp=datetime.now(),
            verified=True,
        ),
        MessageResponse(
            id="msg-2",
            role="user",
            content="What is 245 + 123?",
            timestamp=datetime.now(),
        ),
        MessageResponse(
            id="msg-3",
            role="assistant",
            content="245 + 123 = 368",
            timestamp=datetime.now(),
            verified=True,
            sources=[{"doc_name": "Mathematics Curriculum - Grade 3", "page": 1}],
        ),
    ]


@router.get("/conversations", summary="List all conversations", description="List all chat conversations")
async def list_conversations() -> List[ConversationSummary]:
    """List all chat conversations for the current user"""
    logger.info("Listing all conversations")
    
    # In demo mode, return mock conversations
    return [
        ConversationSummary(
            session_id="session-1",
            document_name="Mathematics Curriculum - Grade 3",
            message_count=12,
            last_message=datetime.now(),
            topics=["Addition", "Subtraction", "Multiplication"],
        ),
        ConversationSummary(
            session_id="session-2",
            document_name="Science Curriculum - Grade 3",
            message_count=8,
            last_message=datetime.now(),
            topics=["Water Cycle", "Plants"],
        ),
    ]


@router.delete("/sessions/{session_id}", summary="Delete a chat session", description="Delete a chat session")
async def delete_session(session_id: str):
    """Delete a chat session"""
    logger.info(f"Deleting session: {session_id}")
    
    # In production, you would delete the session from the database
    return {"success": True, "message": "Session deleted successfully"}


@router.post("/feedback", summary="Provide feedback", description="Provide feedback on an AI response")
async def provide_feedback(
    session_id: str,
    message_id: str,
    rating: int,  # 1-5
    comment: Optional[str] = None,
    is_accurate: Optional[bool] = None,
):
    """Provide feedback on an AI response"""
    logger.info(f"Feedback received for message {message_id}: rating={rating}")
    
    # In production, you would save the feedback to the database
    return {
        "success": True,
        "message": "Thank you for your feedback!",
    }
