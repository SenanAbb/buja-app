import { redirect } from 'next/navigation'

import { AddParticipantsDialog } from '@/components/session/add-participants-dialog'
import { SessionVoting } from '@/components/session/session-voting'
import { getProfile } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: session } = await supabase
    .from('voting_sessions')
    .select('id, name, status')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sesión no encontrada</h1>
        <p className="text-sm text-muted-foreground">La sesión no existe o no es accesible.</p>
      </div>
    )
  }

  const { data: participantRow } = await supabase
    .from('session_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!participantRow) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sin acceso</h1>
        <p className="text-sm text-muted-foreground">No participas en esta sesión.</p>
      </div>
    )
  }

  const { data: participants } = await supabase
    .from('session_participants')
    .select('user_id, profiles(id, full_name)')
    .eq('session_id', sessionId)

  const existingParticipantIds = (participants ?? []).map((p) => p.user_id as string).filter(Boolean)

  const profile = await getProfile()
  const isAdmin = !!profile?.is_admin

  const { data: allUsers } = isAdmin
    ? await supabase
        .from('profiles')
        .select('id, full_name, email, is_admin')
        .order('full_name', { ascending: true })
    : { data: [] as Array<any> }

  const votableParticipants = (participants ?? [])
    .map((r) => (r as unknown as { profiles?: { id: string; full_name: string } | null }).profiles)
    .filter(Boolean)
    .filter((p) => p!.id !== user.id)
    .map((p) => ({ id: p!.id, full_name: p!.full_name }))

  const { data: parameters } = await supabase
    .from('voting_parameters')
    .select('id, name')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const { data: existingVotes } = await supabase
    .from('votes')
    .select('voted_for_id, parameter_id, score')
    .eq('session_id', sessionId)
    .eq('voter_id', user.id)

  const { data: allVotes } = await supabase
    .from('votes')
    .select('voted_for_id, score')
    .eq('session_id', sessionId)

  const avgAgg = new Map<string, { sum: number; count: number }>()
  for (const v of allVotes ?? []) {
    const current = avgAgg.get(v.voted_for_id) || { sum: 0, count: 0 }
    current.sum += v.score ?? 0
    current.count += 1
    avgAgg.set(v.voted_for_id, current)
  }

  const participantAverages: Record<string, number | null> = {}
  for (const p of votableParticipants) {
    const a = avgAgg.get(p.id)
    participantAverages[p.id] = a?.count ? a.sum / a.count : null
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{session.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Estado: {session.status}</p>
        </div>

        {isAdmin && session.status === 'active' ? (
          <AddParticipantsDialog
            sessionId={sessionId}
            users={(allUsers ?? []) as any}
            existingParticipantIds={existingParticipantIds}
          />
        ) : null}
      </div>

      <SessionVoting
        sessionId={sessionId}
        sessionStatus={session.status as 'draft' | 'active' | 'closed'}
        parameters={(parameters ?? []) as any}
        participants={votableParticipants}
        existingVotes={(existingVotes ?? []) as any}
        participantAverages={participantAverages}
      />
    </div>
  )
}
