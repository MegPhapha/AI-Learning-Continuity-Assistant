// French translations for seeded curriculum documents and common terms.

type Lang = 'en' | 'fr'

const SUBJECTS_FR: Record<string, string> = {
  Mathematics: 'Mathématiques',
  Math: 'Mathématiques',
  Science: 'Sciences',
  French: 'Français',
  'Health Education': 'Éducation à la santé',
  Health: 'Santé',
}

const NAMES_FR: Record<string, string> = {
  'Mathematics Curriculum - Primary Grade 3': 'Programme de mathématiques - Primaire Classe 3',
  'Science Curriculum - Primary Grade 3': 'Programme de sciences - Primaire Classe 3',
  'French Curriculum - Primary Grade 3': 'Programme de français - Primaire Classe 3',
  'Health Education - Primary Grade 3': 'Éducation à la santé - Primaire Classe 3',
}

export function translateSubject(subject: string, language: Lang): string {
  if (language !== 'fr') return subject
  return SUBJECTS_FR[subject] ?? subject
}

export function translateGrade(grade: string, language: Lang): string {
  if (language !== 'fr') return grade
  return grade.replace(/Grade\s*(\d+)/i, 'Classe $1')
}

export function translateDocumentName(name: string, language: Lang): string {
  if (language !== 'fr') return name
  if (NAMES_FR[name]) return NAMES_FR[name]
  // Generic fallback for uploaded documents
  return name
    .replace(/Curriculum/i, 'Programme')
    .replace(/Grade\s*(\d+)/i, 'Classe $1')
}
