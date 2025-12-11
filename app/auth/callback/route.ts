import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { downloadAndStoreAvatar } from '@/lib/avatar'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', requestUrl.origin))
    }

    if (session?.user) {
      const user = session.user

      // Check if this is a Twitter OAuth login
      const identities = user.identities || []
      const twitterIdentity = identities.find(id => id.provider === 'twitter')

      if (twitterIdentity) {
        // Extract avatar from user metadata
        const avatarUrl = user.user_metadata?.avatar_url ||
                         user.user_metadata?.picture ||
                         twitterIdentity.identity_data?.avatar_url

        if (avatarUrl) {
          // Download and store avatar
          const result = await downloadAndStoreAvatar(user.id, avatarUrl, 'twitter')

          if (result.success) {
            // Update user settings with avatar
            const { error: settingsError } = await supabase
              .from('user_settings')
              .upsert({
                user_id: user.id,
                avatar_url: result.avatarUrl,
                avatar_provider: 'twitter',
                avatar_storage_path: result.storagePath,
                nickname: user.user_metadata?.name || user.user_metadata?.full_name || null,
              }, {
                onConflict: 'user_id',
              })

            if (settingsError) {
              console.error('Failed to save avatar:', settingsError)
            }
          } else {
            console.error('Failed to download avatar:', result.error)
          }
        }
      }
    }

    // Redirect to home page
    return NextResponse.redirect(new URL('/recipes', requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
