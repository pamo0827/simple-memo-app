// UserContextService: Single Responsibility - Handle user context and authentication
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth'
import { checkAndUpdateUsage } from '@/lib/free-tier'
import type { UserContext, ServiceResult } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export class UserContextService {
  /**
   * Get authenticated user context with settings
   */
  async getUserContext(request: NextRequest): Promise<ServiceResult<UserContext>> {
    try {
      // Authenticate user
      const authResult = await authenticateRequest(request)
      if (!authResult.authenticated || !authResult.userId) {
        return {
          success: false,
          error: '認証が必要です。',
          statusCode: 401
        }
      }

      const userId = authResult.userId

      // Check usage limits
      const usageCheck = await checkAndUpdateUsage(userId)
      if (!usageCheck.allowed) {
        return {
          success: false,
          error: usageCheck.errorMessage,
          statusCode: 429
        }
      }

      // Get user settings
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: settings } = await supabase
        .from('user_settings')
        .select('ai_summary_enabled, custom_prompt, summary_length')
        .eq('user_id', userId)
        .maybeSingle()

      const userContext: UserContext = {
        userId,
        isFreeTier: usageCheck.isFreeTier,
        apiKey: usageCheck.apiKey,
        settings: {
          ai_summary_enabled: settings?.ai_summary_enabled ?? true,
          custom_prompt: usageCheck.isFreeTier ? null : settings?.custom_prompt,
          summary_length: settings?.summary_length || 'medium'
        }
      }

      return {
        success: true,
        data: userContext
      }
    } catch (error) {
      console.error('[UserContextService] Error:', error)
      return {
        success: false,
        error: '認証処理に失敗しました。',
        statusCode: 500
      }
    }
  }

  /**
   * Get user context without incrementing usage count (for non-AI operations)
   */
  async getUserContextWithoutUsage(request: NextRequest): Promise<ServiceResult<Omit<UserContext, 'apiKey'> & { apiKey?: string }>> {
    try {
      const authResult = await authenticateRequest(request)
      if (!authResult.authenticated || !authResult.userId) {
        return {
          success: false,
          error: '認証が必要です。',
          statusCode: 401
        }
      }

      const userId = authResult.userId
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: settings } = await supabase
        .from('user_settings')
        .select('ai_summary_enabled, custom_prompt, summary_length, gemini_api_key')
        .eq('user_id', userId)
        .maybeSingle()

      const userContext = {
        userId,
        isFreeTier: !settings?.gemini_api_key,
        apiKey: settings?.gemini_api_key || undefined,
        settings: {
          ai_summary_enabled: settings?.ai_summary_enabled ?? true,
          custom_prompt: settings?.custom_prompt,
          summary_length: settings?.summary_length || 'medium'
        }
      }

      return {
        success: true,
        data: userContext
      }
    } catch (error) {
      console.error('[UserContextService] Error:', error)
      return {
        success: false,
        error: '認証処理に失敗しました。',
        statusCode: 500
      }
    }
  }
}

// Singleton instance
export const userContextService = new UserContextService()
