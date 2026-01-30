export default async function AdminSessionsPage() {
  const { redirect } = await import('next/navigation')
  redirect('/admin/history')
}
