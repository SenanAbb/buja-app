import { redirect } from 'next/navigation'

export default function SessionsIndexRedirect() {
  redirect('/dashboard/sessions')
}
