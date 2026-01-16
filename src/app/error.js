'use client'

import { useEffect } from 'react'
import { ErrorPage } from '@/components/Utilities/ErrorPage'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <ErrorPage 
      statusCode={500}
      title="Algo salió mal"
      description={error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta recargar la página.'}
      customActions={
        <Button
          onClick={reset}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </Button>
      }
    />
  )
}

