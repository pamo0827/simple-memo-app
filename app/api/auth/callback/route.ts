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

                    console.log('Callback: Found identities:', identities.length)
                    console.log('Callback: Twitter identity exists:', !!twitterIdentity)
                    console.log('Callback: Provider token exists:', !!session?.provider_token)

                    // ... (Existing sync logic here) ...
                    // Prioritize metadata from signup, then identity data
                    const meta = user.user_metadata || {}
                    const identityData = twitterIdentity?.identity_data || {}

                    console.log('Callback: user_metadata keys:', Object.keys(meta))
                    console.log('Callback: identity_data keys:', Object.keys(identityData))

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

                    console.log('Callback: Initial nickname:', nickname)
                    console.log('Callback: Initial avatarUrl:', avatarUrl)

                    // Twitter API Fetch
                    if (twitterIdentity && session?.provider_token) {
                        console.log('Callback: Attempting Twitter API fetch')
                        try {
                            const res = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username', {
                                headers: {
                                    Authorization: `Bearer ${session.provider_token}`
                                }
                            })

                            console.log('Callback: Twitter API status:', res.status)

                            if (res.ok) {
                                const twitterJson = await res.json()
                                console.log('Callback: Twitter API response:', JSON.stringify(twitterJson))
                                const data = twitterJson.data
                                if (data) {
                                    if (data.name) nickname = data.name
                                    else if (data.username) nickname = data.username
                                    if (data.profile_image_url) avatarUrl = data.profile_image_url.replace('_normal', '')

                                    console.log('Callback: Updated nickname from API:', nickname)
                                    console.log('Callback: Updated avatarUrl from API:', avatarUrl)
                                }
                            } else {
                                const errorText = await res.text()
                                console.error('Callback: Twitter API error response:', errorText)
                            }
                        } catch (apiError) {
                            console.error('Callback: Twitter API fetch exception:', apiError)
                        }
                    } else {
                        console.log('Callback: Skipping Twitter API (no identity or token)')
                    }

                    console.log('Callback: Attempting to upsert user_settings')
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

                    // ニックネームがない場合のフォールバック
                    if (!nickname) {
                        const randomId = Math.random().toString(36).substring(2, 10);
                        nickname = `User-${randomId}`;
                        console.log('Callback: Generated fallback nickname:', nickname);
                    }

                    if (!existing?.nickname && nickname) updateData.nickname = nickname

                    console.log('Callback: Update data:', JSON.stringify(updateData))

                    const { error: upsertError } = await supabase.from('user_settings').upsert(updateData, { onConflict: 'user_id' })

                    if (upsertError) {
                        console.error('Callback: Upsert error:', upsertError)
                    } else {
                        console.log('Callback: Successfully updated user_settings')
                    }
                } catch (syncError) {
                    console.error('Callback: Profile sync error (non-fatal):', syncError)
                    // Sync fail should not stop login
                }
            }
        } catch (e) {
            console.error('Callback: Unhandled error during Auth Callback:', e)
        }
    }

    console.log('Callback: Redirecting to', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
}

