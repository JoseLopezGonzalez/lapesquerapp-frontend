'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * Formulario manual CMR: todos los campos de CmrData organizados por secciones (casillas 1–24).
 * Estado controlado desde el padre vía value y onChange.
 */
export default function CmrForm({ value, onChange }) {
  const data = value ?? {};
  const set = (field, v) => onChange?.({ ...data, [field]: v });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold border-b pb-1">Documento</h3>
        <div>
          <Label>No # (Número de documento)</Label>
          <Input value={data.documentNumber ?? ''} onChange={(e) => set('documentNumber', e.target.value)} placeholder="02440" />
        </div>
      </section>
      {/* Casillas 1–4 */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold border-b pb-1">1–4 Remitente / Destino</h3>
        <div className="grid gap-2">
          <div>
            <Label>1. Remitente</Label>
            <Input value={data.sender ?? ''} onChange={(e) => set('sender', e.target.value)} placeholder="Remitente" />
          </div>
          <div>
            <Label>2. Consignatario</Label>
            <Input value={data.consignee ?? ''} onChange={(e) => set('consignee', e.target.value)} placeholder="Destinatario" />
          </div>
          <div>
            <Label>3. Lugar de entrega</Label>
            <Input value={data.placeOfDelivery ?? ''} onChange={(e) => set('placeOfDelivery', e.target.value)} placeholder="Lugar de entrega" />
          </div>
          <div>
            <Label>4. Lugar y fecha recepción/carga (lugar | fecha)</Label>
            <Input value={data.placeAndDateOfReceiptOrLoad ?? ''} onChange={(e) => set('placeAndDateOfReceiptOrLoad', e.target.value)} placeholder="Lugar | Fecha" />
          </div>
        </div>
      </section>

      {/* Casillas 5–9 */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold border-b pb-1">5–9 Documentación y mercancía</h3>
        <div className="grid gap-2">
          <div>
            <Label>5. Documentos anexos</Label>
            <Input value={data.attachedDocuments ?? ''} onChange={(e) => set('attachedDocuments', e.target.value)} placeholder="Documentos anexos" />
          </div>
          <div>
            <Label>6. Marcas y números</Label>
            <Input value={data.marksAndNumbers ?? ''} onChange={(e) => set('marksAndNumbers', e.target.value)} placeholder="Marcas y números" />
          </div>
          <div>
            <Label>7. Nº de bultos</Label>
            <Input type="number" min={0} value={data.numberOfPackages ?? ''} onChange={(e) => set('numberOfPackages', e.target.value ? Number(e.target.value) : 0)} placeholder="0" />
          </div>
          <div>
            <Label>8. Método de embalaje</Label>
            <Input value={data.methodOfPacking ?? ''} onChange={(e) => set('methodOfPacking', e.target.value)} placeholder="Embalaje" />
          </div>
          <div>
            <Label>9. Naturaleza de la mercancía</Label>
            <Input value={data.natureOfGoods ?? ''} onChange={(e) => set('natureOfGoods', e.target.value)} placeholder="Naturaleza" />
          </div>
        </div>
      </section>

      {/* Casillas 11–14 (10 y 15 reservadas) */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold border-b pb-1">11–14 Peso, volumen, instrucciones, pago</h3>
        <div className="grid gap-2">
          <div>
            <Label>11. Peso bruto (kg)</Label>
            <Input type="number" min={0} step={0.01} value={data.grossWeight ?? ''} onChange={(e) => set('grossWeight', e.target.value ? Number(e.target.value) : 0)} placeholder="0" />
          </div>
          <div>
            <Label>12. Volumen</Label>
            <Input value={data.volume ?? ''} onChange={(e) => set('volume', e.target.value)} placeholder="Volumen" />
          </div>
          <div>
            <Label>13. Instrucciones del remitente</Label>
            <Textarea value={data.senderInstructions ?? ''} onChange={(e) => set('senderInstructions', e.target.value)} placeholder="Instrucciones" rows={2} />
          </div>
          <div>
            <Label>14. Forma de pago</Label>
            <Input value={data.methodOfPayment ?? ''} onChange={(e) => set('methodOfPayment', e.target.value)} placeholder="Forma de pago" />
          </div>
        </div>
      </section>

      {/* Casillas 16–21 */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold border-b pb-1">16–21 Porteador y condiciones</h3>
        <div className="grid gap-2">
          <div>
            <Label>16. Porteador</Label>
            <Input value={data.carrier ?? ''} onChange={(e) => set('carrier', e.target.value)} placeholder="Porteador" />
          </div>
          <div>
            <Label>17. Porteadores sucesivos</Label>
            <Input value={data.successiveCarriers ?? ''} onChange={(e) => set('successiveCarriers', e.target.value)} placeholder="Porteadores sucesivos" />
          </div>
          <div>
            <Label>18. Reservas y observaciones</Label>
            <Textarea value={data.reservationsOrObservations ?? ''} onChange={(e) => set('reservationsOrObservations', e.target.value)} placeholder="Reservas" rows={2} />
          </div>
          <div>
            <Label>19. Estipulaciones particulares</Label>
            <Textarea value={data.specialAgreements ?? ''} onChange={(e) => set('specialAgreements', e.target.value)} placeholder="Estipulaciones" rows={2} />
          </div>
          <div>
            <Label>20. A pagar por</Label>
            <Input value={data.payableBy ?? ''} onChange={(e) => set('payableBy', e.target.value)} placeholder="A pagar por" />
          </div>
          <div>
            <Label>21. Establecido en (lugar | fecha)</Label>
            <Input value={data.placeAndDate ?? ''} onChange={(e) => set('placeAndDate', e.target.value)} placeholder="Lugar | Fecha" />
          </div>
        </div>
      </section>

      {/* Casillas 22–24 Firmas */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold border-b pb-1">22–24 Firmas</h3>
        <div className="grid gap-2">
          <div>
            <Label>22. Remitente</Label>
            <Input value={data.senderSignature ?? ''} onChange={(e) => set('senderSignature', e.target.value)} placeholder="Firma remitente" />
          </div>
          <div>
            <Label>23. Transportista</Label>
            <Input value={data.carrierSignature ?? ''} onChange={(e) => set('carrierSignature', e.target.value)} placeholder="Firma transportista" />
          </div>
          <div>
            <Label>24. Consignatario</Label>
            <Input value={data.consigneeSignature ?? ''} onChange={(e) => set('consigneeSignature', e.target.value)} placeholder="Firma consignatario" />
          </div>
        </div>
      </section>
    </div>
  );
}
