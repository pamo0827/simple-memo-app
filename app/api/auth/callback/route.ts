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
        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)
        const user = session?.user

        if (user) {
            console.log('Callback: User found', user.id)

            // Try to find provider-specific identity (e.g. twitter)
            const identities = user.identities || []
            const twitterIdentity = identities.find(id => id.provider === 'twitter')

            // Log for debugging
            if (twitterIdentity) {
                console.log('Callback: Twitter identity found', JSON.stringify(twitterIdentity, null, 2))
            } else {
                console.log('Callback: No Twitter identity found in identities array. Identities:', JSON.stringify(identities, null, 2))
            }

            // Prioritize metadata from signup, then identity data
            const meta = user.user_metadata || {}
            const identityData = twitterIdentity?.identity_data || {}

            // Log raw data for debugging
            console.log('Callback: Raw meta:', JSON.stringify(meta, null, 2))
            console.log('Callback: Raw identityData:', JSON.stringify(identityData, null, 2))

            // 初期値を設定（メタデータ由来）
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

            // 初期値を設定（メタデータ由来）
            let avatarUrl =
                meta.avatar_url ||
                meta.picture ||
                meta.image ||
                identityData.avatar_url ||
                identityData.profile_image_url_https ||
                identityData.profile_image_url ||
                identityData.picture ||
                identityData.image

            // Twitter APIから直接最新情報を取得を試みる
            if (twitterIdentity && session?.provider_token) {
                console.log('Callback: Attempting to fetch directly from Twitter API...')
                try {
                    const res = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
                        headers: {
                            Authorization: `Bearer ${session.provider_token}`
                        }
                    })

                    if (res.ok) {
                        const twitterJson = await res.json()
                        const data = twitterJson.data
                        console.log('Callback: Twitter API Response:', JSON.stringify(data, null, 2))

                        if (data) {
                            if (data.name) {
                                nickname = data.name
                                console.log('Callback: Updated nickname from API:', nickname)
                            }
                            if (data.profile_image_url) {
                                // iconUrl.replace('_normal', '') を適用して高解像度化
                                avatarUrl = data.profile_image_url.replace('_normal', '')
                                console.log('Callback: Updated avatarUrl from API:', avatarUrl)
                            }
                        }
                    } else {
                        const errorText = await res.text()
                        console.error('Callback: Failed to fetch from Twitter API', res.status, errorText)
                    }
                } catch (apiError) {
                    console.error('Callback: Error executing Twitter API fetch', apiError)
                }
            }

            console.log('Callback: Final resolved profile', { nickname, avatarUrl })

            if (nickname || avatarUrl) {
                // Check if settings exist to avoid overwriting existing nickname if one exists
                // Note: RLS policies must allow SELECT/INSERT/UPDATE for auth.uid() = user_id
                const { data: existing } = await supabase
                    .from('user_settings')
                    .select('nickname, avatar_url')
                    .eq('user_id', user.id)
                    .single()

                const updateData: any = {
                    user_id: user.id,
                    updated_at: new Date().toISOString()
                }

                // Strategy: Always update avatar if we got one (especially from API), usually that's what user expects on login
                if (avatarUrl) updateData.avatar_url = avatarUrl

                // Only set nickname if it doesn't exist or we have a better one and want to force it
                // Logic: If existing nickname is empty, set it.
                if (!existing?.nickname && nickname) {
                    updateData.nickname = nickname
                }

                // Log the update payload
                console.log('Callback: Updating user_settings with:', updateData)

                const { error: upsertError } = await supabase
                    .from('user_settings')
                    .upsert(updateData, { onConflict: 'user_id' })

                if (upsertError) {
                    console.error('Callback: Failed to sync user_settings', upsertError)
                } else {
                    console.log('Callback: Synced user_settings successfully')
                }
            }
        }
    }

    // URL to redirect to after sign in process completes
    const next = requestUrl.searchParams.get('next')
    // Default to /recipes to avoid landing page redirect loop logic
    const redirectTo = next || '/recipes'

    // Mobile debug: ensure we are redirecting to a valid absolute URL
    const redirectUrl = new URL(redirectTo, requestUrl.origin)
    console.log('Callback: Redirecting to', redirectUrl.toString())

    return NextResponse.redirect(redirectUrl)
}
