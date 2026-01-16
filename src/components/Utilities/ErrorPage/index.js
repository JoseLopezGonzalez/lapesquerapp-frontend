'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, AlertCircle, FileQuestion, ServerCrash, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const errorConfigs = {
  404: {
    icon: FileQuestion,
    title: 'Página no encontrada',
    description: 'Lo sentimos, la página que buscas no existe o ha sido movida.',
    code: '404',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  500: {
    icon: ServerCrash,
    title: 'Error del servidor',
    description: 'Algo salió mal en el servidor. Por favor, intenta de nuevo más tarde.',
    code: '500',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  403: {
    icon: ShieldAlert,
    title: 'Acceso denegado',
    description: 'No tienes permisos para acceder a esta página. Contacta con el administrador del sistema.',
    code: '403',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  default: {
    icon: AlertCircle,
    title: 'Ha ocurrido un error',
    description: 'Algo salió mal. Por favor, intenta de nuevo más tarde.',
    code: 'Error',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
}

export function ErrorPage({ 
  statusCode = 404, 
  title, 
  description, 
  showHomeButton = true,
  showBackButton = true,
  homeHref = '/admin/home',
  customActions 
}) {
  const router = useRouter()
  const config = errorConfigs[statusCode] || errorConfigs.default
  const Icon = config.icon
  
  const finalTitle = title || config.title
  const finalDescription = description || config.description

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
              <div className={`relative flex h-20 w-20 items-center justify-center rounded-full ${config.bgColor} border shadow-sm`}>
                <Icon className={`h-10 w-10 ${config.color}`} strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">{finalTitle}</CardTitle>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-4xl font-bold ${config.color}`}>{config.code}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription className="text-center text-sm">
            {finalDescription}
          </CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBackButton && (
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            )}
            {showHomeButton && (
              <Button
                asChild
                className="w-full sm:w-auto"
              >
                <Link href={homeHref}>
                  <Home className="h-4 w-4 mr-2" />
                  Ir al inicio
                </Link>
              </Button>
            )}
            {customActions}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

