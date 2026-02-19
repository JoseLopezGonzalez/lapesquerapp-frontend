# Log de implementación

**Estado**: Completado  
**Última actualización**: 2026-02-19

## Cambios realizados

1. **OrderDetails/index.js** — Sustituidos accesos directos por optional chaining y '—' en móvil y desktop; bloque Transporte con order.transport?.emails ?? [] y order.transport?.ccEmails ?? [].

2. **OrderMap/index.js** — Variable hasShippingAddress; iframe solo si hay dirección; sino mensaje "Sin dirección de envío".

3. **OrderHeaderDesktop.jsx** — order.customer?.name ?? '—', order.customer?.id ?? '—'.

4. **OrderSummaryMobile.jsx** — Mismo patrón para customer.

5. **OrderCard/index.js** — aria-label, title y texto con order.customer?.name ?? '—' (móvil y desktop).

6. **OrderDocuments/index.js** — recipients: customer siempre con order.emails ?? [], order.ccEmails ?? []; transport y salesperson añadidos solo si order.transport != null y order.salesperson != null, con emails/ccEmails ?? [].

7. **OrderEditSheet/schemas/orderEditSchema.js** — payment, incoterm, transport, buyerReference, billingAddress, shippingAddress opcionales; emails con .optional().default([]).

8. **entitiesConfig.js** — Sección customers: eliminada validación required de vatNumber, billing_address, shipping_address, emails, ccEmails, contact_info.
