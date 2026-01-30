'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export type UpsertVotesActionState = {
  error: string | null
}

export async function upsertVotes(
  _prevState: UpsertVotesActionState,
  formData: FormData,
): Promise<UpsertVotesActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  const sessionId = formData.get('sessionId') as string
  const votedForId = formData.get('votedForId') as string

  if (!sessionId || !votedForId) {
    return { error: 'Datos de sesión inválidos.' }
  }

  const scoreEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith('score:'))
    .map(([key, value]) => {
      const parameterId = key.replace('score:', '')
      const score = typeof value === 'string' && value.trim() !== '' ? Number.parseFloat(value) : Number.NaN
      return { parameterId, score }
    })

  if (scoreEntries.length === 0) {
    return { error: 'No hay notas para guardar.' }
  }

  for (const e of scoreEntries) {
    if (!e.parameterId) return { error: 'Categoría inválida.' }
    if (!Number.isFinite(e.score) || e.score < 0 || e.score > 10) {
      return { error: 'Las notas deben estar entre 0 y 10.' }
    }
  }

  const rows = scoreEntries.map((e) => ({
    session_id: sessionId,
    voter_id: user.id,
    voted_for_id: votedForId,
    parameter_id: e.parameterId,
    score: e.score,
  }))

  const { error } = await supabase.from('votes').upsert(rows, {
    onConflict: 'session_id,voter_id,voted_for_id,parameter_id',
  })

  if (error) {
    return {
      error:
        error.message +
        ' (Si esto ocurre al editar, revisa que exista policy UPDATE en la tabla votes para el votante.)',
    }
  }

  revalidatePath(`/dashboard/sessions/${sessionId}`)
  revalidatePath(`/admin/history/${sessionId}`)

  return { error: null }
}
