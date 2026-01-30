import { redirect } from 'next/navigation'

import { CreateSessionDialog } from '@/components/admin/create-session-dialog'
import { SessionsTabs } from '@/components/admin/sessions-tabs'
import { getProfile } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardSessionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getProfile()
  const isAdmin = !!profile?.is_admin

  const { data: users } = isAdmin
    ? await supabase
        .from('profiles')
        .select('id, full_name, email, is_admin')
        .order('full_name', { ascending: true })
    : { data: [] as Array<any> }

  const { data: participantRows } = await supabase
    .from('session_participants')
    .select('session_id, voting_sessions(id, name, status, created_at, closed_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const sessions = (participantRows ?? [])
    .map((row) => (row as unknown as { voting_sessions?: any }).voting_sessions)
    .filter(Boolean)
    .filter((s: any) => s.status === 'active' || s.status === 'closed')

  const sessionIds = sessions.map((s: any) => s.id as string)

  const { data: allParticipantRows } = sessionIds.length
    ? await supabase
        .from('session_participants')
        .select('session_id, profiles(id, full_name)')
        .in('session_id', sessionIds)
    : { data: [] as Array<any> }

  const participantsBySession = new Map<string, Array<{ id: string; full_name: string }>>()
  for (const row of allParticipantRows ?? []) {
    const sid = row.session_id as string
    const p = (row as unknown as { profiles?: { id: string; full_name: string } | null }).profiles
    if (!sid || !p) continue
    const arr = participantsBySession.get(sid) || []
    arr.push({ id: p.id, full_name: p.full_name })
    participantsBySession.set(sid, arr)
  }

  const { data: voteRows } = sessionIds.length
    ? await supabase.from('votes').select('session_id, score').in('session_id', sessionIds)
    : { data: [] as Array<{ session_id: string; score: number }> }

  const avgBySession = new Map<string, { sum: number; count: number }>()
  for (const row of voteRows ?? []) {
    const sid = row.session_id
    const current = avgBySession.get(sid) || { sum: 0, count: 0 }
    current.sum += row.score ?? 0
    current.count += 1
    avgBySession.set(sid, current)
  }

  const items = sessions.map((s: any) => {
    const agg = avgBySession.get(s.id)
    const average = agg?.count ? agg.sum / agg.count : null
    return {
      id: s.id as string,
      name: s.name as string,
      status: s.status as 'draft' | 'active' | 'closed',
      created_at: s.created_at as string,
      closed_at: (s.closed_at as string | null) ?? null,
      participants: participantsBySession.get(s.id as string) || [],
      average_score: s.status === 'closed' ? average : null,
    }
  })

  const active = items.filter((i) => i.status === 'active')
  const closed = items.filter((i) => i.status === 'closed')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sesiones</h1>
          <p className="mt-1 text-sm text-muted-foreground">Todas las sesiones en las que participas</p>
        </div>

        {isAdmin ? <CreateSessionDialog users={(users ?? []) as any} /> : null}
      </div>

      <SessionsTabs
        active={active}
        closed={closed}
        showClose
        canClose={isAdmin}
        hrefBase="/dashboard/sessions"
      />
    </div>
  )
}
