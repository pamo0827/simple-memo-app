/**
 * ContactApiService: Single Responsibility - Handle contact form submissions
 */

import type { ContactRequest, ApiResponse } from './types'

class ContactApiService {
  async submitContact(request: ContactRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'お問い合わせの送信に失敗しました',
        }
      }

      return {
        success: true,
        data: { message: data.message || 'お問い合わせを受け付けました' },
      }
    } catch (error) {
      console.error('[ContactApiService] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
      }
    }
  }
}

export const contactApiService = new ContactApiService()
