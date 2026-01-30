'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { addParticipantsToSession, type AddParticipantsActionState } from '@/lib/actions/sessions'

type UserOption = {
  id: string
  full_name: string
  email: string
  is_admin: boolean
}

const initialState: AddParticipantsActionState = { error: null }

export function AddParticipantsDialog({
  sessionId,
  users,
  existingParticipantIds,
}: {
  sessionId: string
  users: UserOption[]
  existingParticipantIds: string[]
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [didSubmit, setDidSubmit] = React.useState(false)

  const [state, formAction] = React.useActionState(addParticipantsToSession, initialState)

  React.useEffect(() => {
    if (!didSubmit) return
    if (state.error === null) {
      setOpen(false)
      setQuery('')
      setSelectedIds(new Set())
      setDidSubmit(false)
    }
  }, [state.error, didSubmit])

  const toggleSelected = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const existing = React.useMemo(() => new Set(existingParticipantIds), [existingParticipantIds])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = users.filter((u) => !existing.has(u.id))
    if (!q) return base
    return base.filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, query, existing])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Añadir participante</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Añadir participantes</DialogTitle>
          <DialogDescription>
            Puedes añadir participantes mientras la sesión esté activa.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(fd) => {
            setDidSubmit(true)
            return formAction(fd)
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="sessionId" value={sessionId} />
          {Array.from(selectedIds).map((id) => (
            <input key={id} type="hidden" name="participantIds" value={id} />
          ))}

          <div className="grid gap-2">
            <Label htmlFor="userSearch">Usuarios</Label>
            <Input
              id="userSearch"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email"
            />
            <div className="max-h-64 overflow-auto rounded-md border">
              <div className="flex flex-col">
                {filtered.map((u) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-accent/40"
                  >
                    <Checkbox
                      checked={selectedIds.has(u.id)}
                      onCheckedChange={() => toggleSelected(u.id)}
                    />
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <div className="truncate text-sm font-medium text-foreground">{u.full_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    {u.is_admin ? (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        Admin
                      </span>
                    ) : null}
                  </label>
                ))}

                {filtered.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No hay usuarios disponibles.</div>
                ) : null}
              </div>
            </div>
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Añadir</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
