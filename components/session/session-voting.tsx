'use client'

import * as React from 'react'

import { upsertVotes, type UpsertVotesActionState } from '@/lib/actions/votes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Parameter = {
  id: string
  name: string
}

type Participant = {
  id: string
  full_name: string
}

type ExistingVote = {
  voted_for_id: string
  parameter_id: string
  score: number
}

const initialState: UpsertVotesActionState = { error: null }

export function SessionVoting({
  sessionId,
  sessionStatus,
  parameters,
  participants,
  existingVotes,
  participantAverages,
}: {
  sessionId: string
  sessionStatus: 'draft' | 'active' | 'closed'
  parameters: Parameter[]
  participants: Participant[]
  existingVotes: ExistingVote[]
  participantAverages: Record<string, number | null>
}) {
  const canEdit = sessionStatus === 'active'
  const [selectedParticipantId, setSelectedParticipantId] = React.useState<string | null>(null)

  const votesByTarget = React.useMemo(() => {
    const m = new Map<string, Map<string, number>>()
    for (const v of existingVotes) {
      const byParam = m.get(v.voted_for_id) || new Map<string, number>()
      byParam.set(v.parameter_id, v.score)
      m.set(v.voted_for_id, byParam)
    }
    return m
  }, [existingVotes])

  const selected = participants.find((p) => p.id === selectedParticipantId) || null
  const selectedExisting = selected ? votesByTarget.get(selected.id) : undefined

  const [state, formAction] = React.useActionState(upsertVotes, initialState)

  React.useEffect(() => {
    if (state.error === null) {
      // keep selection, just let the refreshed server data update via revalidate
    }
  }, [state.error])

  if (!participants.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No hay participantes votables en esta sesión.
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participantes</CardTitle>
          <CardDescription>
            {canEdit ? 'Selecciona un participante para votar o editar.' : 'Sesión cerrada (solo lectura).'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {participants.map((p) => {
            const hasAny = (votesByTarget.get(p.id)?.size ?? 0) > 0
            const avg = participantAverages[p.id]
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedParticipantId(p.id)}
                className={
                  'flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-accent/30 ' +
                  (selectedParticipantId === p.id ? 'border-primary/50' : '')
                }
              >
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-foreground">{p.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {hasAny ? 'Notas guardadas' : 'Sin notas'}
                    {avg !== null && avg !== undefined ? ` · Media: ${avg.toFixed(2)}` : ''}
                  </div>
                </div>
                <Badge variant={hasAny ? 'secondary' : 'default'}>
                  {avg !== null && avg !== undefined ? avg.toFixed(2) : hasAny ? 'OK' : '—'}
                </Badge>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votación</CardTitle>
          <CardDescription>
            {selected
              ? `Notas para ${selected.full_name}${
                  participantAverages[selected.id] !== null && participantAverages[selected.id] !== undefined
                    ? ` · Media: ${participantAverages[selected.id]!.toFixed(2)}`
                    : ''
                }`
              : 'Selecciona un participante para ver las categorías.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!selected ? (
            <div className="text-sm text-muted-foreground">Selecciona un participante.</div>
          ) : (
            <form action={formAction} className="flex flex-col gap-3">
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="votedForId" value={selected.id} />

              {parameters.map((param) => {
                const defaultValue = selectedExisting?.get(param.id)
                return (
                  <div key={param.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-foreground">{param.name}</div>
                      {defaultValue !== undefined ? (
                        <div className="text-xs text-muted-foreground">Actual: {defaultValue}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Sin nota</div>
                      )}
                    </div>
                    <Input
                      name={`score:${param.id}`}
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      defaultValue={defaultValue ?? ''}
                      disabled={!canEdit}
                      className="w-24"
                    />
                  </div>
                )
              })}

              {state.error ? <div className="text-sm text-destructive">{state.error}</div> : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={!canEdit}>
                  Confirmar notas
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
