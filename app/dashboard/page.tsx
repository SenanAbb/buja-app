import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/actions/auth'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateSessionDialog } from '@/components/admin/create-session-dialog'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getProfile()

  const displayName = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || 'Usuario'
  const email = profile?.email || user.email || '—'
  const isAdmin = !!profile?.is_admin

  const { data: users } = isAdmin
    ? await supabase
        .from('profiles')
        .select('id, full_name, email, is_admin')
        .order('full_name', { ascending: true })
    : { data: [] as Array<any> }

  const { data: voteRows } = await supabase
    .from('votes')
    .select('score, parameter_id, voting_parameters(name)')
    .eq('voted_for_id', user.id)

  const totalVotes = voteRows?.length ?? 0
  const totalScore = (voteRows ?? []).reduce((acc, row) => acc + (row.score ?? 0), 0)
  const averageScore = totalVotes ? totalScore / totalVotes : null

  const byParameter = new Map<string, { name: string; sum: number; count: number }>()
  for (const row of voteRows ?? []) {
    const name = (row as unknown as { voting_parameters?: { name?: string } | null }).voting_parameters?.name
    const key = row.parameter_id ?? name ?? 'unknown'
    const existing = byParameter.get(key)
    const label = name || 'Categoría'
    if (!existing) {
      byParameter.set(key, { name: label, sum: row.score ?? 0, count: 1 })
    } else {
      existing.sum += row.score ?? 0
      existing.count += 1
    }
  }

  const averageByCategory = Array.from(byParameter.values())
    .map((v) => ({ name: v.name, avg: v.count ? v.sum / v.count : 0 }))
    .sort((a, b) => b.avg - a.avg)

  const { data: participantRows } = await supabase
    .from('session_participants')
    .select('session_id, has_voted, voted_at, voting_sessions(id, name, status, started_at, closed_at, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const lastSessions = (participantRows ?? []).map((row) => {
    const vs = (row as unknown as { voting_sessions?: any }).voting_sessions
    return {
      id: row.session_id as string,
      name: vs?.name as string | undefined,
      status: vs?.status as string | undefined,
      hasVoted: !!row.has_voted,
    }
  })

  const { data: activeParticipantRows } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('user_id', user.id)

  const activeSessionIds = (activeParticipantRows ?? []).map((r) => r.session_id as string).filter(Boolean)

  const { data: activeSessions } = activeSessionIds.length
    ? await supabase
        .from('voting_sessions')
        .select('id, name, status, started_at')
        .in('id', activeSessionIds)
        .eq('status', 'active')
    : { data: [] as Array<{ id: string; name: string; status: string; started_at: string | null }> }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hola, {displayName}</h1>
          <p className="mt-1 text-muted-foreground">Bienvenido al sistema de votación Buja</p>
        </div>
        {isAdmin ? <CreateSessionDialog users={(users ?? []) as any} /> : null}
      </div>

      {activeSessions?.length ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Tienes una sesión activa</CardTitle>
            <CardDescription>
              Participas en {activeSessions.length} sesión(es) activa(s). Entra en “Sesiones” para votar.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nota media (recibida)</CardDescription>
            <CardTitle className="text-2xl">
              {averageScore === null ? '—' : averageScore.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Basado en {totalVotes} votos</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rol</CardDescription>
            <CardTitle className="text-2xl">{isAdmin ? 'Admin' : 'Usuario'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isAdmin ? 'default' : 'secondary'}>{isAdmin ? 'Administrador' : 'Activo'}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Email</CardDescription>
            <CardTitle className="text-base font-medium text-foreground">{email}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Resultados medios</CardTitle>
          <CardDescription>Media total y por categoría</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">Media total</div>
              <div className="text-2xl font-semibold text-foreground">
                {averageScore === null ? '—' : averageScore.toFixed(2)}
              </div>
            </div>
            <Badge variant="secondary">{totalVotes} votos</Badge>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {averageByCategory.length ? (
              averageByCategory.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-sm tabular-nums text-muted-foreground">{item.avg.toFixed(2)}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Aún no tienes votos recibidos.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Últimas sesiones</CardTitle>
          <CardDescription>Sesiones en las que has participado recientemente</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {lastSessions.length ? (
            lastSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-foreground">{s.name || 'Sesión'}</div>
                  <div className="text-xs text-muted-foreground">Estado: {s.status || '—'}</div>
                </div>
                <Badge variant={s.hasVoted ? 'secondary' : 'default'}>
                  {s.hasVoted ? 'Votada' : 'Pendiente'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">Aún no participas en ninguna sesión.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
