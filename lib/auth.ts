import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export interface AuthResult {
  authenticated: boolean
  userId: string | null
  error?: string
}

/**
 * リクエストヘッダーからユーザーを認証
 * セキュリティ: userIdをリクエストボディから受け取らず、認証トークンから取得
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) {
    return {
      authenticated: false,
      userId: null,
      error: 'Authorization header is missing'
    }
  }

  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return {
      authenticated: false,
      userId: null,
      error: 'Invalid authorization token'
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        authenticated: false,
        userId: null,
        error: 'Invalid or expired token'
      }
    }

    return {
      authenticated: true,
      userId: user.id
    }
  } catch (error) {
    console.error('[Auth] Error authenticating user:', error)
    return {
      authenticated: false,
      userId: null,
      error: 'Authentication failed'
    }
  }
}
