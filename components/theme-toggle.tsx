'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'

  const stored = window.localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') return stored

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('light')

  React.useEffect(() => {
    const initial = getInitialTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    window.localStorage.setItem('theme', next)
  }

  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggle}>
      <Icon className="h-4 w-4" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
