import { redirect } from 'next/navigation'

import { getProfile } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminHistorySessionDetailPage({
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

  const profile = await getProfile()
  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const { data: session } = await supabase
    .from('voting_sessions')
    .select('id, name, status, created_at, closed_at')
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

  const { data: votes } = await supabase
    .from('votes')
    .select('voter_id, voted_for_id, parameter_id, score')
    .eq('session_id', sessionId)

  const { data: participants } = await supabase
    .from('session_participants')
    .select('user_id, profiles(id, full_name)')
    .eq('session_id', sessionId)

  const voterIds = Array.from(new Set((votes ?? []).map((v) => v.voter_id)))
  const votedForIds = Array.from(new Set((votes ?? []).map((v) => v.voted_for_id)))
  const userIds = Array.from(new Set([...voterIds, ...votedForIds]))
  const parameterIds = Array.from(new Set((votes ?? []).map((v) => v.parameter_id)))

  const [{ data: profiles }, { data: parameters }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    parameterIds.length
      ? supabase.from('voting_parameters').select('id, name').in('id', parameterIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))
  const parameterMap = new Map((parameters ?? []).map((p) => [p.id, p.name]))

  const participantList = (participants ?? [])
    .map((r) => (r as unknown as { profiles?: { id: string; full_name: string } | null }).profiles)
    .filter(Boolean)
    .map((p) => ({ id: p!.id, full_name: p!.full_name }))

  const participantCount = participantList.length
  const voteCount = votes?.length ?? 0

  const overall = (votes ?? []).reduce(
    (acc, v) => {
      acc.sum += Number(v.score) || 0
      acc.count += 1
      return acc
    },
    { sum: 0, count: 0 },
  )
  const overallAvg = overall.count ? overall.sum / overall.count : null

  const categoryAgg = new Map<string, { name: string; sum: number; count: number }>()
  const receivedAgg = new Map<string, { name: string; sum: number; count: number }>()
  const grouped = new Map<string, Map<string, Array<{ parameter: string; score: number }>>>()

  for (const v of votes ?? []) {
    const voterName = profileMap.get(v.voter_id) || '—'
    const votedForName = profileMap.get(v.voted_for_id) || '—'
    const categoryName = parameterMap.get(v.parameter_id) || '—'
    const score = Number(v.score)

    const ca = categoryAgg.get(v.parameter_id) || { name: categoryName, sum: 0, count: 0 }
    ca.sum += score
    ca.count += 1
    categoryAgg.set(v.parameter_id, ca)

    const ra = receivedAgg.get(v.voted_for_id) || { name: votedForName, sum: 0, count: 0 }
    ra.sum += score
    ra.count += 1
    receivedAgg.set(v.voted_for_id, ra)

    const byVotedFor = grouped.get(v.voter_id) || new Map<string, Array<{ parameter: string; score: number }>>()
    const list = byVotedFor.get(v.voted_for_id) || []
    list.push({ parameter: categoryName, score })
    byVotedFor.set(v.voted_for_id, list)
    grouped.set(v.voter_id, byVotedFor)
  }

  const categoryRanking = Array.from(categoryAgg.values())
    .map((c) => ({ name: c.name, avg: c.count ? c.sum / c.count : 0 }))
    .sort((a, b) => b.avg - a.avg)

  const receivedRanking = Array.from(receivedAgg.entries())
    .map(([id, r]) => ({ id, name: r.name, avg: r.count ? r.sum / r.count : 0, count: r.count }))
    .sort((a, b) => b.avg - a.avg)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{session.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Estado: {session.status}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Participantes</CardDescription>
            <CardTitle className="text-2xl">{participantCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Votos totales</CardDescription>
            <CardTitle className="text-2xl">{voteCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nota media global</CardDescription>
            <CardTitle className="text-2xl">{overallAvg === null ? '—' : overallAvg.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Categorías</CardDescription>
            <CardTitle className="text-2xl">{categoryRanking.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de categorías (media)</CardTitle>
            <CardDescription>Ordenadas por nota media</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {categoryRanking.length ? (
              categoryRanking.slice(0, 10).map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <Badge variant="secondary">{c.avg.toFixed(2)}</Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No hay votos.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de participantes (media recibida)</CardTitle>
            <CardDescription>Promedio de todas las notas recibidas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {receivedRanking.length ? (
              receivedRanking.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm font-medium text-foreground">{p.name}</div>
                  <Badge variant="secondary">{p.avg.toFixed(2)}</Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No hay votos.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votos (agrupados)</CardTitle>
          <CardDescription>Votante → Votado → Notas por categoría</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {grouped.size ? (
            Array.from(grouped.entries()).map(([voterId, votedMap]) => {
              const voterName = profileMap.get(voterId) || '—'
              return (
                <details key={voterId} className="rounded-md border p-3">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">
                    {voterName}
                  </summary>
                  <div className="mt-3 flex flex-col gap-2">
                    {Array.from(votedMap.entries()).map(([votedForId, items]) => {
                      const votedForName = profileMap.get(votedForId) || '—'
                      const sorted = [...items].sort((a, b) => a.parameter.localeCompare(b.parameter))
                      return (
                        <details key={votedForId} className="rounded-md border p-3">
                          <summary className="cursor-pointer text-sm font-medium text-foreground">
                            {votedForName}
                          </summary>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {sorted.map((it) => (
                              <div
                                key={it.parameter}
                                className="flex items-center justify-between rounded-md border p-3"
                              >
                                <div className="text-sm text-foreground">{it.parameter}</div>
                                <Badge variant="secondary">{Number(it.score).toFixed(2)}</Badge>
                              </div>
                            ))}
                          </div>
                        </details>
                      )
                    })}
                  </div>
                </details>
              )
            })
          ) : (
            <div className="text-sm text-muted-foreground">No hay votos registrados.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
