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

            const nickname =
                meta.nickname ||
                meta.full_name ||
                meta.name ||
                meta.user_name ||
                identityData.full_name || // Display Name
                identityData.name ||      // Display Name
                identityData.user_name || // Handle (@username)
                identityData.screen_name || // Handle (Legacy)
                identityData.nickname ||  // General
                identityData.preferred_username // OIDC standard

            const avatarUrl =
                meta.avatar_url ||
                meta.picture ||
                meta.image ||
                identityData.avatar_url ||
                identityData.profile_image_url_https || // Twitter secure URL
                identityData.profile_image_url ||       // Twitter URL
                identityData.picture ||                 // OIDC
                identityData.image

            console.log('Callback: Resolved profile', { nickname, avatarUrl })

            if (nickname || avatarUrl) {
                // Check if settings exist to avoid overwriting existing nickname if one exists
                const { data: existing } = await supabase
                    .from('user_settings')
                    .select('nickname, avatar_url')
                    .eq('user_id', user.id)
                    .single()

                const updateData: any = {
                    user_id: user.id,
                    updated_at: new Date().toISOString()
                }

                // If existing avatar is empty or we found a new one, update it (prioritize new one if existing is default/empty?)
                // Strategy: Always update avatar if we got one from provider, usually that's what user expects on login
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
