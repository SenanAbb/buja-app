'use client'

import React from 'react'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Vote } from 'lucide-react'
import { useActionState } from 'react'

import { toast } from '@/hooks/use-toast'
import { signIn } from '@/lib/actions/auth'

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

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, formAction, pending] = useActionState(signIn, { error: null })

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (!hash || hash.length < 2) return
    const params = new URLSearchParams(hash.slice(1))
    if (params.get('type') === 'recovery') {
      router.replace(`/auth/reset-password${hash}`)
    }
  }, [router])

  useEffect(() => {
    if (searchParams.get('passwordReset') === '1') {
      toast({
        title: 'Contraseña actualizada',
        description: 'Ya puedes iniciar sesión con tu nueva contraseña.',
      })
    }
  }, [searchParams])

  useEffect(() => {
    if (!state.error) return
    toast({ title: 'Error', description: state.error, variant: 'destructive' })
  }, [state.error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Vote className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Bienvenido a Buja</CardTitle>
          <CardDescription>Sistema de Votación</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Tu contraseña"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={pending}>
              {pending ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>
            ¿No tienes cuenta?{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
          <p>
            <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
