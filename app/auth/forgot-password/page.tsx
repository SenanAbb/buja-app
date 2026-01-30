'use client'

import React from 'react'

import { useEffect } from 'react'
import Link from 'next/link'
import { Mail, Vote } from 'lucide-react'
import { useActionState } from 'react'

import { toast } from '@/hooks/use-toast'
import { requestPasswordReset } from '@/lib/actions/auth'

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

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {
    error: null,
    success: null,
  })

  useEffect(() => {
    if (state.error) {
      toast({ title: 'Error', description: state.error, variant: 'destructive' })
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Listo', description: state.success })
    }
  }, [state.success])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Vote className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Recuperar contraseña
          </CardTitle>
          <CardDescription>
            Te enviaremos un enlace a tu correo para restablecerla.
          </CardDescription>
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
            <Button type="submit" className="mt-2 w-full" disabled={pending}>
              <Mail className="h-4 w-4" />
              {pending ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
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
