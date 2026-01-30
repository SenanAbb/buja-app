import { redirect } from 'next/navigation'

export default async function HistoryDetailRedirect({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  redirect(`/admin/history/${sessionId}`)
}
