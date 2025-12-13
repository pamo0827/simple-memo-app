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
    }

    // URL to redirect to after sign in process completes
    const next = requestUrl.searchParams.get('next') || '/'
    return NextResponse.redirect(new URL(next, requestUrl.origin))
}
