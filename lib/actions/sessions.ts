'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export type CreateSessionActionState = {
  error: string | null
}

export async function createSession(
  _prevState: CreateSessionActionState,
  formData: FormData,
): Promise<CreateSessionActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  const name = (formData.get('name') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const participantIds = formData.getAll('participantIds').map(String).filter(Boolean)

  if (!name) {
    return { error: 'El nombre de la sesión es obligatorio.' }
  }

  if (participantIds.length === 0) {
    return { error: 'Debes seleccionar al menos un participante.' }
  }

  const { data: session, error: sessionError } = await supabase
    .from('voting_sessions')
    .insert({
      name,
      description,
      status: 'active',
      created_by: user.id,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return { error: sessionError?.message || 'No se pudo crear la sesión.' }
  }

  const uniqueParticipants = Array.from(new Set(participantIds))

  const { error: participantsError } = await supabase.from('session_participants').insert(
    uniqueParticipants.map((id) => ({
      session_id: session.id,
      user_id: id,
    })),
  )

  if (participantsError) {
    return { error: participantsError.message }
  }

  revalidatePath('/admin/history')
  revalidatePath('/dashboard/sessions')
  revalidatePath('/dashboard')

  return { error: null }
}

export type AddParticipantsActionState = {
  error: string | null
}

export async function addParticipantsToSession(
  _prevState: AddParticipantsActionState,
  formData: FormData,
): Promise<AddParticipantsActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  const sessionId = formData.get('sessionId') as string
  const participantIds = formData.getAll('participantIds').map(String).filter(Boolean)

  if (!sessionId) {
    return { error: 'Sesión inválida.' }
  }

  if (participantIds.length === 0) {
    return { error: 'Selecciona al menos un usuario.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'No autorizado.' }
  }

  const { data: session } = await supabase
    .from('voting_sessions')
    .select('status')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return { error: 'Sesión no encontrada.' }
  }

  if (session.status !== 'active') {
    return { error: 'Solo puedes añadir participantes si la sesión está activa.' }
  }

  const uniqueParticipants = Array.from(new Set(participantIds))
  const { error } = await supabase.from('session_participants').insert(
    uniqueParticipants.map((id) => ({
      session_id: sessionId,
      user_id: id,
    })),
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/sessions/${sessionId}`)
  revalidatePath('/dashboard/sessions')
  revalidatePath('/admin/history')

  return { error: null }
}

export type CloseSessionActionState = {
  error: string | null
}

export async function closeSession(
  _prevState: CloseSessionActionState,
  formData: FormData,
): Promise<CloseSessionActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  const sessionId = formData.get('sessionId') as string
  if (!sessionId) {
    return { error: 'Sesión inválida.' }
  }

  const { error } = await supabase
    .from('voting_sessions')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/history')
  revalidatePath('/admin')
  revalidatePath('/dashboard')

  return { error: null }
}
