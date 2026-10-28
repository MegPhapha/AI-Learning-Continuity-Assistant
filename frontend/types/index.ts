// Message types for chat
import { Message as ChatMessage } from '../components/ChatPanel'

export interface Message extends ChatMessage {}

export interface Document {
  id: string
  name: string
  subject: string
  grade: string
  language?: string
  fileType: 'pdf' | 'docx' | 'txt'
  filePath?: string
  content?: string
  chunks?: Array<{
    text: string
    metadata: any
  }>
  embeddings?: number[]
  status: 'pending' | 'approved' | 'rejected'
  uploadedAt: Date | string
  size: number
  pageCount?: number
  approvedBy?: string
  approvedAt?: Date | string
  rejectedReason?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  language?: 'en' | 'fr'
  createdAt: Date
}

export interface ChatSession {
  id: string
  userId: string
  documentId?: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  title?: string
}

export interface AIResponse {
  content: string
  sources: Array<{ docName: string; page?: number }>
  verified: boolean
  metadata: {
    subject?: string
    difficulty?: string
    practiceQuestion?: string
    feedback?: string
    revisionActivity?: string
  }
}

export interface TeacherStats {
  totalDocuments: number
  approvedDocuments: number
  pendingDocuments: number
  rejectedDocuments: number
  totalChats: number
  flaggedResponses: number
}

export interface Submission {
  id: string
  studentName: string
  submittedAt: string | Date
  response: string
  feedback?: string
  grade?: string
  reviewed: boolean
}

export interface Assignment {
  id: string
  type: 'daily_target' | 'assignment'
  title: string
  description: string
  subject: string
  grade: string
  language?: string
  targetValue?: number
  dueDate?: string | Date | null
  status: 'active' | 'completed' | 'reviewed'
  createdAt: string | Date
  createdBy?: string
  submissions: Submission[]
}

export interface LanguageOption {
  code: 'en' | 'fr'
  name: string
  nativeName: string
  flag: string
}

export interface ModelConfig {
  name: string
  provider: 'mistral' | 'ollama' | 'local'
  endpoint?: string
  apiKey?: string
  temperature: number
  maxTokens: number
}

export interface AppConfig {
  backendUrl: string
  model: ModelConfig
  language: 'en' | 'fr'
  demoMode: boolean
}

export interface APIError {
  message: string
  code?: string
  details?: any
}

export interface UploadResponse {
  success: boolean
  document?: Document
  error?: string
  message?: string
}

export interface SearchResponse {
  results: Array<{
    documentId: string
    documentName: string
    chunk: string
    score: number
    metadata: any
  }>
  query: string
  total: number
}
