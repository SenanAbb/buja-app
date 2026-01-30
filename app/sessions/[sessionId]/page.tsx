import { redirect } from 'next/navigation'

export default async function SessionsDetailRedirect({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  redirect(`/dashboard/sessions/${sessionId}`)
}
