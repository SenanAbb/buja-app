import { redirect } from 'next/navigation'

import { getProfile } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getProfile()
  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
      </div>
    )
  }

  const since30d = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()

  const [{ count: activeCount }, { count: draftCount }, { count: closed30dCount }] = await Promise.all([
    supabase.from('voting_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('voting_sessions').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase
      .from('voting_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'closed')
      .gte('closed_at', since30d),
  ])

  const { data: activeSessions } = await supabase
    .from('voting_sessions')
    .select('id, name, status, started_at, created_at')
    .eq('status', 'active')
    .order('started_at', { ascending: false, nullsFirst: false })
    .limit(5)

  const activeSessionIds = (activeSessions ?? []).map((s) => s.id)
  const { data: activeParticipants } = activeSessionIds.length
    ? await supabase
        .from('session_participants')
        .select('session_id, has_voted')
        .in('session_id', activeSessionIds)
    : { data: [] as Array<{ session_id: string; has_voted: boolean | null }> }

  const participantAgg = new Map<string, { total: number; voted: number }>()
  for (const p of activeParticipants ?? []) {
    const key = p.session_id
    const current = participantAgg.get(key) || { total: 0, voted: 0 }
    current.total += 1
    if (p.has_voted) current.voted += 1
    participantAgg.set(key, current)
  }

  const participationAvg = (() => {
    const sessions = activeSessionIds.length
    if (!sessions) return null
    const ratios = activeSessionIds.map((id) => {
      const a = participantAgg.get(id)
      if (!a?.total) return 0
      return a.voted / a.total
    })
    const sum = ratios.reduce((acc, v) => acc + v, 0)
    return sum / ratios.length
  })()

  const { data: lastClosedSessions } = await supabase
    .from('voting_sessions')
    .select('id, name, status, closed_at')
    .eq('status', 'closed')
    .order('closed_at', { ascending: false, nullsFirst: false })
    .limit(5)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel de administración</h1>
        <p className="mt-1 text-muted-foreground">Métricas y sesiones</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sesiones activas</CardDescription>
            <CardTitle className="text-2xl">{activeCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sesiones en borrador</CardDescription>
            <CardTitle className="text-2xl">{draftCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cerradas (30 días)</CardDescription>
            <CardTitle className="text-2xl">{closed30dCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Participación media (activas)</CardDescription>
            <CardTitle className="text-2xl">
              {participationAvg === null ? '—' : `${Math.round(participationAvg * 100)}%`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Promedio de progreso por sesión activa</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Sesiones activas</CardTitle>
            <CardDescription>Progreso de participación</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activeSessions?.length ? (
              activeSessions.map((s) => {
                const agg = participantAgg.get(s.id)
                const total = agg?.total ?? 0
                const voted = agg?.voted ?? 0
                const percent = total ? Math.round((voted / total) * 100) : 0
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {voted}/{total} han votado
                      </div>
                    </div>
                    <Badge variant={percent === 100 ? 'secondary' : 'default'}>{percent}%</Badge>
                  </div>
                )
              })
            ) : (
              <div className="text-sm text-muted-foreground">No hay sesiones activas.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Últimas sesiones cerradas</CardTitle>
            <CardDescription>Histórico reciente</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {lastClosedSessions?.length ? (
              lastClosedSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                  <Badge variant="secondary">Cerrada</Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Aún no hay sesiones cerradas.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
