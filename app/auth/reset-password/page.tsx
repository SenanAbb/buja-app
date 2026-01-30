'use client'

import React from 'react'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound, Vote } from 'lucide-react'
import { useActionState } from 'react'

import { toast } from '@/hooks/use-toast'
import { resetPassword } from '@/lib/actions/auth'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type RecoveryTokens = {
  accessToken: string
  refreshToken: string
}

function parseRecoveryTokensFromHash(hash: string): RecoveryTokens | null {
  if (!hash || hash.length < 2) return null
  const params = new URLSearchParams(hash.slice(1))
  if (params.get('type') !== 'recovery') return null

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

export default function ResetPasswordPage() {
  const router = useRouter()

  const tokens = useMemo(() => {
    if (typeof window === 'undefined') return null
    return parseRecoveryTokensFromHash(window.location.hash)
  }, [])

  const [state, formAction, pending] = useActionState(resetPassword, {
    error: null,
  })

  useEffect(() => {
    if (!state.error) return
    toast({ title: 'Error', description: state.error, variant: 'destructive' })
  }, [state.error])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.hash) return

    const params = new URLSearchParams(window.location.hash.slice(1))
    if (params.get('type') !== 'recovery') return

    router.replace('/auth/reset-password')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Vote className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Restablecer contraseña
          </CardTitle>
          <CardDescription>
            Introduce una nueva contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!tokens ? (
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                No se han encontrado tokens de recuperación. Vuelve a solicitar el enlace.
              </p>
              <Button asChild variant="outline">
                <Link href="/auth/forgot-password">Solicitar enlace</Link>
              </Button>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="accessToken" value={tokens.accessToken} />
              <input type="hidden" name="refreshToken" value={tokens.refreshToken} />

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={pending}>
                <KeyRound className="h-4 w-4" />
                {pending ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
