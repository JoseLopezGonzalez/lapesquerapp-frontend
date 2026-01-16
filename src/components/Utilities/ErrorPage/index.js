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
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    gradientFrom: 'from-blue-500/20',
    gradientTo: 'to-blue-600/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  500: {
    icon: ServerCrash,
    title: 'Error del servidor',
    description: 'Algo salió mal en el servidor. Por favor, intenta de nuevo más tarde.',
    code: '500',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    gradientFrom: 'from-red-500/20',
    gradientTo: 'to-red-600/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  403: {
    icon: ShieldAlert,
    title: 'Acceso denegado',
    description: 'No tienes permisos para acceder a esta página. Contacta con el administrador del sistema.',
    code: '403',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    gradientFrom: 'from-orange-500/20',
    gradientTo: 'to-orange-600/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  default: {
    icon: AlertCircle,
    title: 'Ha ocurrido un error',
    description: 'Algo salió mal. Por favor, intenta de nuevo más tarde.',
    code: 'Error',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    gradientFrom: 'from-gray-500/20',
    gradientTo: 'to-gray-600/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} blur-3xl opacity-30 animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr ${config.gradientFrom} ${config.gradientTo} blur-3xl opacity-30 animate-pulse delay-1000`} />
      </div>

      <Card className="w-full max-w-2xl shadow-sm border-2 animate-in fade-in-0 zoom-in-95 duration-500 relative z-10">
        <CardHeader className="text-center space-y-4 px-10 pt-12 pb-8">
          {/* Icon with enhanced styling */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Outer glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70`} />
              {/* Icon container */}
              <div className={`relative flex h-20 w-20 items-center justify-center rounded-full ${config.bgColor} border`}>
                <Icon className={`h-10 w-10 ${config.color}`} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Title and code */}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">{finalTitle}</CardTitle>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-4xl font-bold ${config.color}`}>{config.code}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-10 pb-12">
          {/* Description with better styling */}
          <CardDescription className="text-center text-sm">
            {finalDescription}
          </CardDescription>
          
          {/* Action buttons with improved layout */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBackButton && (
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full sm:w-auto transition-all hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            )}
            {showHomeButton && (
              <Button
                asChild
                className="w-full sm:w-auto transition-all hover:scale-105"
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

