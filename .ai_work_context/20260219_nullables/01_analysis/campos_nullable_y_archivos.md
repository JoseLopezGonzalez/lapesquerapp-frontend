# Análisis: Campos nullable (Orders / Customers) y archivos afectados

**Estado**: Completado  
**Última actualización**: 2026-02-19

## Campos nullable en API (post-Autoventa)

### Orders
- `paymentTerm`, `transport`, `incoterm`, `billingAddress`, `shippingAddress`, `emails`, `buyerReference`
- En listado/detalle: `customer`, `salesperson` pueden ser null en teoría.

### Customers
- `vatNumber`, `paymentTerm`, `billingAddress`, `shippingAddress`, `emails`, `contactInfo`, `country`, `transport`

## Archivos modificados en esta sesión

| Archivo | Cambio |
|---------|--------|
| OrderDetails/index.js | Optional chaining y '—' para salesperson, paymentTerm, incoterm, transport, shippingAddress, buyerReference, transportationNotes; arrays (emails/ccEmails) con ?? [] |
| OrderMap/index.js | No iframe si !order?.shippingAddress; mensaje "Sin dirección de envío" |
| OrderHeaderDesktop.jsx | order.customer?.name ?? '—', order.customer?.id ?? '—' |
| OrderSummaryMobile.jsx | Idem |
| OrderCard/index.js | order.customer?.name ?? '—' en aria-label, title y contenido |
| OrderDocuments/index.js | recipients con email/copyEmail ?? []; transport y salesperson solo si != null |
| OrderEditSheet/schemas/orderEditSchema.js | payment, incoterm, transport, buyerReference, billingAddress, shippingAddress, emails opcionales |
| entitiesConfig.js (customers) | Quitada validación required en vatNumber, billingAddress, shippingAddress, emails, ccEmails, contactInfo |
