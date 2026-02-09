'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate } from '@/helpers/formats/dates/formatDates'
import { formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers'
import { ThermometerSnowflake, Package, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Play, Pause, Box, Weight, List } from 'lucide-react'
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
        productGroup.orders.push({
          orderId: order.id,
          order: order,
          quantity: product.quantity || 0,
          boxes: product.boxes || 0,
          loadDate: order.loadDate,
          customer: order.customer,
          status: order.status,
          temperature: order.temperature,
          transport: order.transport
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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'En producción',
          color: 'orange',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          borderColor: 'border-orange-500',
          textColor: 'text-orange-700 dark:text-orange-300',
          icon: Clock
        }
      case 'finished':
        return {
          label: 'Terminado',
          color: 'green',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-500',
          textColor: 'text-green-700 dark:text-green-300',
          icon: CheckCircle2
        }
      case 'incident':
        return {
          label: 'Incidencia',
          color: 'red',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-500',
          textColor: 'text-red-700 dark:text-red-300',
          icon: AlertCircle
        }
      default:
        return {
          label: 'Desconocido',
          color: 'gray',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: Clock
        }
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
      {/* Card principal - usando componentes shadcn nativos */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full h-full shadow-lg flex flex-col">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {currentProduct.name}
              </CardTitle>
              
              {/* Totales usando Badges de shadcn - en fila horizontal */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Badge variant="default" className="gap-2 px-4 py-2 text-base font-bold">
                  <Package className="h-4 w-4" />
                  <span>{formatInteger(totalBoxes)} cajas</span>
                </Badge>
                <Badge variant="default" className="px-4 py-2 text-base font-bold">
                  <span>{formatDecimalWeight(totalQuantity)}</span>
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-base font-bold">
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
                      const orderStatusConfig = getStatusConfig(orderItem.status)
                      
                      return (
                        <Card
                          key={`${orderItem.orderId}-${index}`}
                          className={`
                            transition-all h-fit group
                            ${orderStatusConfig.bgColor}
                            border-2 ${orderStatusConfig.borderColor}
                            ${onClickOrder ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:border-opacity-100' : ''}
                            overflow-hidden relative


                            
                          `}
                          onClick={() => onClickOrder && onClickOrder(orderItem.orderId)}
                        >
                          {/* Barra de color superior - identificación por color */}
                          <div className={`h-2 w-full ${orderStatusConfig.borderColor.replace('border-', 'bg-')}`} />
                          
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col gap-3">
                              {/* ID del pedido centrado */}
                              <div className="flex items-center justify-center py-2">
                                <div className="flex items-center justify-center min-w-[100px] h-14 rounded-lg    transition-all">
                                  <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                                    #{orderItem.orderId.toString().padStart(5, '0')}
                                  </span>
                                </div>
                              </div>

                              {/* Separador */}
                              <Separator className="opacity-40" />

                              {/* Cantidades destacadas con iconos */}
                              <div className="text-center py-2">
                                <div className="inline-flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-br from-background/80 to-background/60 dark:from-background/60 dark:to-background/40 border border-border/60">
                                  {/* Cajas con icono */}
                                  <div className="flex items-center gap-1.5">
                                    <div className="p-1 rounded-md bg-primary/10 border border-primary/20">
                                      <Box className="h-4 w-4 text-primary flex-shrink-0" />
                                    </div>
                                    <p className="text-xl sm:text-2xl font-extrabold text-foreground whitespace-nowrap">
                                      <span className="text-primary">{formatInteger(orderItem.boxes)}</span>
                                      <span className="text-muted-foreground text-base font-semibold">/c</span>
                                    </p>
                                  </div>
                                  
                                  {/* Separador */}
                                  <Separator orientation="vertical" className="h-8 opacity-40" />
                                  
                                  {/* Cantidad con icono */}
                                  <div className="flex items-center gap-1.5">
                                    <div className="p-1 rounded-md bg-foreground/5 border border-border/40">
                                      <Weight className="h-4 w-4 text-foreground/80 flex-shrink-0" />
                                    </div>
                                    <p className="text-xl sm:text-2xl font-extrabold text-foreground whitespace-nowrap">
                                      {formatDecimalWeight(orderItem.quantity)}
                                    </p>
                                  </div>
                                </div>
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

      {/* Controles de navegación - compactos */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-t p-2 sm:p-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Botón anterior */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={productsGrouped.length <= 1}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Indicadores y controles - compactos */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
            {/* Indicador de posición */}
            <div className="text-xs sm:text-sm font-medium text-foreground">
              {currentIndex + 1} / {productsGrouped.length}
            </div>

            {/* Botón play/pause */}
            {productsGrouped.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                {isAutoPlay ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
            )}

            {/* Indicadores de puntos - solo si hay pocos productos */}
            {!isMobile && productsGrouped.length <= 8 && (
              <div className="flex items-center gap-1">
                {productsGrouped.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={`
                      h-1.5 w-1.5 rounded-full transition-all
                      ${index === currentIndex 
                        ? 'bg-primary w-6' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }
                    `}
                    aria-label={`Ir al producto ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Botón siguiente */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={productsGrouped.length <= 1}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Botón Vista Normal */}
          {onToggleViewMode && (
            <>
              <Separator orientation="vertical" className="h-8 opacity-30" />
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleViewMode}
                className="h-8 sm:h-10 flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Vista Normal</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default KitchenView
