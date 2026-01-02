"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '@/components/Utilities/Loader'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/home')
  }, [router])

  return (
    <div className="flex justify-center items-center h-screen w-full">
      <Loader />
    </div>
  )
}
