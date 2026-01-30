'use client'

import * as React from 'react'

import { createSession, type CreateSessionActionState } from '@/lib/actions/sessions'
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

type UserOption = {
  id: string
  full_name: string
  email: string
  is_admin: boolean
}

const initialState: CreateSessionActionState = { error: null }

export function CreateSessionDialog({ users }: { users: UserOption[] }) {
  const [open, setOpen] = React.useState(false)
  const [state, formAction] = React.useActionState(createSession, initialState)
  const [query, setQuery] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [didSubmit, setDidSubmit] = React.useState(false)

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

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
  }, [users, query])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Crear sesión</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva sesión</DialogTitle>
          <DialogDescription>
            Selecciona participantes y crea una sesión activa.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(fd) => {
            setDidSubmit(true)
            return formAction(fd)
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Ej: Buja #12" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" placeholder="Opcional" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="userSearch">Participantes</Label>
            <Input
              id="userSearch"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email"
            />

            {Array.from(selectedIds).map((id) => (
              <input key={id} type="hidden" name="participantIds" value={id} />
            ))}

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
                  <div className="p-3 text-sm text-muted-foreground">Sin resultados.</div>
                ) : null}
              </div>
            </div>
          </div>

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
