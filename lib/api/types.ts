// Frontend API types

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface RecipeData {
  type: 'recipe' | 'summary' | 'error'
  data: any
}

export interface ScrapeUrlRequest {
  url: string
  skipAI?: boolean
  useAI?: boolean
}

export interface UploadFileRequest {
  file: File
  skipAI?: boolean
  useAI?: boolean
}

export interface ContactRequest {
  name?: string
  email: string
  subject: string
  message: string
  user_id?: string | null
}
