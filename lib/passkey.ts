/**
 * Passkey (WebAuthn) utility functions
 *
 * Provides utilities for:
 * - Registering new passkeys
 * - Authenticating with passkeys
 * - Managing passkey credentials
 */

import { supabase as defaultClient } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// Base64URLエンコード/デコード用ヘルパー関数
function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64URLDecode(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

interface PasskeyRegistrationOptions {
  email: string
  userId: string
}

interface PasskeyAuthenticationOptions {
  email?: string
}

export interface PasskeyCredential {
  id: string
  user_id: string
  credential_id: string
  public_key: string
  counter: number
  device_name?: string
  created_at: string
  last_used_at?: string
}

/**
 * パスキーが利用可能かチェック
 */
export function isPasskeyAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  )
}

/**
 * パスキーを登録
 */
export async function registerPasskey(
  options: PasskeyRegistrationOptions,
  deviceName?: string,
  supabaseClient?: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient || defaultClient
  if (!isPasskeyAvailable()) {
    return { success: false, error: 'このブラウザはパスキーをサポートしていません' }
  }

  try {
    const { email, userId } = options

    // チャレンジを生成
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // WebAuthn登録オプション
    const createOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'MEMOTTO',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: true,
        residentKey: 'required',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    }

    // パスキーを作成
    const credential = await navigator.credentials.create({
      publicKey: createOptions,
    }) as PublicKeyCredential

    if (!credential) {
      return { success: false, error: 'パスキーの作成に失敗しました' }
    }

    const response = credential.response as AuthenticatorAttestationResponse

    // 認証情報をSupabaseに保存
    const { error } = await supabase.from('passkeys').insert({
      user_id: userId,
      credential_id: base64URLEncode(credential.rawId),
      public_key: base64URLEncode(response.getPublicKey()!),
      counter: 0,
      device_name: deviceName || 'パスキー',
    })

    if (error) {
      console.error('パスキー保存エラー:', error)
      return { success: false, error: 'パスキーの保存に失敗しました' }
    }

    return { success: true }
  } catch (error) {
    console.error('パスキー登録エラー:', error)
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'パスキーの登録がキャンセルされました' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'パスキーの登録に失敗しました' }
  }
}

/**
 * パスキーで認証
 */
export async function authenticateWithPasskey(
  options: PasskeyAuthenticationOptions = {},
  supabaseClient?: SupabaseClient
): Promise<{ success: boolean; userId?: string; credentialId?: string; error?: string }> {
  const supabase = supabaseClient || defaultClient
  if (!isPasskeyAvailable()) {
    return { success: false, error: 'このブラウザはパスキーをサポートしていません' }
  }

  try {
    // チャレンジを生成
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // WebAuthn認証オプション
    const getOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname,
      timeout: 60000,
      userVerification: 'required',
    }

    // パスキーで認証
    const credential = await navigator.credentials.get({
      publicKey: getOptions,
    }) as PublicKeyCredential

    if (!credential) {
      return { success: false, error: 'パスキーの認証に失敗しました' }
    }

    const credentialId = base64URLEncode(credential.rawId)

    // Supabaseから対応するパスキー情報を取得
    const { data: passkey, error } = await supabase
      .from('passkeys')
      .select('*')
      .eq('credential_id', credentialId)
      .single()

    if (error || !passkey) {
      return { success: false, error: 'パスキーが見つかりません' }
    }

    // 最終使用日時を更新
    await supabase
      .from('passkeys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('credential_id', credentialId)

    return {
      success: true,
      userId: passkey.user_id,
      credentialId,
    }
  } catch (error) {
    console.error('パスキー認証エラー:', error)
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'パスキーの認証がキャンセルされました' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'パスキーの認証に失敗しました' }
  }
}

/**
 * ユーザーのパスキー一覧を取得
 */
export async function getUserPasskeys(userId: string, supabaseClient?: SupabaseClient): Promise<PasskeyCredential[]> {
  const supabase = supabaseClient || defaultClient
  const { data, error } = await supabase
    .from('passkeys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('パスキー取得エラー:', error)
    return []
  }

  return data || []
}

/**
 * パスキーを削除
 */
export async function deletePasskey(passkeyId: string, supabaseClient?: SupabaseClient): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient || defaultClient
  const { error } = await supabase
    .from('passkeys')
    .delete()
    .eq('id', passkeyId)

  if (error) {
    console.error('パスキー削除エラー:', error)
    return { success: false, error: 'パスキーの削除に失敗しました' }
  }

  return { success: true }
}

/**
 * パスキーのデバイス名を更新
 */
export async function updatePasskeyName(
  passkeyId: string,
  deviceName: string,
  supabaseClient?: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient || defaultClient
  const { error } = await supabase
    .from('passkeys')
    .update({ device_name: deviceName })
    .eq('id', passkeyId)

  if (error) {
    console.error('パスキー名更新エラー:', error)
    return { success: false, error: 'パスキー名の更新に失敗しました' }
  }

  return { success: true }
}
