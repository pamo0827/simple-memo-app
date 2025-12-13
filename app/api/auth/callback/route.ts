import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) })
        await supabase.auth.exchangeCodeForSession(code)

        // Sync user metadata to user_settings
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.user_metadata) {
            // prioritize nickname from metadata (sent during signup) over other fields
            const { avatar_url, picture, image, full_name, name, user_name, nickname: meta_nickname } = user.user_metadata
            const nickname = meta_nickname || full_name || name || user_name
            const finalAvatarUrl = avatar_url || picture || image

            if (finalAvatarUrl || nickname) {
                await supabase
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        avatar_url: finalAvatarUrl,
                        nickname: nickname,
                    }, { onConflict: 'user_id' })
            }
        }
    }

    // URL to redirect to after sign in process completes
    const next = requestUrl.searchParams.get('next')
    // Default to /recipes to avoid landing page redirect loop logic
    const redirectTo = next || '/recipes'
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
}
