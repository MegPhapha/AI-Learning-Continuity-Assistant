# AI Learning Continuity Assistant - FastAPI Backend

A modern FastAPI backend for the AI Learning Continuity Assistant.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip installed

### Installation

```bash
cd /Users/margaretfafa/AI\ Learning\ Continuity\ Assistant/backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`

### Access API Docs
- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`
- **OpenAPI JSON**: `http://localhost:8000/api/openapi.json`

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── api/                    # API routers
│   ├── __init__.py
│   ├── health.py          # Health check endpoints
│   ├── documents.py       # Document management
│   ├── chat.py            # Chat and AI endpoints
│   ├── teacher.py         # Teacher dashboard endpoints
│   └── admin.py           # Admin endpoints
├── models/                 # Pydantic models
│   ├── __init__.py
│   ├── document.py        # Document models
│   ├── chat.py            # Chat models
│   └── teacher.py         # Teacher models
├── services/               # Business logic services
│   └── __init__.py
├── utils/                  # Utility functions
│   └── __init__.py
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 🎯 Features

### 📄 Document Management
- Upload PDF, DOCX, TXT files
- Process and extract text
- Chunk and embed documents
- Store in vector database
- Approve/reject workflow
- Search and filter

### 💬 Chat & AI
- Send messages to AI
- Get responses with sources
- Streaming support
- Conversation history
- Session management
- Multi-language support

### 👩‍🏫 Teacher Dashboard
- Document statistics
- Flagged response monitoring
- Recent activity tracking
- Popular documents analytics

### 🛡️ Admin
- User management
- System configuration
- Analytics and insights
- Health monitoring

## 🌐 API Endpoints

### Health
- `GET /api/health` - Health check
- `GET /api/ready` - Readiness check
- `GET /api/demo-mode` - Demo mode status

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents/{id}` - Get document by ID
- `GET /api/documents/demo` - Get demo documents
- `POST /api/documents/upload` - Upload new document
- `PUT /api/documents/{id}/status` - Update document status
- `DELETE /api/documents/{id}` - Delete document
- `GET /api/documents/{id}/content` - Get document content

### Chat
- `POST /api/chat` - Send message to AI
- `POST /api/chat/stream` - Stream AI response
- `POST /api/chat/start` - Start new chat session
- `GET /api/chat/sessions/{id}` - Get chat session
- `GET /api/chat/history/{id}` - Get chat history
- `GET /api/chat/conversations` - List all conversations
- `DELETE /api/chat/sessions/{id}` - Delete session
- `POST /api/chat/feedback` - Provide feedback

### Teacher
- `GET /api/teacher/stats` - Get teacher statistics
- `GET /api/teacher/dashboard` - Get full dashboard
- `GET /api/teacher/flagged` - Get flagged responses
- `POST /api/teacher/flagged` - Create flagged response
- `PUT /api/teacher/flagged/{id}` - Review flagged response
- `DELETE /api/teacher/flagged/{id}` - Delete flagged response
- `GET /api/teacher/users` - Get teacher users
- `GET /api/teacher/users/me` - Get current teacher
- `GET /api/teacher/recent-activity` - Get recent activity

### Admin
- `GET /api/admin/config` - Get system configuration
- `PUT /api/admin/config` - Update configuration
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/{id}` - Get user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/analytics` - Get system analytics
- `GET /api/admin/health-check` - Admin health check

## 📦 Dependencies

### Required
- FastAPI - Web framework
- Uvicorn - ASGI server
- Pydantic - Data validation
- Python-multipart - File upload handling
- PyYAML - YAML configuration

### For Document Processing
- PyPDF2 - PDF parsing
- python-docx - DOCX parsing
- sentence-transformers - Embeddings
- faiss-cpu - Vector search

### For AI Models
- transformers - HuggingFace models
- torch - PyTorch
- accelerate - Acceleration library
- tiktoken - Token counting

### For Local Inference
- ollama - Ollama client

### For HTTP
- httpx - Async HTTP client

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server settings
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS settings
CORS_ORIGINS=*  # Or specific origins

# AI Model settings
INFERENCE_BACKEND=cloud  # or "ollama"
MISTRAL_API_KEY=your_api_key
OLLAMA_MODEL=mistral

# File upload settings
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# Database (future)
DATABASE_URL=
```

## 🤖 AI Integration

### Cloud (Mistral)
```bash
# Set API key
export MISTRAL_API_KEY=your_api_key

# Use in code
from mistralai.client import MistralClient
client = MistralClient(api_key=os.getenv("MISTRAL_API_KEY"))
```

### Local (Ollama)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull mistral

# Run with GPU support
ollama run mistral
```

### Embeddings
```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(text)
```

## 🗃️ Data Storage

### Current Implementation
- **In-memory storage** for demo mode
- Fast and simple
- No database required
- Data lost on restart

### Future Enhancements
- PostgreSQL for relational data
- Qdrant or Weaviate for vector database
- Redis for caching
- S3 or local storage for files

## 📊 Data Models

### Document
```python
class Document:
    id: str
    name: str
    subject: str
    grade: str
    language: str
    file_type: FileType  # pdf, docx, txt
    status: DocumentStatus  # pending, approved, rejected
    uploaded_at: datetime
    size: int
    page_count: Optional[int]
    content: Optional[str]
    chunks: Optional[List[dict]]
    embeddings: Optional[List[List[float]]]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    rejected_reason: Optional[str]
```

### Chat Message
```python
class Message:
    id: str
    role: str  # user or assistant
    content: str
    timestamp: datetime
    is_streaming: Optional[bool]
    verified: Optional[bool]
    sources: Optional[List[SourceReference]]
    metadata: Optional[dict]
```

### AI Response
```python
class AIResponse:
    content: str
    sources: List[SourceReference]
    verified: bool
    metadata: dict
    session_id: Optional[str]
```

## 🚀 Deployment

### Docker

```bash
# Build the image
docker build -t ai-learning-backend .

# Run the container
docker run -p 8000:8000 -v .:/app ai-learning-backend
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - INFERENCE_BACKEND=ollama
      - MAX_FILE_SIZE=10485760
```

### Production with Gunicorn

```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Systemd Service

```ini
[Unit]
Description=AI Learning Backend
After=network.target

[Service]
User=youruser
WorkingDirectory=/path/to/backend
ExecStart=/path/to/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## 📈 Performance

### Optimizations
- Async I/O with FastAPI
- Connection pooling for database
- Caching for frequent queries
- Streaming for long responses
- Batch processing for embeddings

### Benchmarks (estimated)
- Request latency: < 100ms (simple), < 5s (with AI)
- Concurrent users: 100+ (depends on hardware)
- File upload: < 10MB recommended
- Embedding: ~100-200ms per document

## 🐛 Troubleshooting

### "Module not found"
```bash
pip install -r requirements.txt
```

### "Port already in use"
```bash
# Change port
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### "CUDA out of memory"
```bash
# Reduce batch size or use smaller model
# Or use CPU instead of GPU
```

### "API key not found"
```bash
# Set environment variable
export MISTRAL_API_KEY=your_api_key
```

### "File too large"
```bash
# Increase max file size in config
MAX_FILE_SIZE=20971520  # 20MB
```

## 📝 License

MIT License - Feel free to use this code for your projects!

## 🙏 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions or issues:
- Check the documentation
- Review the API endpoints
- Test with Swagger UI
- Check logs in `backend.log`

---

**Version**: 1.0.0  
**Last Updated**: October 2024  
**Status**: ✅ Ready for Production
