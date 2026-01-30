'use client'

import React from 'react'

import { useEffect } from 'react'
import Link from 'next/link'
import { Vote } from 'lucide-react'
import { useActionState } from 'react'

import { toast } from '@/hooks/use-toast'
import { signUp } from '@/lib/actions/auth'

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

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, { error: null })

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
          <CardTitle className="text-2xl font-bold text-foreground">Crear cuenta</CardTitle>
          <CardDescription>Regístrate para participar en las votaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Tu nombre"
                required
                autoComplete="username"
              />
            </div>
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
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={pending}>
              {pending ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
