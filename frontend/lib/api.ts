import { Document, AIResponse, Message, UploadResponse, TeacherStats, Assignment } from '../types'

// The assignments API wraps lists in { assignments: [...] } like the documents API
const toAssignmentArray = (data: any): Assignment[] =>
  Array.isArray(data) ? data : Array.isArray(data?.assignments) ? data.assignments : []

// Relative by default so API calls are same-origin (proxied by Next.js rewrites).
// This works through tunnels like ngrok, where localhost is unreachable.
// Set NEXT_PUBLIC_API_URL to override with an absolute backend URL.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'
// Health endpoint lives outside the /api prefix (e.g. http://localhost:8000/health)
const API_ROOT = API_BASE.startsWith('http') ? API_BASE.replace(/\/api\/?$/, '') : ''

// Helper to handle API errors
const handleApiError = async (response: Response) => {
  const data = await response.json().catch(() => ({}))
  const error = {
    message: data.message || 'An error occurred',
    code: data.code || response.status.toString(),
    status: response.status,
    details: data.details,
  }
  throw error
}

// Helper to normalize document list responses.
// The backend wraps lists in { documents: [...] } while some consumers expect a plain array.
const toDocumentArray = (data: any): Document[] =>
  Array.isArray(data) ? data : Array.isArray(data?.documents) ? data.documents : []

// Documents API
export const DocumentsAPI = {
  // Get all documents
  async getAll(): Promise<Document[]> {
    const response = await fetch(`${API_BASE}/documents`)
    if (!response.ok) await handleApiError(response)
    return toDocumentArray(await response.json())
  },

  // Get documents by status
  async getByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Document[]> {
    const response = await fetch(`${API_BASE}/documents?status=${status}`)
    if (!response.ok) await handleApiError(response)
    return toDocumentArray(await response.json())
  },

  // Get document by ID
  async getById(id: string): Promise<Document> {
    const response = await fetch(`${API_BASE}/documents/${id}`)
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Upload document
  async upload(file: File, metadata: { subject: string; grade: string; language: string }): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('subject', metadata.subject)
    formData.append('grade', metadata.grade)
    formData.append('language', metadata.language)

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Update document status
  async updateStatus(id: string, status: 'approved' | 'rejected', reason?: string): Promise<Document> {
    const response = await fetch(`${API_BASE}/documents/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Delete document
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Get demo documents
  async getDemoDocuments(): Promise<Document[]> {
    const response = await fetch(`${API_BASE}/documents/demo`)
    if (!response.ok) await handleApiError(response)
    return toDocumentArray(await response.json())
  },
}

// Chat API
export const ChatAPI = {
  // Send message
  async sendMessage(documentId: string, message: string, language: string = 'en', options?: { sessionId?: string; attempting?: string }): Promise<AIResponse> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, message, language, ...options }),
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Get chat history
  async getHistory(sessionId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE}/chat/history/${sessionId}`)
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Start new chat
  async startChat(documentId: string): Promise<{ sessionId: string }> {
    const response = await fetch(`${API_BASE}/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },
}

// Teacher API
export const TeacherAPI = {
  // Get teacher stats
  async getStats(): Promise<TeacherStats> {
    const response = await fetch(`${API_BASE}/teacher/stats`)
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Get flagged responses
  async getFlaggedResponses(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/teacher/flagged`)
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Review flagged response
  async reviewFlagged(id: string, action: 'dismiss' | 'confirm'): Promise<any> {
    const response = await fetch(`${API_BASE}/teacher/flagged/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },
}

// Admin API
export const AdminAPI = {
  // Get all users
  async getUsers(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/admin/users`)
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Get app config
  async getConfig(): Promise<any> {
    const response = await fetch(`${API_BASE}/admin/config`)
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  // Update config
  async updateConfig(config: any): Promise<any> {
    const response = await fetch(`${API_BASE}/admin/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },
}

// Assignments API (teacher-set targets & assignments)
export const AssignmentsAPI = {
  async getAll(type?: string, status?: string, language?: string): Promise<Assignment[]> {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (status) params.set('status', status)
    if (language) params.set('language', language)
    const qs = params.toString()
    const response = await fetch(`${API_BASE}/assignments${qs ? `?${qs}` : ''}`)
    if (!response.ok) await handleApiError(response)
    return toAssignmentArray(await response.json())
  },

  async create(payload: Omit<Assignment, 'id' | 'status' | 'createdAt' | 'submissions' | 'createdBy'>): Promise<Assignment> {
    const response = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  async update(id: string, payload: Partial<Assignment>): Promise<Assignment> {
    const response = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  async reviewSubmission(id: string, payload: { submissionId: string; feedback?: string; grade?: string; approved: boolean }): Promise<Assignment> {
    const response = await fetch(`${API_BASE}/assignments/${id}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },

  async remove(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) await handleApiError(response)
    return response.json()
  },
}

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_ROOT}/health`)
    return response.ok
  } catch {
    return false
  }
}

export default {
  DocumentsAPI,
  ChatAPI,
  TeacherAPI,
  AdminAPI,
  AssignmentsAPI,
  healthCheck,
}
