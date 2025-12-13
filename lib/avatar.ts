// Note: downloadAndStoreAvatar still imports from './supabase' (plain client).
// This is likely OK if it is used in server-side contexts where auth headers manage permissions or if called with service role key,
// or if the plain client somehow has session.
// However, for client-side uploads, we MUST use the authenticated client passed from the component.

import { supabase as defaultClient } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AvatarUploadResult {
  success: boolean
  avatarUrl?: string
  storagePath?: string
  error?: string
}

/**
 * Downloads image from URL and uploads to Supabase Storage
 * Used for Twitter OAuth avatar fetching
 */
export async function downloadAndStoreAvatar(
  userId: string,
  imageUrl: string,
  provider: 'twitter' | 'manual'
): Promise<AvatarUploadResult> {
  try {
    // Download image from URL
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { success: false, error: 'Failed to download image' }
    }

    const blob = await response.blob()

    // Determine file extension
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
    const fileName = `${userId}/avatar.${ext}`

    // Upload to Supabase Storage
    const { data, error } = await defaultClient.storage
      .from('avatars')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true, // Overwrite existing avatar
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = defaultClient.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return {
      success: true,
      avatarUrl: publicUrl,
      storagePath: fileName,
    }
  } catch (error) {
    console.error('Avatar download error:', error)
    return { success: false, error: 'Failed to process avatar' }
  }
}

/**
 * Upload avatar from File object (manual upload)
 * Validates file type and size before uploading
 */
export async function uploadAvatarFile(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<AvatarUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'ファイルは画像である必要があります' }
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: '画像は2MB以下である必要があります' }
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/avatar.${ext}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return {
      success: true,
      avatarUrl: publicUrl,
      storagePath: fileName,
    }
  } catch (error) {
    console.error('Avatar upload error:', error)
    return { success: false, error: 'アバターのアップロードに失敗しました' }
  }
}

/**
 * Delete avatar from storage
 */
export async function deleteAvatar(supabase: SupabaseClient, storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([storagePath])

    return !error
  } catch (error) {
    console.error('Avatar deletion error:', error)
    return false
  }
}

/**
 * Get default avatar URL (placeholder)
 * Uses UI Avatars service to generate personalized avatars based on nickname
 */
export function getDefaultAvatarUrl(nickname?: string | null): string {
  const name = nickname || 'User'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=f59e0b&color=fff&bold=true`
}
