import { redirect } from 'next/navigation'

import { SessionsTabs } from '@/components/admin/sessions-tabs'
import { getProfile } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'

export default async function AdminHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getProfile()
  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const { data: sessions } = await supabase
    .from('voting_sessions')
    .select('id, name, status, created_at, closed_at')
    .in('status', ['active', 'closed'])
    .order('created_at', { ascending: false })

  const sessionIds = (sessions ?? []).map((s) => s.id)

  const { data: participantRows } = sessionIds.length
    ? await supabase
        .from('session_participants')
        .select('session_id, profiles(id, full_name)')
        .in('session_id', sessionIds)
    : { data: [] as Array<any> }

  const participantsBySession = new Map<string, Array<{ id: string; full_name: string }>>()
  for (const row of participantRows ?? []) {
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

  const items = (sessions ?? []).map((s) => {
    const agg = avgBySession.get(s.id)
    const average = agg?.count ? agg.sum / agg.count : null
    return {
      id: s.id,
      name: s.name,
      status: s.status as 'draft' | 'active' | 'closed',
      created_at: s.created_at,
      closed_at: s.closed_at,
      participants: participantsBySession.get(s.id) || [],
      average_score: s.status === 'closed' ? average : null,
    }
  })

  const active = items.filter((i) => i.status === 'active')
  const closed = items.filter((i) => i.status === 'closed')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todas las sesiones (participes o no)</p>
      </div>

      <SessionsTabs active={active} closed={closed} showClose canClose hrefBase="/admin/history" />
    </div>
  )
}
