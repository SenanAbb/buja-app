import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Registro exitoso</CardTitle>
          <CardDescription>Tu cuenta ha sido creada correctamente</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/auth/login">Ir a iniciar sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
