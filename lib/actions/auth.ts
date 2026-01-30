'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export type AuthActionState = {
  error: string | null
}

export type ForgotPasswordActionState = {
  error: string | null
  success: string | null
}

export async function signIn(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = await createClient()

  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        full_name: username,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/auth/sign-up-success')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message, success: null }
  }

  return {
    error: null,
    success: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.',
  }
}

export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const supabase = await createClient()

  const accessToken = formData.get('accessToken') as string
  const refreshToken = formData.get('refreshToken') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!accessToken || !refreshToken) {
    return { error: 'El enlace de recuperación no es válido o ha expirado.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  if (!password || password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (sessionError) {
    return { error: sessionError.message }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password,
  })

  if (updateError) {
    return { error: updateError.message }
  }

  await supabase.auth.signOut()
  redirect('/auth/login?passwordReset=1')
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (profile as Profile) ?? null
}
