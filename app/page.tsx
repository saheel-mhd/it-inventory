'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Example: user info stored after login
    // localStorage.setItem('user', JSON.stringify({ id: 1, name: 'John' }))
    const user = localStorage.getItem('user')

    if (user) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return null // or a loading spinner
}
