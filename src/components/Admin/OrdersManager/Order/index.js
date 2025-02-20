import React, { useEffect, useState } from 'react'
import { AdjustmentsHorizontalIcon, ArchiveBoxIcon, ArrowPathIcon, ClipboardDocumentIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Toaster } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { MdPallet } from 'react-icons/md';
import {  ScrollShadow } from '@nextui-org/react';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'


import { TfiSave } from "react-icons/tfi";

import example from './example.json';
import SlidingPanel from '../../SlidingPanel';
import { AlertCircle, AlertTriangle, CalendarIcon, Check, Edit, FileDown, FileSpreadsheet, FileText, FileType, HelpCircle, Mail, MoreVertical, Package, Printer, Save, SaveIcon, Truck, User, Users, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const exampleOrder = example.data;


const Order = ({ orderId, onReloadList }) => {

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setOrder(exampleOrder);
      setLoading(false);
    }, 2000);
  }, [])

  const handleOnClickSave = () => {
  }



  return (
    <>
      {loading ? (
        <>
          {/* Loader */}
          <div className="h-full ">
            <div role="status" className="flex justify-center pt-96">
              <svg aria-hidden="true" className=" inline w-12 h-12 mr-2 text-neutral-200 animate-spin dark:text-neutral-600 fill-sky-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <br />
              <span className="text-white dark:text-neutral-400 pt-2 ml-2 sr-only">Cargando...</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className='h-full w-full '>

            <div className='h-full flex flex-col'>

              {/* options button section */}
              <div className='flex w-full justify-end items-center'>
                {/*  <DropdownWithSections title={<EllipsisVerticalIcon className='h-5 w-5' />} data={modifiedDropdownOptions} /> */}

              </div>

              {/* Order  Header */}
              <div className='flex justify-between -mt-6 lg:-mt-2'>
                <div className='space-y-1 '>
                  {order.status === 'pending' && (
                    <span className="inline-flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-orange-900 dark:text-orange-300">
                      <span className="me-1 relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                      En producción
                    </span>)
                  }
                  {order.status === 'finished' && (
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                      <span className="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                      Terminado
                    </span>)
                  }

                  <h3 className='text-xl font-medium text-white'>#{order.id}</h3>
                  <div className='text-white'>
                    <p className=''>
                      <span className='font-light text-3xl'>{order.customer.name}</span> <br />
                      {order.customer.alias && (<span className='text-lg font-medium'>{order.customer.alias}</span>)}
                    </p>
                  </div>
                  <div className='text-white'>
                    <p className='font-medium text-xs text-neutral-300'>Fecha de Carga:</p>
                    <p className='font-medium text-lg'>{order.loadDate}</p>
                  </div>
                  <div className='text-white'>
                    <p className='font-medium text-xs text-neutral-300'>Buyer Reference:</p>
                    <p className='font-medium text-lg'>{order.buyerReference || '-'}</p>
                  </div>
                </div>
                <div className='hidden lg:flex flex-row gap-2 h-fit p-5'>
                  <div className='flex flex-col max-w-sm justify-end items-end'>

                  <div className="flex gap-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Pedido
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[400px] sm:w-[800px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Editar Pedido #01527</SheetTitle>
                          </SheetHeader>
                          <div className="grid gap-6 py-4">
                            {/* Fechas */}
                            <div className="grid gap-4">
                              <h3 className="text-sm font-medium">Fechas</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="entry-date">Fecha de entrada</Label>
                                  {/*  <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`justify-start text-left font-normal ${!entryDate && "text-muted-foreground"}`}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {entryDate ? format(entryDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarIcon
                                  mode="single"
                                  selected={entryDate}
                                  onSelect={setEntryDate}
                                  initialFocus
                                  locale={es}
                                />
                              </PopoverContent>
                            </Popover> */}
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="load-date">Fecha de carga</Label>
                                  {/* <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`justify-start text-left font-normal ${!loadDate && "text-muted-foreground"}`}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {loadDate ? format(loadDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarIcon
                                  mode="single"
                                  selected={loadDate}
                                  onSelect={setLoadDate}
                                  initialFocus
                                  locale={es}
                                />
                              </PopoverContent>
                            </Popover> */}
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Información Comercial */}
                            <div className="grid gap-4">
                              <h3 className="text-sm font-medium">Información Comercial</h3>
                              <div className="grid gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="commercial">Comercial</Label>
                                  <Select defaultValue="juan">
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar comercial" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="juan">Juan Pérez</SelectItem>
                                      <SelectItem value="maria">María García</SelectItem>
                                      <SelectItem value="carlos">Carlos López</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="payment">Forma de pago</Label>
                                  <Select defaultValue="transfer">
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar forma de pago" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                                      <SelectItem value="credit">Crédito 30 días</SelectItem>
                                      <SelectItem value="cash">Efectivo</SelectItem>
                                      <SelectItem value="check">Cheque</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="incoterm">Incoterm</Label>
                                  <Select defaultValue="exw">
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar Incoterm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="exw">EXW - Ex Works</SelectItem>
                                      <SelectItem value="fob">FOB - Free on Board</SelectItem>
                                      <SelectItem value="cif">CIF - Cost, Insurance & Freight</SelectItem>
                                      <SelectItem value="dap">DAP - Delivered at Place</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Transporte */}
                            <div className="grid gap-4">
                              <h3 className="text-sm font-medium">Transporte</h3>
                              <div className="grid gap-2">
                                <Label htmlFor="transport">Empresa de transporte</Label>
                                <Select defaultValue="seur">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar transporte" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="seur">SEUR</SelectItem>
                                    <SelectItem value="dhl">DHL</SelectItem>
                                    <SelectItem value="ups">UPS</SelectItem>
                                    <SelectItem value="propio">Transporte Propio</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <Separator />

                            {/* Direcciones */}
                            <div className="grid gap-4">
                              <h3 className="text-sm font-medium">Direcciones</h3>
                              <div className="grid gap-4">
                                <div className="grid gap-2">
                                  <Label>Dirección de Facturación</Label>
                                  <Input placeholder="Nombre / Empresa" />
                                  <Input placeholder="Calle y número" />
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Código Postal" />
                                    <Input placeholder="Ciudad" />
                                  </div>
                                  <Input placeholder="Provincia" />
                                  <Input placeholder="País" />
                                </div>

                                <div className="grid gap-2">
                                  <Label>Dirección de Entrega</Label>
                                  <Input placeholder="Nombre / Empresa" />
                                  <Input placeholder="Calle y número" />
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Código Postal" />
                                    <Input placeholder="Ciudad" />
                                  </div>
                                  <Input placeholder="Provincia" />
                                  <Input placeholder="País" />
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Observaciones */}
                            <div className="grid gap-4">
                              <h3 className="text-sm font-medium">Observaciones</h3>
                              <div className="grid gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="production-notes">Observaciones de producción</Label>
                                  <Textarea
                                    id="production-notes"
                                    placeholder="Instrucciones especiales para producción..."
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="accounting-notes">Observaciones de contabilidad</Label>
                                  <Textarea
                                    id="accounting-notes"
                                    placeholder="Notas para el departamento de contabilidad..."
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="transport-notes">Observaciones de transporte</Label>
                                  <Textarea
                                    id="transport-notes"
                                    placeholder="Instrucciones especiales para el transporte..."
                                    className="min-h-[100px]"
                                  />
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Emails */}
                            <div className="grid gap-4">
                              <h3 className="text-sm font-medium">Emails</h3>
                              <div className="grid gap-2">
                                <Label htmlFor="emails">Lista de emails (uno por línea)</Label>
                                <Textarea
                                  id="emails"
                                  placeholder="ejemplo1@dominio.com&#10;ejemplo2@dominio.com&#10;ejemplo3@dominio.com"
                                  className="min-h-[150px] font-mono text-sm"
                                  onChange={(e) => {
                                    // Aquí podrías agregar validación de formato de email
                                    const emails = e.target.value.split("\n").filter(Boolean)
                                    // Validar cada email y dar feedback visual
                                  }}
                                />
                                <p className="text-sm text-muted-foreground">
                                  Introduce los emails separados por saltos de línea. Se validarán automáticamente.
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                              <Button variant="outline">Cancelar</Button>
                              <Button>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar cambios
                              </Button>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                      <Button variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Duplicar pedido</DropdownMenuItem>
                          <DropdownMenuItem>Cancelar pedido</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Eliminar pedido</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {order.transport.name.toLowerCase().includes('olano') ? (
                      <img className="" src='/images/decoration/trailer-olano.png' />) :
                      order.transport.name.toLowerCase().includes('tir') ? (
                        <img className="" src='/images/decoration/trailer-tir.png' />) :
                        order.transport.name.toLowerCase().includes('tpo') ?
                          (<img className="" src='/images/decoration/trailer-tpo.png' />) :
                          order.transport.name.toLowerCase().includes('distran') ?
                            (<img className="" src='/images/decoration/trailer-distran.png' />)
                            : order.transport.name.toLowerCase().includes('narval') ?
                              (<img className="" src='/images/decoration/trailer-narval.png' />)
                              : (
                                <img className="" src='/images/decoration/trailer.png' />)
                    }
                    <h3 className='text-2xl font-light text-white'>{order.transport.name}</h3>

                    
                  </div>
                </div>
              </div>






              {/* Form */}
              <div className='grow w-full h-full '>
                <div className="container mx-auto py-6 space-y-8">
                  {/* Header Section */}
                  

                  {/* Main Content */}
                  <Tabs defaultValue="details">
                    <TabsList>
                      <TabsTrigger value="details">Detalles</TabsTrigger>
                      <TabsTrigger value="products">Productos</TabsTrigger>
                      <TabsTrigger value="pallets">Palets</TabsTrigger>
                      <TabsTrigger value="documents">Documentos</TabsTrigger>
                      <TabsTrigger value="export">Exportar</TabsTrigger>
                      <TabsTrigger value="labels">Etiquetas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Cliente
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Empresa</div>
                              <div className="font-medium">Congelados Brisamar S.L.</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">CIF</div>
                              <div className="font-medium">B12345678</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Contacto</div>
                              <div className="font-medium">+34 555 123 456</div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              Fechas
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Entrada</div>
                              <div className="font-medium">19/02/2025</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Carga prevista</div>
                              <div className="font-medium">21/02/2025</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Entrega estimada</div>
                              <div className="font-medium">22/02/2025</div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Resumen
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Total productos</div>
                              <div className="font-medium">120.00 kg (5 cajas)</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Importe</div>
                              <div className="font-medium">1,250.00 €</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Estado</div>
                              {/* <Select defaultValue={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendiente</SelectItem>
                                  <SelectItem value="production">En Producción</SelectItem>
                                  <SelectItem value="ready">Listo para envío</SelectItem>
                                  <SelectItem value="shipped">Enviado</SelectItem>
                                  <SelectItem value="delivered">Entregado</SelectItem>
                                </SelectContent>
                              </Select> */}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Envío
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium mb-1.5">Dirección de entrega</div>
                                <div className="text-sm">Calle Principal 123</div>
                                <div className="text-sm">28001 Madrid</div>
                                <div className="text-sm">España</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium mb-1.5">Transporte</div>
                                <div className="text-sm">SEUR</div>
                                <div className="text-sm text-muted-foreground">Servicio 24h</div>
                                <div className="text-sm text-muted-foreground">Ref: TRS-2024-123</div>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1.5">Observaciones</div>
                              <div className="text-sm text-muted-foreground">
                                Temperatura controlada requerida durante el transporte
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Comercial
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Vendedor</div>
                              <div className="font-medium">Juan Pérez</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Forma de pago</div>
                              <div className="font-medium">Transferencia bancaria</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Incoterm</div>
                              <div className="font-medium">EXW - Ex Works</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="products">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                              <CardTitle className="text-lg font-medium">Productos del Pedido</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                Comparación entre productos registrados y paletizados
                              </p>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <HelpCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Verde: Cantidades coinciden
                                    <br />
                                    Amarillo: Diferencia en cantidades
                                    <br />
                                    Rojo: Producto faltante
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Discrepancia detectada</AlertTitle>
                              <AlertDescription>
                                Se han encontrado diferencias entre los productos registrados y los paletizados.
                              </AlertDescription>
                            </Alert>

                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[200px]">Artículo</TableHead>
                                    <TableHead>Pedido Original</TableHead>
                                    <TableHead>En Palets</TableHead>
                                    <TableHead>Diferencia</TableHead>
                                    <TableHead>Estado</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-medium">Pulpo Fresco -1kg</TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div>10.00 kg</div>
                                        <div className="text-sm text-muted-foreground">1 caja</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div>10.00 kg</div>
                                        <div className="text-sm text-muted-foreground">1 caja</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>0.00 kg</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="success" className="bg-green-500">
                                          <Check className="h-3 w-3 mr-1" />
                                          Correcto
                                        </Badge>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Pulpo Fresco +1kg</TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div>20.00 kg</div>
                                        <div className="text-sm text-muted-foreground">1 caja</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div>18.50 kg</div>
                                        <div className="text-sm text-muted-foreground">1 caja</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-amber-600">-1.50 kg</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="warning" className="bg-amber-500">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Diferencia
                                        </Badge>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Pulpo Fresco +2kg</TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div>90.00 kg</div>
                                        <div className="text-sm text-muted-foreground">3 cajas</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div>0.00 kg</div>
                                        <div className="text-sm text-muted-foreground">0 cajas</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-destructive">-90.00 kg</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="destructive">
                                          <X className="h-3 w-3 mr-1" />
                                          Faltante
                                        </Badge>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium">Total Pedido</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">120.00 kg</div>
                                  <p className="text-xs text-muted-foreground">5 cajas en total</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium">Total en Palets</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">28.50 kg</div>
                                  <p className="text-xs text-muted-foreground">2 cajas procesadas</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium">Diferencia</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold text-destructive">-91.50 kg</div>
                                  <p className="text-xs text-muted-foreground">3 cajas pendientes</p>
                                </CardContent>
                              </Card>
                            </div>

                            <div className="flex justify-end gap-4">
                              {/* <ExportDialog /> */}
                              <Button>
                                <Package className="h-4 w-4 mr-2" />
                                Gestionar productos
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="pallets">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg font-medium">Gestión de Palets</CardTitle>
                          <Button>
                            <SaveIcon className="h-4 w-4 mr-2" />
                            Guardar Cambios
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Número</TableHead>
                                <TableHead>Productos</TableHead>
                                <TableHead>Lotes</TableHead>
                                <TableHead>Cajas</TableHead>
                                <TableHead>Peso</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>2913</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div>Pulpo Fresco -1kg</div>
                                    <div>Pulpo Fresco +1kg</div>
                                    <div>Pulpo Fresco +2kg</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div>1002250CC01001</div>
                                    <div>Lote 2</div>
                                    <div>Lote 3</div>
                                  </div>
                                </TableCell>
                                <TableCell>5</TableCell>
                                <TableCell>120.00 kg</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="documents">
                      <div className="grid gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg font-medium">Documentación</CardTitle>
                            <CardDescription>Envía los documentos a los diferentes destinatarios</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Cliente */}
                              <div className="flex items-center justify-between border rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">Cliente</div>
                                    <div className="text-sm text-muted-foreground">cliente@brisamar.com</div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => console.log("Enviando albarán...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Albarán
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => console.log("Enviando factura...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Factura
                                  </Button>
                                </div>
                              </div>

                              {/* Transporte */}
                              <div className="flex items-center justify-between border rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <Truck className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">Transporte</div>
                                    <div className="text-sm text-muted-foreground">logistica@seur.com</div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => console.log("Enviando albarán...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Albarán
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => console.log("Enviando instrucciones...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Instrucciones
                                  </Button>
                                </div>
                              </div>

                              {/* Comercial */}
                              <div className="flex items-center justify-between border rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">Comercial</div>
                                    <div className="text-sm text-muted-foreground">juan.perez@empresa.com</div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => console.log("Enviando albarán...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Albarán
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => console.log("Enviando factura...")}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Factura
                                  </Button>
                                </div>
                              </div>

                              <Separator />

                              {/* Envío múltiple */}
                              <div className="grid gap-4">
                                <div className="flex items-center gap-4">
                                  <Select defaultValue="albaran" className="flex-1">
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar documento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="albaran">Albarán de entrega</SelectItem>
                                      <SelectItem value="factura">Factura</SelectItem>
                                      <SelectItem value="instrucciones">Instrucciones especiales</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select defaultValue="todos" className="flex-1">
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar destinatarios" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todos">Todos los destinatarios</SelectItem>
                                      <SelectItem value="cliente-comercial">Cliente y Comercial</SelectItem>
                                      <SelectItem value="cliente-transporte">Cliente y Transporte</SelectItem>
                                      <SelectItem value="transporte-comercial">Transporte y Comercial</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button onClick={() => console.log("Enviando documentos...")}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Enviar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="export">
                      <Card >
                        <CardHeader>
                          <CardTitle className="text-lg font-medium">Exportar Datos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <Select defaultValue="order">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="order">Datos del pedido</SelectItem>
                                      <SelectItem value="products">Listado de artículos</SelectItem>
                                      <SelectItem value="pallets">Información de palets</SelectItem>
                                      <SelectItem value="differences">Log de diferencias</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-[150px]">
                                  <Select defaultValue="excel">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                      <SelectItem value="excel">
                                        <div className="flex items-center gap-2">
                                          <FileSpreadsheet className="h-4 w-4" />
                                          Excel
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="csv">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4" />
                                          CSV
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="pdf">
                                        <div className="flex items-center gap-2">
                                          <FileType className="h-4 w-4" />
                                          PDF
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">Datos básicos</Badge>
                                <Badge variant="outline">Direcciones</Badge>
                                <Badge variant="outline">Observaciones</Badge>
                                <Badge variant="outline">Historial</Badge>
                                <Badge variant="outline">Precios</Badge>
                                <Badge variant="outline">Lotes</Badge>
                              </div>
                              <Button className="w-full">
                                <FileDown className="h-4 w-4 mr-2" />
                                Exportar selección
                              </Button>
                            </div>
                            <div className="border rounded-lg p-4 space-y-3">
                              <div className="text-sm font-medium">Exportación rápida</div>
                              <div className="grid gap-2">
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => console.log("Exportando albarán...")}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Albarán de entrega
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => console.log("Exportando factura...")}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Factura
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => console.log("Exportando etiquetas...")}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Etiquetas de palets
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => console.log("Exportando todo...")}
                                >
                                  <FileDown className="h-4 w-4 mr-2" />
                                  Exportar todo
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="labels">
                      <div className="grid gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg font-medium">Gestión de Etiquetas</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium">Etiquetas de producto</div>
                                    <div className="text-sm text-muted-foreground">
                                      Etiquetas individuales para cada caja de producto
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px]">
                                      <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Etiqueta estándar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Etiqueta con precio
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Etiqueta logística
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="rounded-lg border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[50px]">
                                          <Checkbox />
                                        </TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="w-[100px]">Cajas</TableHead>
                                        <TableHead className="w-[100px]">Etiquetas</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>
                                          <Checkbox />
                                        </TableCell>
                                        <TableCell>
                                          <div className="font-medium">Pulpo Fresco -1kg</div>
                                          <div className="text-sm text-muted-foreground">Lote: 1002250CC01001</div>
                                        </TableCell>
                                        <TableCell>1</TableCell>
                                        <TableCell>
                                          <Input type="number" defaultValue={1} className="w-20 h-8" />
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <Checkbox />
                                        </TableCell>
                                        <TableCell>
                                          <div className="font-medium">Pulpo Fresco +1kg</div>
                                          <div className="text-sm text-muted-foreground">Lote: 1002250CC01002</div>
                                        </TableCell>
                                        <TableCell>1</TableCell>
                                        <TableCell>
                                          <Input type="number" defaultValue={1} className="w-20 h-8" />
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <Checkbox />
                                        </TableCell>
                                        <TableCell>
                                          <div className="font-medium">Pulpo Fresco +2kg</div>
                                          <div className="text-sm text-muted-foreground">Lote: 1002250CC01003</div>
                                        </TableCell>
                                        <TableCell>3</TableCell>
                                        <TableCell>
                                          <Input type="number" defaultValue={3} className="w-20 h-8" />
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium">Etiquetas de palet</div>
                                    <div className="text-sm text-muted-foreground">Etiquetas para identificación de palets</div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px]">
                                      <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Etiqueta GS1
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Etiqueta interna
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Etiqueta cliente
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="rounded-lg border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[50px]">
                                          <Checkbox />
                                        </TableHead>
                                        <TableHead>Palet</TableHead>
                                        <TableHead className="w-[100px]">Etiquetas</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>
                                          <Checkbox />
                                        </TableCell>
                                        <TableCell>
                                          <div className="font-medium">Palet #2913</div>
                                          <div className="text-sm text-muted-foreground">5 cajas - 120.00 kg</div>
                                        </TableCell>
                                        <TableCell>
                                          <Input type="number" defaultValue={1} className="w-20 h-8" />
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              <Card className="md:col-span-2">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base font-medium">Etiquetas de envío</CardTitle>
                                  <CardDescription>Etiquetas para el transporte y entrega</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid md:grid-cols-3 gap-4">
                                    <Button variant="outline" className="h-auto py-4 justify-start">
                                      <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                          <Truck className="h-4 w-4" />
                                          <span className="font-medium">Etiqueta de transporte</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">SEUR - Servicio 24h</span>
                                      </div>
                                    </Button>
                                    <Button variant="outline" className="h-auto py-4 justify-start">
                                      <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                          <Package className="h-4 w-4" />
                                          <span className="font-medium">Etiqueta de contenido</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">Resumen del pedido</span>
                                      </div>
                                    </Button>
                                    <Button variant="outline" className="h-auto py-4 justify-start">
                                      <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle className="h-4 w-4" />
                                          <span className="font-medium">Etiqueta de manipulación</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">Temperatura controlada</span>
                                      </div>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="md:col-span-2">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base font-medium">Configuración de impresión</CardTitle>
                                  <CardDescription>Ajusta las opciones de impresión de etiquetas</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label>Impresora</Label>
                                      <Select defaultValue="zebra">
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="zebra">Zebra ZT411</SelectItem>
                                          <SelectItem value="brady">Brady i7100</SelectItem>
                                          <SelectItem value="toshiba">Toshiba B-EX4T2</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Formato</Label>
                                      <Select defaultValue="10x15">
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="10x15">10 x 15 cm</SelectItem>
                                          <SelectItem value="15x20">15 x 20 cm</SelectItem>
                                          <SelectItem value="20x30">20 x 30 cm</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Resolución</Label>
                                      <Select defaultValue="300">
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="200">200 DPI</SelectItem>
                                          <SelectItem value="300">300 DPI</SelectItem>
                                          <SelectItem value="600">600 DPI</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Alert for important notifications */}
                  <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Este pedido requiere temperatura controlada durante el transporte
                    </span>
                  </div>
                </div>









              </div>



              {/* Button Footer */}
              <div className='w-full flex flex-col md:flex-row items-center justify-end pt-5 gap-2'>

                <SlidingPanel
                  title="Editar Pedido"
                  buttonTitle="Editar"
                  className={`bg-white text-neutral-900 font-medium px-4 py-2 w-fit rounded-2xl text-sm`}
                >
                  {/* Tabs */}
                  <TabGroup>
                    <ScrollShadow
                      onWheel={(e) => {
                        e.preventDefault();
                        e.currentTarget.scrollLeft += e.deltaY; // Permite desplazamiento horizontal con la rueda
                      }}
                      orientation='horizontal'
                      hideScrollBar
                    >
                      <TabList className="flex items-center gap-1  w-full p-1 rounded-2xl ">
                        <Tab className="
                  data-[selected]:bg-white/40 data-[selected]:text-white 
                  data-[hover]:bg-white/30
                  bg-white/10
                  flex gap-2 py-1.5 px-4 rounded-2xl items-center justify-center
                  ">
                          <ArchiveBoxIcon className='w-4 h-4 text-white' />
                          <span className=' text-white text-sm '>Producción</span>
                        </Tab>
                        <Tab className="
                  data-[selected]:bg-white/40 data-[selected]:text-white 
                  data-[hover]:bg-white/30
                  bg-white/10
                  flex gap-2 py-1.5 px-4 rounded-2xl items-center justify-center
                  ">
                          <AdjustmentsHorizontalIcon className='w-4 h-4 text-white' />
                          <span className=' text-white text-sm'>Generales</span>
                        </Tab>
                        <Tab className="
                  data-[selected]:bg-white/40 data-[selected]:text-white 
                  data-[hover]:bg-white/30
                  bg-white/10
                  flex gap-2 py-1.5 px-4 rounded-2xl items-center justify-center
                  ">
                          <MapPinIcon className='w-4 h-4 text-white' />
                          <span className=' text-white text-sm'>Direcciones</span>
                        </Tab>
                        <Tab className="
                  data-[selected]:bg-white/40 data-[selected]:text-white 
                  data-[hover]:bg-white/30
                  bg-white/10
                  flex gap-2 py-1.5 px-4 rounded-2xl items-center justify-center
                  ">
                          <ClipboardDocumentIcon className='w-4 h-4 text-white' />
                          <span className=' text-white text-sm'>Observaciones</span>
                        </Tab>
                      </TabList>
                    </ScrollShadow>
                    <TabPanels>
                      {/* Producción */}
                      <TabPanel className='py-4'>
                        {/* Tablas */}
                        <div className='flex flex-col col-span-2 gap-10'> {/* gap-2 mt-5  mb-5 */}

                          {1 === 0 ? (
                            <div className='h-full bg-neutral-700 rounded-lg'>
                              <div className=' h-full w-full flex flex-col justify-center items-center border-2 rounded-lg border-dashed border-neutral-400 p-5'>
                                <MdPallet className='w-7 h-7 text-neutral-400' />
                                <p className='text-md text-center font-light text-neutral-400'>No existen palets asociados a este pedido</p>
                              </div>
                            </div>) : (
                            <>
                              <div className="w-full">
                                <div className="-m-1.5 overflow-x-auto">
                                  <div className="p-1.5 min-w-full inline-block align-middle">
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
                                      {/* <!-- Header --> */}
                                      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-200">
                                          Resumen
                                        </h2>
                                        <p className="text-sm text-gray-600 dark:text-neutral-400">
                                          Detalles de los articulos y cantidades vinculados al pedido.
                                        </p>
                                      </div>
                                      {/* <!-- End Header --> */}
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                        <thead className="bg-gray-50 dark:bg-white/5">
                                          <tr>
                                            <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
                                                Articulo
                                              </span>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
                                                Cajas
                                              </span>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
                                                Cantidad
                                              </span>
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">

                                          {/* {formattedOrder.summary.pallets().map((item, index) => (
                  <tr key={index}>
                    <td className="size-px whitespace-nowrap px-6 py-3">
                      <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                        {item.article.name}
                      </span>
                    </td>
                    <td className="size-px whitespace-nowrap px-6 py-3">
                      <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                        {item.boxes}
                      </span>
                    </td>
                    <td className="size-px whitespace-nowrap px-6 py-3">
                      <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                        {item.netWeight.toFixed(2)} kg
                      </span>
                    </td>
                  </tr>
                ))} */}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className=' col-span-2'>
                                <div className="w-full">
                                  <div className="-m-1.5 overflow-x-auto">
                                    <div className="p-1.5 min-w-full inline-block align-middle">
                                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
                                        {/* <!-- Header --> */}
                                        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
                                          <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-200">
                                            Palets
                                          </h2>
                                          <p className="text-sm text-gray-600 dark:text-neutral-400">
                                            Detalles de los palets vinculados al pedido.
                                          </p>
                                        </div>
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                          <thead className="bg-gray-50 dark:bg-white/5">
                                            <tr>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
                                                  Numero
                                                </span>
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">

                                                  Productos
                                                </span>
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">

                                                  Lotes
                                                </span>
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">

                                                  Cajas
                                                </span>
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-start whitespace-nowrap">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">

                                                  Peso
                                                </span>
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                            {order?.pallets.map((pallet, index) => (
                                              <tr key={index}>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    {pallet.id}
                                                  </span>
                                                </td>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    <ul>
                                                      {/* {pallet.articles.map((articulo, index) =>
                              <li key={index} className='mb-1'>
                                <span key={index} className=" bg-sky-100 mr-1 text-sky-800 text-xs font-medium  px-2.5 py-0.5 rounded-full dark:bg-sky-900 dark:text-sky-300 truncate">{articulo}</span>
                              </li>
                            )} */}
                                                    </ul>
                                                  </span>
                                                </td>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    <ul>
                                                      {/* {pallet.lots.map((lote, index) =>
                              <li key={index} className='mb-1'>
                                <span key={index} className="bg-slate-100 mr-1 text-slate-800 text-xs font-medium  px-2.5 py-0.5 rounded-full dark:bg-slate-900 dark:text-slate-300 truncate">{lote}</span>
                              </li>
                            )} */}
                                                    </ul>
                                                  </span>
                                                </td>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    {pallet.boxes.length}
                                                  </span>
                                                </td>
                                                <td className="size-px whitespace-nowrap px-6 py-3">
                                                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-neutral-200">
                                                    {pallet.netWeight.toFixed(2)} kg
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </TabPanel>
                      {/* Generales */}
                      <TabPanel className='py-4'>
                        <div className='w-full grid grid-cols-2 gap-y-4 gap-x-2'>

                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <label className="text-xs text-neutral-300">Empresa de transporte</label>
                            <select
                              name="transport"
                              className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500"
                            >
                              <option value="Prueba1">Prueba 1</option>
                              <option value="Prueba2">Prueba 2</option>
                              <option value="Prueba3">Prueba 3</option>
                            </select>
                          </div>

                          <div className='col-span-1 flex flex-col gap-1.5 '>
                            <label className="text-xs text-neutral-300">Incoterm</label>
                            <select name="incoterm" className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500">
                              <option value="Prueba1">Prueba 1</option>
                              <option value="Prueba2">Prueba 2</option>
                              <option value="Prueba3">Prueba 3</option>
                            </select>
                          </div>

                          <div className='col-span-1 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Comercial</label>
                            <select name="salesperson" className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500">
                              <option value="Prueba1">Prueba 1</option>
                              <option value="Prueba2">Prueba 2</option>
                              <option value="Prueba3">Prueba 3</option>
                            </select>
                          </div>

                          <div className='col-span-2 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Forma de pago</label>
                            <select name="paymentTerm" className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500">
                              <option value="Prueba1">Prueba 1</option>
                              <option value="Prueba2">Prueba 2</option>
                            </select>
                          </div>

                          <div className='col-span-2 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Buyer Reference</label>
                            <input
                              name="buyerReference"
                              type="text"
                              className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder="186987236"
                              required
                            />
                          </div>

                          <div className='col-span-1 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Fecha de entrada</label>
                            <input
                              name="entryDate"
                              type="date"
                              className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500"
                              required
                            />
                          </div>

                          <div className='col-span-1 flex flex-col gap-1.5'>
                            <label className="text-xs text-neutral-300">Fecha de salida</label>
                            <input
                              name="loadDate"
                              type="date"
                              className="border text-sm rounded-2xl w-full p-2 bg-black/35 border-neutral-600 placeholder-neutral-600 text-white focus:ring-sky-500 focus:border-sky-500"
                              required />
                          </div>
                        </div>

                        <div className='col-span-1 flex flex-col gap-1.5 py-2.5'>
                          <p className='text-xs text-neutral-300'>Emails</p>
                          <textarea
                            name="emails"
                            rows="4"
                            className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                            placeholder={`ejemplo@ejemplo.com;\nejemplo2@ejemplo.com;\nCC:ejemplo3@ejemplo.com;\n`}
                          />
                        </div>
                      </TabPanel>
                      {/* Direcciones */}
                      <TabPanel className='py-4'>
                        <div className='w-full grid grid-cols-2 gap-y-4 gap-x-2'>

                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <p className='text-xs text-neutral-300'>Dirección de Facturación</p>
                            <textarea
                              name="billingAddress"
                              rows="5"
                              className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder={`Ejemplo S.L.\nB215468698 \nC/ Ejemplo, 1\n28000 Madrid \nEspaña`}
                            />
                          </div>

                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <p className='text-xs text-neutral-300'>Dirección de Entrega</p>
                            <textarea
                              name="shippingAddress"
                              rows="5"
                              className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder={`Ejemplo S.L. \nC/ Ejemplo, 1\n28000 Madrid \nEspaña`}
                            />
                          </div>
                        </div>
                      </TabPanel>
                      {/* Observaciones */}
                      <TabPanel>
                        <div className='grow w-full grid grid-cols-2 pr-0 lg:pr-2 mt-5 gap-y-4 gap-x-4 overflow-y-auto'>
                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <p className='text-xs text-neutral-300'>Observaciones de Producción</p>
                            <textarea
                              name="productionNotes"
                              rows="4"
                              className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder={`Pulpo eviscerado T3: 56 cajas x 20kg \nHasta 1.000kg\nEtiqueta española`}
                            />
                          </div>
                          <div className='col-span-2 flex flex-col gap-1.5 '>
                            <p className='text-xs text-neutral-300'>Observaciones de Contabilidad</p>
                            <textarea
                              name="accountingNotes"
                              rows="4"
                              className="border text-sm rounded-2xl w-full p-2.5 bg-black/35 border-neutral-600 placeholder-neutral-600 placeholder:font-light text-white focus:ring-sky-500 focus:border-sky-500"
                              placeholder={`Precio: 12,30$/kg\nComision: 4%`}
                            />
                          </div>
                        </div>
                      </TabPanel>
                    </TabPanels>
                  </TabGroup>
                </SlidingPanel>


              </div>

            </div>

          </div>


          {/* Print Container (All documents) */}
          {/* {OrderPrintContainer}

          {createPortal(<Toaster />, document.body)} */}


        </>

      )

      }


    </>
  )
}

export default Order



