import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Error de autenticación</CardTitle>
          <CardDescription>Ha ocurrido un error durante la autenticación</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Por favor, intenta iniciar sesión nuevamente. Si el problema persiste, contacta con el administrador.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
