// Service layer types and interfaces

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

export interface AIProcessingResult {
  type: 'recipe' | 'summary' | 'error'
  data: any
}

export interface ScrapingOptions {
  skipAI?: boolean
  useAI?: boolean
}

export interface UserContext {
  userId: string
  isFreeTier: boolean
  apiKey: string
  settings?: {
    ai_summary_enabled?: boolean
    custom_prompt?: string | null
    summary_length?: 'short' | 'medium' | 'long'
  }
}
