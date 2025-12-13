import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    // Default redirect target
    const next = requestUrl.searchParams.get('next')
    const redirectTo = next || '/recipes'
    const redirectUrl = new URL(redirectTo, requestUrl.origin)

    if (code) {
        try {
            const cookieStore = await cookies()
            const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) })

            // 安全策: セッション交換を試みる
            const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

            if (sessionError) {
                console.error('Callback: Session exchange error:', sessionError)
                // エラーがあってもリダイレクトは試みる
                return NextResponse.redirect(redirectUrl)
            }

            const user = session?.user

            if (user) {
                console.log('Callback: User found', user.id)

                // Try to find provider-specific identity (e.g. twitter)
                // (Sync logic preserved)
                try {
                    const identities = user.identities || []
                    const twitterIdentity = identities.find(id => id.provider === 'twitter')

                    // ... (Existing sync logic here) ...
                    // Prioritize metadata from signup, then identity data
                    const meta = user.user_metadata || {}
                    const identityData = twitterIdentity?.identity_data || {}

                    let nickname =
                        meta.nickname ||
                        meta.full_name ||
                        meta.name ||
                        meta.user_name ||
                        identityData.full_name ||
                        identityData.name ||
                        identityData.user_name ||
                        identityData.screen_name ||
                        identityData.nickname ||
                        identityData.preferred_username

                    let avatarUrl =
                        meta.avatar_url ||
                        meta.picture ||
                        meta.image ||
                        identityData.avatar_url ||
                        identityData.profile_image_url_https ||
                        identityData.profile_image_url ||
                        identityData.picture ||
                        identityData.image

                    // Twitter API Fetch
                    if (twitterIdentity && session?.provider_token) {
                        try {
                            const res = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
                                headers: {
                                    Authorization: `Bearer ${session.provider_token}`
                                }
                            })
                            if (res.ok) {
                                const twitterJson = await res.json()
                                const data = twitterJson.data
                                if (data) {
                                    if (data.name) nickname = data.name
                                    else if (data.username) nickname = data.username
                                    if (data.profile_image_url) avatarUrl = data.profile_image_url.replace('_normal', '')
                                }
                            }
                        } catch (apiError) {
                            console.error('Callback: Twitter API fetch error', apiError)
                        }
                    }

                    if (nickname || avatarUrl) {
                        const { data: existing } = await supabase
                            .from('user_settings')
                            .select('nickname')
                            .eq('user_id', user.id)
                            .single()

                        const updateData: any = {
                            user_id: user.id,
                            updated_at: new Date().toISOString()
                        }
                        if (avatarUrl) updateData.avatar_url = avatarUrl
                        if (!existing?.nickname && nickname) updateData.nickname = nickname

                        await supabase.from('user_settings').upsert(updateData, { onConflict: 'user_id' })
                    }
                } catch (syncError) {
                    console.error('Callback: Profile sync error (non-fatal):', syncError)
                    // Sync fail should not stop login
                }
            }
        } catch (e) {
            console.error('Callback: Unhandled error during Auth Callback:', e)
            // Critical fail, maybe redirect to login with error?
            // For now, redirect to destination anyway as fallback
        }
    }

    console.log('Callback: Redirecting to', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
}
