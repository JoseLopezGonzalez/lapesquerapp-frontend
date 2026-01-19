"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogoutAwareLoader } from '@/components/Utilities/LogoutAwareLoader'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/home')
  }, [router])

  return (
    <LogoutAwareLoader>
      <div className="flex justify-center items-center h-screen w-full">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    </LogoutAwareLoader>
  )
}
