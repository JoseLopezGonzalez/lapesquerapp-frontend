import React from 'react'

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Edit, Save } from 'lucide-react';

const OrderEditSheet = () => {
    return (
        <Sheet className=" ">
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Pedido
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[900px]  sm:min-w-[600px] px-7 py-7 ">
                <SheetHeader>
                    <SheetTitle>Editar Pedido #01527</SheetTitle>
                </SheetHeader>
                <div className="h-full flex flex-col py-4">

                    <div className="grow grid gap-6 py-4 px-5 h-full overflow-y-auto">
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
                                <Combobox
                                    className='w-full'
                                    options={[
                                        { value: 'seur', label: 'SEUR' },
                                        { value: 'dhl', label: 'DHL' },
                                        { value: 'ups', label: 'UPS' },
                                        { value: 'propio', label: 'Transporte Propio' },
                                    ]}
                                    placeholder="Seleccionar transporte"
                                    searchPlaceholder="Buscar transporte..."
                                    notFoundMessage="No se encontraron resultados"
                                />
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


                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                    <SheetTrigger asChild>
                        <Button variant="outline">Cancelar</Button>
                    </SheetTrigger>
                        <Button>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar cambios
                        </Button>
                    </div>

                </div>


            </SheetContent>
        </Sheet>
    )
}

export default OrderEditSheet