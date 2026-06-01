'use client';
import { notify } from '@/lib/notifications';
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  useLabelsQuery,
  useDeleteLabelMutation,
  useDuplicateLabelMutation,
} from '@/hooks/useLabels';
import Loader from '@/components/Utilities/Loader';
import { Trash2, CopyPlus, Tag, Search, Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const exampleModels = [
  {
    id: '1',
    name: 'Rizado Brisatlantic',
    elements: [
      {
        id: '1',
        type: 'sanitaryRegister',
        x: 146,
        y: 315,
        width: 72,
        height: 48,
        fontSize: 10,
        fontWeight: 'normal',
        textAlign: 'left',
        countryCode: 'ES',
        approvalNumber: '12.021462/H',
        suffix: 'C.E.',
        borderColor: '#000000',
        borderWidth: 1,
        color: '#000000',
      },
      {
        id: '2',
        type: 'richParagraph',
        x: 12,
        y: 9,
        width: 111,
        height: 43,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'left',
        html: 'POLPO FRESCO<div>ARRICCIATO</div>',
        color: '#000000',
      },
      {
        id: '3',
        type: 'text',
        x: 12,
        y: 45,
        width: 159,
        height: 25,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        text: 'Octopus Vulgaris - (OCC)',
        color: '#000000',
        textTransform: 'uppercase',
        verticalAlign: 'center',
      },
      {
        id: '4',
        type: 'text',
        x: 11,
        y: 67,
        width: 116,
        height: 30,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        text: 'Lotto di produzione:',
        color: '#000000',
        verticalAlign: 'center',
      },
      {
        id: '5',
        type: 'text',
        x: 11,
        y: 89,
        width: 114,
        height: 22,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        text: 'Data di partenza:',
        color: '#000000',
        verticalAlign: 'center',
      },
      {
        id: '6',
        type: 'text',
        x: 10,
        y: 107,
        width: 127,
        height: 23,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        text: 'Da consumare entro il:',
        color: '#000000',
        verticalAlign: 'center',
      },
      {
        id: '7',
        type: 'richParagraph',
        x: 11,
        y: 134,
        width: 333,
        height: 52,
        fontSize: 10,
        fontWeight: 'normal',
        textAlign: 'left',
        html: '<b>[IT] Modalità di presentazione:</b> eviscerato / <b>Metodo di produzione:</b> pesce pescato / <b>Zona di cattura:</b> FAO 27 IX.a Atlantico nord-orientale / <b>Metodo di pesca:</b> nasse e trapole (FPO) / <b>Origen:</b> Portogallo',
        color: '#000000',
      },
      {
        id: '8',
        type: 'richParagraph',
        x: 11,
        y: 185,
        width: 333,
        height: 49,
        fontSize: 10,
        fontWeight: 'normal',
        textAlign: 'left',
        html: '<b>Valore energetico:</b> 380kJ / 91kcal, Grassi: 1,40g, di cui saturi: 0.30g, Carboidrati: 1.40g, di cui zuccheri: 0.00g, Proteine: 17.90g, Sale: 0,91g / <b>Ingredienti:</b> Polpo (<b>Mollusco</b>), Sale',
        color: '#000000',
      },
      {
        id: '9',
        type: 'richParagraph',
        x: 12,
        y: 238,
        width: 152,
        height: 35,
        fontSize: 10,
        fontWeight: 'normal',
        textAlign: 'left',
        html: '<div><b>Conservare tra 0 e 4°C.</b></div><div><b>Da consumarse previa cottura.</b></div>',
        color: '#000000',
      },
      {
        id: '10',
        type: 'richParagraph',
        x: 14,
        y: 304,
        width: 138,
        height: 77,
        fontSize: 10,
        fontWeight: 'normal',
        textAlign: 'left',
        html: '<div>Prodotto lavorato per:</div><div><b>CONGELADOS BRISAMAR</b></div><div>Pol. Vista Hermosa N11a</div><div>21410 Isla Cristina (HUELVA)</div><div>España</div>',
        color: '#000000',
      },
      {
        id: '11',
        type: 'barcode',
        x: 7,
        y: 383,
        width: 340,
        height: 45,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        barcodeContent: '(01)98436613931182(3100)000500(10)1306250CC01003',
        barcodeType: 'gs1-128',
        showValue: true,
        color: '#000000',
      },
      {
        id: '12',
        type: 'text',
        x: 12,
        y: 276,
        width: 78,
        height: 29,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'left',
        text: 'Peso netto:',
        color: '#000000',
        horizontalAlign: 'left',
      },
      {
        id: '13',
        type: 'field',
        x: 89,
        y: 275,
        width: 97,
        height: 31,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left',
        field: 'product.weight',
        color: '#000000',
      },
      {
        id: '14',
        type: 'qr',
        x: 224,
        y: 276,
        width: 100,
        height: 100,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        qrContent:
          'SPECIE: POLPO - OCTOPUS VULGARIS (OCC) / METODO DI PRODUZIONE: CATTURATO / ZONA DI CATTURA: FAO 27 IXa Atlantico nord-orientale / NAVI: Raggruppamento / PRESENTAZIONE: EVISCERATO / LOTTO: 130625OCC01003 / PESO: 05000g',
        color: '#000000',
      },
    ],
    canvas: {
      width: 360,
      height: 440,
      rotation: 0,
    },
  },
  { id: '2', name: 'Etiqueta Producto Fresco', width: 600, height: 800 },
];

export default function LabelSelectorSheet({
  open,
  onOpenChange,
  onSelect,
  children,
  onNew,
  onDelete,
}) {
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const { data: labels = [], isLoading: loading, error } = useLabelsQuery(open);
  const deleteMutation = useDeleteLabelMutation();
  const duplicateMutation = useDuplicateLabelMutation();

  useEffect(() => {
    if (error) notify.error({ title: 'Error al cargar las etiquetas' });
  }, [error]);

  const handleOnClickNewLabel = () => {
    onNew && onNew();
    onOpenChange(false);
  };

  const handleDeleteClick = (labelId, labelName, e) => {
    e.stopPropagation();
    setLabelToDelete({ id: labelId, name: labelName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!labelToDelete) return;
    setDeletingId(labelToDelete.id);
    try {
      await deleteMutation.mutateAsync({ labelId: labelToDelete.id });
      notify.success({ title: 'Etiqueta eliminada correctamente' });
      if (onDelete) onDelete(labelToDelete.id);
      setDeleteDialogOpen(false);
      setLabelToDelete(null);
    } catch (err) {
      notify.error({ title: err?.message || 'Error al eliminar la etiqueta' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (labelId, e) => {
    e.stopPropagation();
    setDuplicatingId(labelId);
    try {
      await duplicateMutation.mutateAsync({ labelId });
      notify.success({ title: 'Etiqueta duplicada correctamente' });
      if (onDelete) onDelete(labelId);
    } catch (err) {
      notify.error({ title: err?.message || 'Error al duplicar la etiqueta' });
    } finally {
      setDuplicatingId(null);
    }
  };

  const filtered = labels.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (model) => {
    onSelect && onSelect(model);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent
          side="right"
          className="flex h-full w-[400px] flex-col gap-4 sm:w-[700px] sm:max-w-[700px]"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Modelos de Etiqueta
            </SheetTitle>
            <SheetDescription>
              Selecciona una etiqueta para editarla o crea una nueva
            </SheetDescription>
          </SheetHeader>

          {/* Search Bar */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Buscar etiqueta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Labels List */}
          <ScrollArea className="w-full flex-1">
            {loading ? (
              <div className="flex h-full w-full items-center justify-center py-20">
                <Loader className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Tag className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground text-sm">
                  {search ? 'No se encontraron etiquetas' : 'No hay etiquetas disponibles'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-2 pr-4">
                {filtered.map((m) => (
                  <Card
                    key={m.id}
                    className="group hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleSelect(m)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Tag className="text-primary h-4 w-4 flex-shrink-0" />
                            <h3 className="truncate text-sm font-medium">{m.name}</h3>
                          </div>
                          {m.format?.elements && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {m.format.elements.length}{' '}
                              {m.format.elements.length === 1 ? 'elemento' : 'elementos'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleDuplicate(m.id, e)}
                            disabled={duplicatingId === m.id}
                            title="Duplicar etiqueta"
                          >
                            {duplicatingId === m.id ? (
                              <Loader2 className="text-primary h-4 w-4 animate-spin" />
                            ) : (
                              <CopyPlus className="text-primary h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            onClick={(e) => handleDeleteClick(m.id, m.name, e)}
                            disabled={deletingId === m.id}
                            title="Eliminar etiqueta"
                          >
                            {deletingId === m.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* New Label Button */}
          <Button variant="default" className="w-full" onClick={handleOnClickNewLabel}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva etiqueta
          </Button>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar etiqueta?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar la etiqueta <strong>"{labelToDelete?.name}"</strong>. Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setLabelToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
