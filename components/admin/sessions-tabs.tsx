'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { closeSession, type CloseSessionActionState } from '@/lib/actions/sessions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Participant = {
  id: string
  full_name: string
}

type SessionItem = {
  id: string
  name: string
  status: 'draft' | 'active' | 'closed'
  created_at: string
  closed_at: string | null
  participants: Participant[]
  average_score: number | null
}

const initialCloseState: CloseSessionActionState = { error: null }

function SessionCard({
  session,
  showClose,
  hrefBase,
  canClose,
}: {
  session: SessionItem
  showClose: boolean
  hrefBase?: string
  canClose?: boolean
}) {
  const router = useRouter()
  const [state, formAction] = React.useActionState(closeSession, initialCloseState)

  const created = new Date(session.created_at)
  const createdLabel = isNaN(created.getTime()) ? '—' : created.toLocaleDateString('es-ES')

  const href = hrefBase ? `${hrefBase}/${session.id}` : null

  return (
    <Card
      role={href ? 'link' : undefined}
      tabIndex={href ? 0 : undefined}
      className={href ? 'cursor-pointer transition-colors hover:bg-accent/20' : undefined}
      onClick={() => {
        if (href) router.push(href)
      }}
      onKeyDown={(e) => {
        if (!href) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(href)
        }
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">
              {hrefBase ? (
                <Link href={`${hrefBase}/${session.id}`} className="hover:underline">
                  {session.name}
                </Link>
              ) : (
                session.name
              )}
            </CardTitle>
            <CardDescription>Creada: {createdLabel}</CardDescription>
          </div>
          <Badge variant={session.status === 'closed' ? 'secondary' : 'default'}>
            {session.status === 'closed' ? 'Cerrada' : session.status === 'active' ? 'Activa' : 'Borrador'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="text-sm">
          <div className="text-muted-foreground">Participantes</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {session.participants.length ? (
              session.participants.map((p) => (
                <span
                  key={p.id}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {p.full_name}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {session.status === 'closed' ? (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Nota media (sesión)</div>
            <div className="text-sm font-medium text-foreground tabular-nums">
              {session.average_score === null ? '—' : session.average_score.toFixed(2)}
            </div>
          </div>
        ) : null}

        {showClose && canClose && session.status === 'active' ? (
          <form
            action={formAction}
            className="flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input type="hidden" name="sessionId" value={session.id} />
            {state.error ? (
              <div className="text-sm text-destructive">{state.error}</div>
            ) : null}
            <Button type="submit" variant="destructive" onClick={(e) => e.stopPropagation()}>
              Terminar sesión
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function SessionsTabs({
  active,
  closed,
  showClose,
  hrefBase,
  canClose,
}: {
  active: SessionItem[]
  closed: SessionItem[]
  showClose: boolean
  hrefBase?: string
  canClose?: boolean
}) {
  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Activas</TabsTrigger>
        <TabsTrigger value="closed">Cerradas</TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <div className="mt-4 grid gap-4">
          {active.length ? (
            active.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                showClose={showClose}
                hrefBase={hrefBase}
                canClose={canClose}
              />
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No hay sesiones activas.</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="closed">
        <div className="mt-4 grid gap-4">
          {closed.length ? (
            closed.map((s) => (
              <SessionCard key={s.id} session={s} showClose={false} hrefBase={hrefBase} canClose={false} />
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No hay sesiones cerradas.</div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
