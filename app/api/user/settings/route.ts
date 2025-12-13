import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) })

        // セッション確認
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // サービスロールキーを使って取得（RLSを回避）
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseServiceKey) {
            const { createClient } = await import('@supabase/supabase-js')
            const adminSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                supabaseServiceKey,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                    }
                }
            )

            const { data, error } = await adminSupabase
                .from('user_settings')
                .select('*')
                .eq('user_id', session.user.id)
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                console.error('API Settings Get Error (Admin):', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ settings: data || null })
        } else {
            // 通常のクライアント
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', session.user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('API Settings Get Error:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ settings: data || null })
        }
    } catch (error) {
        console.error('API Settings Get Exception:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) })

        // セッション確認
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { settings } = body

        if (!settings) {
            return NextResponse.json({ error: 'Settings are required' }, { status: 400 })
        }

        // 更新データを準備
        const updateData = {
            user_id: session.user.id,
            ...settings,
            updated_at: new Date().toISOString()
        }

        // サービスロールキーを使って保存（RLSを回避する必要がある場合）
        // ただし、createRouteHandlerClientを使っている場合はユーザーとして実行される
        // RLSでブロックされているなら、Service Roleクライアントを使うべきだが、
        // まずは標準的な方法で試す。もしダメならService Roleに切り替える。

        // Adminクライアント作成（環境変数が必要）
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseServiceKey) {
            // Service Roleで実行して確実に保存
            const { createClient } = await import('@supabase/supabase-js')
            const adminSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                supabaseServiceKey,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                    }
                }
            )

            const { error } = await adminSupabase
                .from('user_settings')
                .upsert(updateData, { onConflict: 'user_id' })

            if (error) {
                console.error('API Settings Save Error (Admin):', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        } else {
            // 通常のクライアント
            const { error } = await supabase
                .from('user_settings')
                .upsert(updateData, { onConflict: 'user_id' })

            if (error) {
                console.error('API Settings Save Error:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API Settings Save Exception:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
