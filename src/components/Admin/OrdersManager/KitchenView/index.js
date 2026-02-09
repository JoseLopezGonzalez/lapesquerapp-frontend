'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate } from '@/helpers/formats/dates/formatDates'
import { formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers'
import { ThermometerSnowflake, Package, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Play, Pause, Box, Weight } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

// Datos de prueba - simulan la estructura real de pedidos con productos planificados
const MOCK_ORDERS = [
  {
    id: 12345,
    customer: {
      id: 101,
      name: 'Pescados del Norte S.L.'
    },
    status: 'pending',
    loadDate: new Date().toISOString(),
    temperature: 4,
    transport: {
      name: 'Olano'
    },
    numberOfPallets: 3,
    plannedProducts: [
      {
        id: 1,
        product: {
          id: 501,
          name: 'Atún fresco'
        },
        quantity: 150.5,
        boxes: 25,
        unitPrice: 12.50
      },
      {
        id: 2,
        product: {
          id: 502,
          name: 'Salmón entero'
        },
        quantity: 200.0,
        boxes: 40,
        unitPrice: 15.75
      },
      {
        id: 3,
        product: {
          id: 503,
          name: 'Merluza'
        },
        quantity: 180.25,
        boxes: 30,
        unitPrice: 8.90
      }
    ]
  },
  {
    id: 12346,
    customer: {
      id: 102,
      name: 'Mariscos Premium'
    },
    status: 'pending',
    loadDate: new Date(Date.now() + 86400000).toISOString(), // Mañana
    temperature: -18,
    transport: {
      name: 'TIR'
    },
    numberOfPallets: 2,
    plannedProducts: [
      {
        id: 4,
        product: {
          id: 501,
          name: 'Atún fresco'
        },
        quantity: 120.0,
        boxes: 20,
        unitPrice: 12.50
      },
      {
        id: 5,
        product: {
          id: 504,
          name: 'Gambas congeladas'
        },
        quantity: 100.0,
        boxes: 20,
        unitPrice: 22.50
      },
      {
        id: 6,
        product: {
          id: 505,
          name: 'Langostinos'
        },
        quantity: 75.5,
        boxes: 15,
        unitPrice: 28.00
      }
    ]
  },
  {
    id: 12347,
    customer: {
      id: 103,
      name: 'Distribuidora Costera'
    },
    status: 'pending',
    loadDate: new Date().toISOString(),
    temperature: 0,
    transport: {
      name: 'TPO'
    },
    numberOfPallets: 4,
    plannedProducts: [
      {
        id: 7,
        product: {
          id: 502,
          name: 'Salmón entero'
        },
        quantity: 150.0,
        boxes: 30,
        unitPrice: 15.75
      },
      {
        id: 8,
        product: {
          id: 506,
          name: 'Bacalao salado'
        },
        quantity: 300.0,
        boxes: 50,
        unitPrice: 10.25
      },
      {
        id: 9,
        product: {
          id: 507,
          name: 'Bonito del Norte'
        },
        quantity: 120.75,
        boxes: 24,
        unitPrice: 14.50
      },
      {
        id: 10,
        product: {
          id: 508,
          name: 'Anchoas'
        },
        quantity: 50.0,
        boxes: 10,
        unitPrice: 18.75
      }
    ]
  },
  {
    id: 12348,
    customer: {
      id: 104,
      name: 'Restaurante El Puerto'
    },
    status: 'finished',
    loadDate: new Date().toISOString(),
    temperature: 4,
    transport: {
      name: 'Distran'
    },
    numberOfPallets: 1,
    plannedProducts: [
      {
        id: 11,
        product: {
          id: 501,
          name: 'Atún fresco'
        },
        quantity: 80.0,
        boxes: 15,
        unitPrice: 12.50
      },
      {
        id: 12,
        product: {
          id: 509,
          name: 'Lubina'
        },
        quantity: 45.0,
        boxes: 9,
        unitPrice: 16.00
      },
      {
        id: 13,
        product: {
          id: 503,
          name: 'Merluza'
        },
        quantity: 60.0,
        boxes: 10,
        unitPrice: 8.90
      }
    ]
  },
  {
    id: 12349,
    customer: {
      id: 105,
      name: 'Supermercados Marítimos'
    },
    status: 'incident',
    loadDate: new Date().toISOString(),
    temperature: -23,
    transport: {
      name: 'Narval'
    },
    numberOfPallets: 5,
    plannedProducts: [
      {
        id: 14,
        product: {
          id: 502,
          name: 'Salmón entero'
        },
        quantity: 250.0,
        boxes: 50,
        unitPrice: 15.75
      },
      {
        id: 15,
        product: {
          id: 510,
          name: 'Pulpo congelado'
        },
        quantity: 250.0,
        boxes: 50,
        unitPrice: 20.50
      },
      {
        id: 16,
        product: {
          id: 511,
          name: 'Calamar'
        },
        quantity: 180.5,
        boxes: 36,
        unitPrice: 12.75
      }
    ]
  },
  {
    id: 12350,
    customer: {
      id: 106,
      name: 'Pescadería Central'
    },
    status: 'pending',
    loadDate: new Date(Date.now() + 172800000).toISOString(), // Pasado mañana
    temperature: 4,
    transport: {
      name: 'Olano'
    },
    numberOfPallets: 2,
    plannedProducts: [
      {
        id: 17,
        product: {
          id: 501,
          name: 'Atún fresco'
        },
        quantity: 200.0,
        boxes: 35,
        unitPrice: 12.50
      },
      {
        id: 18,
        product: {
          id: 503,
          name: 'Merluza'
        },
        quantity: 150.0,
        boxes: 25,
        unitPrice: 8.90
      },
      {
        id: 19,
        product: {
          id: 512,
          name: 'Rodaballo'
        },
        quantity: 90.0,
        boxes: 18,
        unitPrice: 24.00
      }
    ]
  },
  {
    id: 12351,
    customer: {
      id: 107,
      name: 'Conservas del Mar'
    },
    status: 'pending',
    loadDate: new Date().toISOString(),
    temperature: 0,
    transport: {
      name: 'TPO'
    },
    numberOfPallets: 3,
    plannedProducts: [
      {
        id: 20,
        product: {
          id: 506,
          name: 'Bacalao salado'
        },
        quantity: 400.0,
        boxes: 65,
        unitPrice: 10.25
      },
      {
        id: 21,
        product: {
          id: 508,
          name: 'Anchoas'
        },
        quantity: 80.0,
        boxes: 16,
        unitPrice: 18.75
      },
      {
        id: 22,
        product: {
          id: 507,
          name: 'Bonito del Norte'
        },
        quantity: 200.0,
        boxes: 40,
        unitPrice: 14.50
      }
    ]
  },
  {
    id: 12352,
    customer: {
      id: 108,
      name: 'Restaurante La Marina'
    },
    status: 'pending',
    loadDate: new Date(Date.now() + 86400000).toISOString(),
    temperature: 4,
    transport: {
      name: 'Distran'
    },
    numberOfPallets: 1,
    plannedProducts: [
      {
        id: 23,
        product: {
          id: 509,
          name: 'Lubina'
        },
        quantity: 60.0,
        boxes: 12,
        unitPrice: 16.00
      },
      {
        id: 24,
        product: {
          id: 512,
          name: 'Rodaballo'
        },
        quantity: 45.0,
        boxes: 9,
        unitPrice: 24.00
      },
      {
        id: 25,
        product: {
          id: 502,
          name: 'Salmón entero'
        },
        quantity: 100.0,
        boxes: 20,
        unitPrice: 15.75
      }
    ]
  },
  {
    id: 12353,
    customer: {
      id: 109,
      name: 'Congelados del Norte'
    },
    status: 'pending',
    loadDate: new Date().toISOString(),
    temperature: -18,
    transport: {
      name: 'TIR'
    },
    numberOfPallets: 4,
    plannedProducts: [
      {
        id: 26,
        product: {
          id: 504,
          name: 'Gambas congeladas'
        },
        quantity: 150.0,
        boxes: 30,
        unitPrice: 22.50
      },
      {
        id: 27,
        product: {
          id: 510,
          name: 'Pulpo congelado'
        },
        quantity: 180.0,
        boxes: 36,
        unitPrice: 20.50
      },
      {
        id: 28,
        product: {
          id: 511,
          name: 'Calamar'
        },
        quantity: 120.0,
        boxes: 24,
        unitPrice: 12.75
      }
    ]
  },
  {
    id: 12354,
    customer: {
      id: 110,
      name: 'Distribuidora Atlántica'
    },
    status: 'finished',
    loadDate: new Date().toISOString(),
    temperature: 4,
    transport: {
      name: 'Olano'
    },
    numberOfPallets: 3,
    plannedProducts: [
      {
        id: 29,
        product: {
          id: 501,
          name: 'Atún fresco'
        },
        quantity: 300.0,
        boxes: 50,
        unitPrice: 12.50
      },
      {
        id: 30,
        product: {
          id: 503,
          name: 'Merluza'
        },
        quantity: 240.0,
        boxes: 40,
        unitPrice: 8.90
      },
      {
        id: 31,
        product: {
          id: 507,
          name: 'Bonito del Norte'
        },
        quantity: 180.0,
        boxes: 36,
        unitPrice: 14.50
      }
    ]
  }
]

const KitchenView = ({ orders = [], onClickOrder, autoPlayInterval = 10000, useMockData = false, onToggleViewMode }) => {
  const isMobile = useIsMobile()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  // Usar datos de prueba solo si no hay pedidos reales o si se fuerza con useMockData
  const ordersToDisplay = useMemo(() => {
    // Si se fuerza el uso de datos de prueba
    if (useMockData) {
      console.log('Forzando uso de datos de prueba MOCK_ORDERS')
      return MOCK_ORDERS
    }
    
    // Si hay pedidos reales y tienen productos, usarlos
    if (orders && Array.isArray(orders) && orders.length > 0) {
      // Verificar que al menos un pedido tenga productos planificados
      const hasProducts = orders.some(order => 
        (order.plannedProducts && Array.isArray(order.plannedProducts) && order.plannedProducts.length > 0) ||
        (order.plannedProductDetails && Array.isArray(order.plannedProductDetails) && order.plannedProductDetails.length > 0)
      )
      if (hasProducts) {
        console.log('Usando pedidos reales:', orders.length)
        return orders
      }
    }
    // Fallback a datos de prueba para desarrollo/demo
    console.log('Usando datos de prueba MOCK_ORDERS (no hay pedidos reales o no tienen productos)')
    return MOCK_ORDERS
  }, [orders, useMockData])

  // Agrupar pedidos por producto
  const productsGrouped = useMemo(() => {
    const productMap = new Map()

    console.log('ordersToDisplay:', ordersToDisplay.length, 'pedidos')
    
    ordersToDisplay.forEach(order => {
      // Obtener productos del pedido (soporta diferentes estructuras)
      const products = order.plannedProducts || order.plannedProductDetails || []
      
      console.log(`Pedido ${order.id}: ${products.length} productos`)
      
      products.forEach(product => {
        const productId = product.product?.id || product.productId
        const productName = product.product?.name || product.productName || 'Producto sin nombre'
        
        if (!productId) {
          console.warn('Producto sin ID:', product)
          return
        }

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: productId,
            name: productName,
            orders: []
          })
        }

        const productGroup = productMap.get(productId)
        
        // Calcular datos de producción (completado y restante) - datos de prueba
        const plannedQuantity = product.quantity || 0
        const plannedBoxes = product.boxes || 0
        
        // Simular diferentes estados de producción para pruebas
        // Usar el ID del pedido para generar estados consistentes
        const orderIdMod = order.id % 3
        let completedQuantity, completedBoxes
        
        if (orderIdMod === 0) {
          // Verde: Completado = Planificado (100%)
          completedQuantity = plannedQuantity
          completedBoxes = plannedBoxes
        } else if (orderIdMod === 1) {
          // Naranja: Falta por terminar (70-90% del planificado)
          const completedPercentage = 0.7 + (order.id % 3) * 0.1 // Entre 70% y 90%
          completedQuantity = plannedQuantity * completedPercentage
          completedBoxes = Math.round(plannedBoxes * completedPercentage)
        } else {
          // Rojo: Se ha pasado (110-120% del planificado)
          const overPercentage = 1.1 + (order.id % 2) * 0.1 // Entre 110% y 120%
          completedQuantity = plannedQuantity * overPercentage
          completedBoxes = Math.round(plannedBoxes * overPercentage)
        }
        
        // Restante = planificado - completado (puede ser negativo si se pasó)
        const remainingQuantity = plannedQuantity - completedQuantity
        const remainingBoxes = plannedBoxes - completedBoxes
        
        // Generar array de palets para pruebas (formato #0563)
        const paletsArray = []
        const numPallets = order.numberOfPallets || 0
        const basePaletNumber = order.id * 100 // Base para generar números únicos
        for (let i = 0; i < numPallets; i++) {
          paletsArray.push(basePaletNumber + i)
        }
        
        productGroup.orders.push({
          orderId: order.id,
          order: order,
          // Pedido (planificado)
          quantity: plannedQuantity,
          boxes: plannedBoxes,
          // Completado
          completedQuantity: completedQuantity,
          completedBoxes: completedBoxes,
          // Restante
          remainingQuantity: remainingQuantity,
          remainingBoxes: remainingBoxes,
          loadDate: order.loadDate,
          customer: order.customer,
          status: order.status,
          temperature: order.temperature,
          transport: order.transport,
          numberOfPallets: order.numberOfPallets || 0,
          palets: paletsArray
        })
      })
    })

    const result = Array.from(productMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
    
    console.log('Productos agrupados:', result.length)
    
    return result
  }, [ordersToDisplay])

  // Navegación
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % productsGrouped.length)
  }, [productsGrouped.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + productsGrouped.length) % productsGrouped.length)
  }, [productsGrouped.length])

  const goToIndex = useCallback((index) => {
    if (index >= 0 && index < productsGrouped.length) {
      setCurrentIndex(index)
    }
  }, [productsGrouped.length])

  // Auto-play
  useEffect(() => {
    if (!isAutoPlay || productsGrouped.length <= 1) return

    const interval = setInterval(() => {
      goToNext()
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlay, autoPlayInterval, goToNext, productsGrouped.length])

  // Resetear índice cuando cambian los productos
  useEffect(() => {
    setCurrentIndex(0)
  }, [productsGrouped.length])

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        setIsAutoPlay(prev => !prev)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Enter para pausar/reanudar auto-play
        setIsAutoPlay(prev => !prev)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        // Escape para cambiar a vista normal
        if (onToggleViewMode) {
          onToggleViewMode()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext, onToggleViewMode])

  // Determinar el estado de la línea basado en las cantidades
  const getLineStatusConfig = (orderItem) => {
    const planned = orderItem.quantity || 0
    const completed = orderItem.completedQuantity || 0
    const remaining = orderItem.remainingQuantity || 0
    
    // Rojo: se ha pasado de la cantidad prevista (completado > planificado)
    if (completed > planned) {
      return {
        color: 'red',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        bgColorHighlight: 'bg-red-200 dark:bg-red-950/60',
        borderColor: 'border-red-500',
        borderColorSubtle: 'border-red-200 dark:border-red-800/40',
        textColor: 'text-red-900 dark:text-red-100',
        icon: AlertCircle
      }
    }
    
    // Verde: está terminada esa línea (completado = planificado, o restante <= 0)
    if (remaining <= 0 || Math.abs(completed - planned) < 0.01) {
      return {
        color: 'green',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        bgColorHighlight: 'bg-green-200 dark:bg-green-950/60',
        borderColor: 'border-green-500',
        borderColorSubtle: 'border-green-200 dark:border-green-800/40',
        textColor: 'text-green-900 dark:text-green-100',
        icon: CheckCircle2
      }
    }
    
    // Naranja: falta por terminar (completado < planificado y restante > 0)
    return {
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      bgColorHighlight: 'bg-orange-200 dark:bg-orange-950/60',
      borderColor: 'border-orange-500',
      borderColorSubtle: 'border-orange-200 dark:border-orange-800/40',
      textColor: 'text-orange-900 dark:text-orange-100',
      icon: Clock
    }
  }

  const getTemperatureColor = (temp) => {
    if (temp <= -18) return 'text-blue-600 dark:text-blue-400'
    if (temp <= 0) return 'text-cyan-600 dark:text-cyan-400'
    if (temp <= 4) return 'text-green-600 dark:text-green-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  if (productsGrouped.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl font-medium text-foreground mb-2">
          No hay productos para mostrar
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Los productos aparecerán aquí cuando haya pedidos con productos planificados
        </p>
      </div>
    )
  }

  const currentProduct = productsGrouped[currentIndex]
  
  // Calcular totales del producto
  const totalQuantity = currentProduct.orders.reduce((sum, item) => sum + (item.quantity || 0), 0)
  const totalBoxes = currentProduct.orders.reduce((sum, item) => sum + (item.boxes || 0), 0)
  
  // Ordenar pedidos por fecha de carga
  const sortedOrders = [...currentProduct.orders].sort((a, b) => {
    const dateA = a.loadDate ? new Date(a.loadDate) : new Date(0)
    const dateB = b.loadDate ? new Date(b.loadDate) : new Date(0)
    return dateA - dateB
  })

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Card principal - usando componentes shadcn nativos asdasdasd*/}
      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 pt-0 pb-3 sm:pb-4">
        <Card className="w-full h-full shadow-lg flex flex-col">
          <CardHeader className="flex-shrink-0 pb-3 pt-2 sm:pt-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                {currentProduct.name}
              </CardTitle>
              
              {/* Indicador pause/play y totales usando Badges de shadcn - en fila horizontal */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted border-2 border-border">
                  {isAutoPlay ? (
                    <Pause className="h-10 w-10 text-foreground" />
                  ) : (
                    <Play className="h-10 w-10 text-foreground ml-1" />
                  )}
                </div>
                <Badge variant="default" className="gap-2 px-6 py-4 text-3xl sm:text-4xl font-bold">
                  <Package className="h-8 w-8" />
                  <span>{formatInteger(totalBoxes)} cajas</span> 
                </Badge>
                <Badge variant="default" className="px-6 py-4 text-3xl sm:text-4xl font-bold">
                  <span>{formatDecimalWeight(totalQuantity)}</span>
                </Badge>
                <Badge variant="secondary" className="px-6 py-4 text-3xl sm:text-4xl font-bold">
                  {currentProduct.orders.length} pedido{currentProduct.orders.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">
            {/* Lista de pedidos usando ScrollArea de shadcn con grid masonry */}
            {sortedOrders.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="pr-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 auto-rows-max">
                    {sortedOrders.map((orderItem, index) => {
                      const lineStatusConfig = getLineStatusConfig(orderItem)
                      
                      return (
                        <Card
                          key={`${orderItem.orderId}-${index}`}
                          className={`
                            h-fit
                            ${lineStatusConfig.bgColor}
                            border-2 ${lineStatusConfig.borderColor}
                            ${onClickOrder ? 'cursor-pointer' : ''}
                            overflow-hidden relative
                          `}
                          onClick={() => onClickOrder && onClickOrder(orderItem.orderId)}
                        >
                          {/* Barra de color superior - identificación por estado de línea */}
                          <div className={`h-2 w-full ${lineStatusConfig.borderColor.replace('border-', 'bg-')}`} />
                          
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col gap-3">
                              {/* ID del pedido centrado */}
                              <div className="flex items-center justify-center py-2">
                                <div className="flex items-center justify-center min-w-[100px] h-14 rounded-lg">
                                  <span className="text-5xl sm:text-6xl font-black text-primary tracking-tight">
                                    #{orderItem.orderId.toString().padStart(5, '0')}
                                  </span>
                                </div>
                              </div>

                              {/* Separador */}
                              <Separator className="opacity-40" />

                              {/* Cuatro bloques de cantidades: horizontal si hay completado, vertical si está completado */}
                              <div className={`flex items-start gap-2 sm:gap-3 flex-wrap justify-center ${lineStatusConfig.color === 'green' ? 'flex-col' : ''}`}>
                                {/* Bloque 1: Pedido (Planificado) */}
                                <div className={`text-center ${lineStatusConfig.color === 'green' ? 'w-full' : 'flex-1 min-w-[140px]'}`}>
                                  <p className="text-lg text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Pedido</p>
                                  <div className={`flex flex-col items-center gap-2 px-2.5 py-2 rounded-lg bg-background border ${lineStatusConfig.borderColorSubtle}`}>
                                    <div className="flex items-center justify-center">
                                      <p className="text-2xl sm:text-3xl font-extrabold text-foreground whitespace-nowrap">
                                        <span className="text-foreground">{formatInteger(orderItem.boxes)}</span>
                                        <span className="text-muted-foreground text-lg font-semibold">/c</span>
                                      </p>
                                    </div>
                                    <div className="w-full h-[1px] bg-border opacity-80" />
                                    <div className="flex items-center justify-center">
                                      <p className="text-2xl sm:text-3xl font-extrabold text-foreground whitespace-nowrap">
                                        {formatDecimalWeight(orderItem.quantity)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Bloque 2: Completado - solo se muestra si NO está completado */}
                                {lineStatusConfig.color !== 'green' && (
                                  <div className="text-center flex-1 min-w-[140px]">
                                    <p className="text-lg text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Completado</p>
                                    {/* Tema original comentado:
                                    <div className={`flex flex-col items-center gap-2 px-2.5 py-2 rounded-lg bg-background border ${lineStatusConfig.borderColorSubtle}`}>
                                      <div className="flex items-center justify-center">
                                        <p className="text-2xl sm:text-3xl font-extrabold text-muted-foreground whitespace-nowrap">
                                          <span className="text-muted-foreground">{formatInteger(orderItem.completedBoxes || 0)}</span>
                                          <span className="text-muted-foreground/70 text-lg font-semibold">/c</span>
                                        </p>
                                      </div>
                                      <Separator className="w-full opacity-60" />
                                      <div className="flex items-center justify-center">
                                        <p className="text-2xl sm:text-3xl font-extrabold text-muted-foreground whitespace-nowrap">
                                          {formatDecimalWeight(orderItem.completedQuantity || 0)}
                                        </p>
                                      </div>
                                    </div>
                                    */}
                                    {/* Tema temporal: fondo gris y letras negras */}
                                    <div className="flex flex-col items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                                      <div className="flex items-center justify-center">
                                        <p className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white whitespace-nowrap">
                                          <span className="text-black dark:text-white">{formatInteger(orderItem.completedBoxes || 0)}</span>
                                          <span className="text-black/70 dark:text-white/70 text-lg font-semibold">/c</span>
                                        </p>
                                      </div>
                                      <div className="w-full h-[1px] bg-gray-400/80 dark:bg-gray-600/80" />
                                      <div className="flex items-center justify-center">
                                        <p className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white whitespace-nowrap">
                                          {formatDecimalWeight(orderItem.completedQuantity || 0)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Bloque 3 y 4: Diferencia y Palets - cuando está completado van juntos en una fila */}
                                {lineStatusConfig.color === 'green' ? (
                                  <div className="flex items-start gap-2 sm:gap-3 w-full">
                                    {/* Bloque 3: Diferencia */}
                                    <div className="text-center flex-1 min-w-[140px]">
                                      {(() => {
                                        const completed = orderItem.completedQuantity || 0
                                        const planned = orderItem.quantity || 0
                                        let blockTitle = 'Restante'
                                        
                                        if (completed > planned) {
                                          blockTitle = 'Sobrante'
                                        } else if (Math.abs(completed - planned) < 0.01 || (orderItem.remainingQuantity || 0) <= 0) {
                                          blockTitle = 'Diferencia'
                                        }
                                        
                                        return (
                                          <>
                                            <p className="text-lg text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">{blockTitle}</p>
                                            <div className={`flex flex-col items-center gap-2 px-2.5 py-2 rounded-lg ${lineStatusConfig.bgColorHighlight} border-2 ${lineStatusConfig.borderColor}`}>
                                              <div className="flex items-center justify-center">
                                                <p className={`text-2xl sm:text-3xl font-extrabold whitespace-nowrap ${lineStatusConfig.textColor}`}>
                                                  <span>
                                                    {completed > planned
                                                      ? formatInteger(Math.abs(orderItem.remainingBoxes || 0))
                                                      : formatInteger(orderItem.remainingBoxes || 0)
                                                    }
                                                  </span>
                                                  <span className="opacity-70 text-lg font-semibold">/c</span>
                                                </p>
                                              </div>
                                              <div className={`w-full h-[1px] ${lineStatusConfig.borderColor.replace('border-', 'bg-')} opacity-80`} />
                                              <div className="flex items-center justify-center">
                                                <p className={`text-2xl sm:text-3xl font-extrabold whitespace-nowrap ${lineStatusConfig.textColor}`}>
                                                  {completed > planned
                                                    ? formatDecimalWeight(Math.abs(orderItem.remainingQuantity || 0))
                                                    : formatDecimalWeight(orderItem.remainingQuantity || 0)
                                                  }
                                                </p>
                                              </div>
                                            </div>
                                          </>
                                        )
                                      })()}
                                    </div>

                                    {/* Bloque 4: Palets */}
                                    <div className="text-center flex-1 min-w-[140px]">
                                      <p className="text-lg text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Palets</p>
                                      <div className="flex flex-col items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        <div className="flex flex-col items-center gap-1">
                                          {(orderItem.palets && orderItem.palets.length > 0) ? (
                                            orderItem.palets.slice(0, 3).map((paletNumber, idx) => (
                                              <p key={idx} className="text-xl sm:text-2xl font-extrabold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                                #{paletNumber.toString().padStart(4, '0')}
                                              </p>
                                            ))
                                          ) : (
                                            <p className="text-2xl sm:text-3xl font-extrabold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                              {orderItem.numberOfPallets || orderItem.order?.numberOfPallets || 0}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {/* Bloque 3: Sobrante/Restante - cuando NO está completado */}
                                    <div className="text-center flex-1 min-w-[140px]">
                                      {(() => {
                                        const completed = orderItem.completedQuantity || 0
                                        const planned = orderItem.quantity || 0
                                        let blockTitle = 'Restante'
                                        
                                        if (completed > planned) {
                                          blockTitle = 'Sobrante'
                                        } else if (Math.abs(completed - planned) < 0.01 || (orderItem.remainingQuantity || 0) <= 0) {
                                          blockTitle = 'Diferencia'
                                        }
                                        
                                        return (
                                          <>
                                            <p className="text-lg text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">{blockTitle}</p>
                                            <div className={`flex flex-col items-center gap-2 px-2.5 py-2 rounded-lg ${lineStatusConfig.bgColorHighlight} border-2 ${lineStatusConfig.borderColor}`}>
                                              <div className="flex items-center justify-center">
                                                <p className={`text-2xl sm:text-3xl font-extrabold whitespace-nowrap ${lineStatusConfig.textColor}`}>
                                                  <span>
                                                    {completed > planned
                                                      ? formatInteger(Math.abs(orderItem.remainingBoxes || 0))
                                                      : formatInteger(orderItem.remainingBoxes || 0)
                                                    }
                                                  </span>
                                                  <span className="opacity-70 text-lg font-semibold">/c</span>
                                                </p>
                                              </div>
                                              <div className={`w-full h-[1px] ${lineStatusConfig.borderColor.replace('border-', 'bg-')} opacity-80`} />
                                              <div className="flex items-center justify-center">
                                                <p className={`text-2xl sm:text-3xl font-extrabold whitespace-nowrap ${lineStatusConfig.textColor}`}>
                                                  {completed > planned
                                                    ? formatDecimalWeight(Math.abs(orderItem.remainingQuantity || 0))
                                                    : formatDecimalWeight(orderItem.remainingQuantity || 0)
                                                  }
                                                </p>
                                              </div>
                                            </div>
                                          </>
                                        )
                                      })()}
                                    </div>

                                    {/* Bloque 4: Palets */}
                                    <div className="text-center flex-1 min-w-[140px]">
                                      <p className="text-lg text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Palets</p>
                                      <div className="flex flex-col items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        <div className="flex flex-col items-center gap-1">
                                          {(orderItem.palets && orderItem.palets.length > 0) ? (
                                            orderItem.palets.slice(0, 3).map((paletNumber, idx) => (
                                              <p key={idx} className="text-xl sm:text-2xl font-extrabold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                                #{paletNumber.toString().padStart(4, '0')}
                                              </p>
                                            ))
                                          ) : (
                                            <p className="text-2xl sm:text-3xl font-extrabold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                              {orderItem.numberOfPallets || orderItem.order?.numberOfPallets || 0}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Package className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm text-muted-foreground italic">
                    Sin pedidos para este producto
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

export default KitchenView
