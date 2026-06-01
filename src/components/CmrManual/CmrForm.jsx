'use client';

import { format, parse } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel, FieldContent, FieldGroup } from '@/components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { defaultCmrData } from './cmr.types';

/** Parsea "lugar | fecha" en [lugar, fechaStr] */
function parsePlaceDate(value) {
  const s = value !== undefined && value !== '' ? String(value).trim() : '';
  const idx = s.indexOf('|');
  if (idx >= 0) return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()];
  return [s, ''];
}

/** Convierte "dd/MM/yyyy" a Date o null */
function parseDateStr(str) {
  if (!str || !str.trim()) return null;
  try {
    const d = parse(str.trim(), 'dd/MM/yyyy', new Date());
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Formulario manual CMR: todos los campos de CmrData organizados por secciones (casillas 1–24).
 * UI con componentes shadcn: Card, Field, Table, Button.
 * Estado controlado desde el padre vía value y onChange.
 */
export default function CmrForm({ value, onChange }) {
  const data = value ?? {};
  const set = (field, v) => onChange?.({ ...data, [field]: v });

  const emptyProductLine = () => ({
    marksAndNumbers: '',
    numberOfPackages: 0,
    methodOfPacking: '',
    natureOfGoods: '',
    statisticalNumber: '',
    grossWeight: 0,
    volume: '',
  });
  const productLines = (() => {
    const raw = data.productLines;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((l) => ({
        marksAndNumbers: l?.marksAndNumbers ?? '',
        numberOfPackages: l?.numberOfPackages ?? 0,
        methodOfPacking: l?.methodOfPacking ?? '',
        natureOfGoods: l?.natureOfGoods ?? '',
        statisticalNumber: l?.statisticalNumber ?? '',
        grossWeight: l?.grossWeight ?? 0,
        volume: l?.volume ?? '',
      }));
    }
    if (
      data.marksAndNumbers ||
      data.numberOfPackages ||
      data.methodOfPacking ||
      data.natureOfGoods ||
      data.grossWeight ||
      data.volume
    ) {
      return [
        {
          marksAndNumbers: data.marksAndNumbers ?? '',
          numberOfPackages: data.numberOfPackages ?? 0,
          methodOfPacking: data.methodOfPacking ?? '',
          natureOfGoods: data.natureOfGoods ?? '',
          statisticalNumber: data.statisticalNumber ?? '',
          grossWeight: data.grossWeight ?? 0,
          volume: data.volume ?? '',
        },
      ];
    }
    return defaultCmrData.productLines.map((l) => ({
      marksAndNumbers: l?.marksAndNumbers ?? '',
      numberOfPackages: l?.numberOfPackages ?? 0,
      methodOfPacking: l?.methodOfPacking ?? '',
      natureOfGoods: l?.natureOfGoods ?? '',
      statisticalNumber: l?.statisticalNumber ?? '',
      grossWeight: l?.grossWeight ?? 0,
      volume: l?.volume ?? '',
    }));
  })();
  const setProductLineField = (lineIndex, field, value) => {
    const next = productLines.map((line, i) =>
      i === lineIndex ? { ...line, [field]: value } : { ...line }
    );
    set('productLines', next);
  };
  const addProductLine = () => set('productLines', [...productLines, emptyProductLine()]);
  const removeProductLine = (lineIndex) => {
    if (productLines.length <= 1) return;
    set(
      'productLines',
      productLines.filter((_, i) => i !== lineIndex)
    );
  };

  const payment20Grid = (() => {
    const raw = data.payment20 ?? defaultCmrData.payment20;
    if (!Array.isArray(raw) || raw.length < 6)
      return defaultCmrData.payment20.map((row) => [...row]);
    return raw
      .slice(0, 6)
      .map((row) =>
        Array.isArray(row) && row.length >= 6 ? [...row.slice(0, 6)] : [...Array(6).fill('')]
      );
  })();
  const setPayment20Cell = (row, col, value) => {
    const next = payment20Grid.map((r, ri) =>
      ri === row ? r.map((c, ci) => (ci === col ? value : c)) : [...r]
    );
    set('payment20', next);
  };

  /** Palets: 5 columnas (normalizar a array de 5 strings) */
  const palletsPallets = (() => {
    const raw = data.palletsPallets ?? defaultCmrData.palletsPallets;
    if (!Array.isArray(raw)) return [...defaultCmrData.palletsPallets];
    const arr = raw.slice(0, 5).map((v) => (v != null ? String(v) : ''));
    while (arr.length < 5) arr.push('');
    return arr;
  })();
  const setPalletsPallets = (index, value) => {
    const next = palletsPallets.map((v, i) => (i === index ? value : v));
    set('palletsPallets', next);
  };

  const [place4, date4Str] = parsePlaceDate(data.placeAndDateOfReceiptOrLoad);
  const date4 = parseDateStr(date4Str);
  const [place21, date21Str] = parsePlaceDate(data.placeAndDate);
  const date21 = parseDateStr(date21Str);

  const setPlaceDate4 = (place, date) => {
    const placeVal = place ?? place4 ?? '';
    const dateVal = date ? format(date, 'dd/MM/yyyy') : date4Str || '';
    set('placeAndDateOfReceiptOrLoad', [placeVal, dateVal].filter(Boolean).join(' | ') || '');
  };
  const setPlaceDate21 = (place, date) => {
    const placeVal = place ?? place21 ?? '';
    const dateVal = date ? format(date, 'dd/MM/yyyy') : date21Str || '';
    set('placeAndDate', [placeVal, dateVal].filter(Boolean).join(' | ') || '');
  };

  const fieldClass = 'space-y-2';
  const inputClass = 'w-full';

  return (
    <div className="space-y-4">
      {/* Documento */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className={fieldClass}>
            <Field>
              <FieldLabel>No # (Número de documento)</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={data.documentNumber ?? ''}
                  onChange={(e) => set('documentNumber', e.target.value)}
                  placeholder="02440"
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* 1–4 Remitente / Destino */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Remitente y destino</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="space-y-4">
            <Field className={fieldClass}>
              <FieldLabel>1. Remitente (nombre, dirección, país)</FieldLabel>
              <FieldContent>
                <Textarea
                  className={`${inputClass} resize-y`}
                  value={data.sender ?? ''}
                  onChange={(e) => set('sender', e.target.value)}
                  placeholder="Nombre, dirección, país"
                  rows={4}
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>2. Consignatario (nombre, dirección, país)</FieldLabel>
              <FieldContent>
                <Textarea
                  className={`${inputClass} resize-y`}
                  value={data.consignee ?? ''}
                  onChange={(e) => set('consignee', e.target.value)}
                  placeholder="Destinatario, dirección, país"
                  rows={4}
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>3. Lugar de entrega</FieldLabel>
              <FieldContent>
                <Textarea
                  className={`${inputClass} resize-y`}
                  value={data.placeOfDelivery ?? ''}
                  onChange={(e) => set('placeOfDelivery', e.target.value)}
                  placeholder="Lugar de entrega"
                  rows={3}
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>4. Lugar y fecha recepción/carga</FieldLabel>
              <FieldContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={place4}
                    onChange={(e) => setPlaceDate4(e.target.value, date4)}
                    placeholder="Lugar"
                  />
                  <DatePicker
                    date={date4}
                    onChange={(d) => setPlaceDate4(place4, d)}
                    formatStyle="short"
                  />
                </div>
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>5. Documentos anexos</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={data.attachedDocuments ?? ''}
                  onChange={(e) => set('attachedDocuments', e.target.value)}
                  placeholder="Documentos anexos"
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* 6–12 Líneas de producto */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Líneas de producto</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marcas</TableHead>
                  <TableHead className="w-16">Bultos</TableHead>
                  <TableHead>Embalaje</TableHead>
                  <TableHead>Naturaleza</TableHead>
                  <TableHead className="w-20">Estad.</TableHead>
                  <TableHead className="w-20">Peso kg</TableHead>
                  <TableHead className="w-20">Vol.</TableHead>
                  <TableHead className="w-9" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {productLines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="p-1">
                      <Input
                        className="h-8 text-xs"
                        value={line.marksAndNumbers}
                        onChange={(e) =>
                          setProductLineField(idx, 'marksAndNumbers', e.target.value)
                        }
                        placeholder=""
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-14 text-xs"
                        value={line.numberOfPackages === 0 ? '' : line.numberOfPackages}
                        onChange={(e) =>
                          setProductLineField(
                            idx,
                            'numberOfPackages',
                            e.target.value ? Number(e.target.value) : 0
                          )
                        }
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-8 text-xs"
                        value={line.methodOfPacking}
                        onChange={(e) =>
                          setProductLineField(idx, 'methodOfPacking', e.target.value)
                        }
                        placeholder=""
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-8 text-xs"
                        value={line.natureOfGoods}
                        onChange={(e) => setProductLineField(idx, 'natureOfGoods', e.target.value)}
                        placeholder=""
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-8 text-xs"
                        value={line.statisticalNumber}
                        onChange={(e) =>
                          setProductLineField(idx, 'statisticalNumber', e.target.value)
                        }
                        placeholder=""
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8 w-16 text-xs"
                        value={line.grossWeight === 0 ? '' : line.grossWeight}
                        onChange={(e) =>
                          setProductLineField(
                            idx,
                            'grossWeight',
                            e.target.value ? Number(e.target.value) : 0
                          )
                        }
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-8 text-xs"
                        value={line.volume}
                        onChange={(e) => setProductLineField(idx, 'volume', e.target.value)}
                        placeholder=""
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => removeProductLine(idx)}
                        disabled={productLines.length <= 1}
                        title="Quitar línea"
                        aria-label="Quitar línea"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm" onClick={addProductLine}>
              + Añadir línea de producto
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Palets (5 columnas) */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Palets</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="space-y-4">
            <Field className={fieldClass}>
              <FieldLabel>Cargados por el remitente</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={palletsPallets[0] ?? ''}
                  onChange={(e) => setPalletsPallets(0, e.target.value)}
                  placeholder=""
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>Remesas al remitente</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={palletsPallets[1] ?? ''}
                  onChange={(e) => setPalletsPallets(1, e.target.value)}
                  placeholder=""
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>Entregados al destinatario</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={palletsPallets[2] ?? ''}
                  onChange={(e) => setPalletsPallets(2, e.target.value)}
                  placeholder=""
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>Devueltos por el destinatario</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={palletsPallets[3] ?? ''}
                  onChange={(e) => setPalletsPallets(3, e.target.value)}
                  placeholder=""
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>No devueltos, a recoger</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={palletsPallets[4] ?? ''}
                  onChange={(e) => setPalletsPallets(4, e.target.value)}
                  placeholder=""
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* 13–14 Instrucciones y pago */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Instrucciones y pago</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="space-y-4">
            <Field className={fieldClass}>
              <FieldLabel>13. Instrucciones del remitente</FieldLabel>
              <FieldContent>
                <Textarea
                  className={inputClass}
                  value={data.senderInstructions ?? ''}
                  onChange={(e) => set('senderInstructions', e.target.value)}
                  placeholder="Instrucciones"
                  rows={2}
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>14. Forma de pago</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={data.methodOfPayment ?? ''}
                  onChange={(e) => set('methodOfPayment', e.target.value)}
                  placeholder="Forma de pago"
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* 16–21 Porteador y condiciones */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Porteador y condiciones</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="space-y-4">
            <Field className={fieldClass}>
              <FieldLabel>16. Porteador (nombre, domicilio, país)</FieldLabel>
              <FieldContent>
                <Textarea
                  className={`${inputClass} resize-y`}
                  value={data.carrier ?? ''}
                  onChange={(e) => set('carrier', e.target.value)}
                  placeholder="Porteador, dirección, país"
                  rows={4}
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>17. Porteadores sucesivos</FieldLabel>
              <FieldContent>
                <Textarea
                  className={`${inputClass} resize-y`}
                  value={data.successiveCarriers ?? ''}
                  onChange={(e) => set('successiveCarriers', e.target.value)}
                  placeholder="Porteadores sucesivos"
                  rows={3}
                />
              </FieldContent>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field className={fieldClass}>
                <FieldLabel>17 Bis. Distancia (km)</FieldLabel>
                <FieldContent>
                  <Input
                    value={data.distance ?? ''}
                    onChange={(e) => set('distance', e.target.value)}
                    placeholder="Distancia en km"
                  />
                </FieldContent>
              </Field>
              <Field className={fieldClass}>
                <FieldLabel>17 Bis. Matrícula vehículo</FieldLabel>
                <FieldContent>
                  <Input
                    value={data.vehicleRegistration ?? ''}
                    onChange={(e) => set('vehicleRegistration', e.target.value)}
                    placeholder="Matrícula vehículo"
                  />
                </FieldContent>
              </Field>
              <Field className={fieldClass}>
                <FieldLabel>17 Bis. Matrícula remolque</FieldLabel>
                <FieldContent>
                  <Input
                    value={data.trailerRegistration ?? ''}
                    onChange={(e) => set('trailerRegistration', e.target.value)}
                    placeholder="Remolque / semiremolque"
                  />
                </FieldContent>
              </Field>
              <Field className={fieldClass}>
                <FieldLabel>Temperatura controlada (ºC)</FieldLabel>
                <FieldContent>
                  <Input
                    value={data.controlledTemperature ?? ''}
                    onChange={(e) => set('controlledTemperature', e.target.value)}
                    placeholder="Ej. 2, 2 a 8, -18"
                  />
                </FieldContent>
              </Field>
            </div>
            <Field className={fieldClass}>
              <FieldLabel>18. Reservas y observaciones</FieldLabel>
              <FieldContent>
                <Input
                  className={inputClass}
                  value={data.reservationsOrObservations ?? ''}
                  onChange={(e) => set('reservationsOrObservations', e.target.value)}
                  placeholder="Reservas y observaciones del porteador"
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>19. Estipulaciones particulares</FieldLabel>
              <FieldContent>
                <Textarea
                  className={inputClass}
                  value={data.specialAgreements ?? ''}
                  onChange={(e) => set('specialAgreements', e.target.value)}
                  placeholder="Estipulaciones"
                  rows={2}
                />
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>20. A pagar</FieldLabel>
              <FieldContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28" />
                      <TableHead colSpan={2}>Remitente</TableHead>
                      <TableHead colSpan={2}>Modena</TableHead>
                      <TableHead colSpan={2}>Consignatario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { label: 'Precio transporte' },
                      { label: 'Descuento' },
                      { label: 'Liquido/Balance' },
                      { label: 'Suplementos' },
                      { label: 'Gastos accesorios' },
                      { label: 'TOTAL' },
                    ].map(({ label }, row) => (
                      <TableRow key={row}>
                        <TableCell className="py-1 font-medium">{label}</TableCell>
                        {[0, 1, 2, 3, 4, 5].map((col) => (
                          <TableCell key={col} className="p-1">
                            <Input
                              className="h-8 text-xs"
                              value={payment20Grid[row]?.[col] ?? ''}
                              onChange={(e) => setPayment20Cell(row, col, e.target.value)}
                              placeholder=""
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </FieldContent>
            </Field>
            <Field className={fieldClass}>
              <FieldLabel>21. Establecido en</FieldLabel>
              <FieldContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={place21}
                    onChange={(e) => setPlaceDate21(e.target.value, date21)}
                    placeholder="Lugar"
                  />
                  <DatePicker
                    date={date21}
                    onChange={(d) => setPlaceDate21(place21, d)}
                    formatStyle="short"
                  />
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
