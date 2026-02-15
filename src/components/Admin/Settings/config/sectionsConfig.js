export const SECTIONS = [
  {
    title: 'Datos generales',
    fields: [
      { name: 'company.name', label: 'Nombre de la empresa' },
      { name: 'company.cif', label: 'CIF' },
      { name: 'company.sanitary_number', label: 'Registro sanitario' },
    ],
  },
  {
    title: 'Dirección',
    fields: [
      { name: 'company.address.street', label: 'Calle' },
      { name: 'company.address.postal_code', label: 'Código postal' },
      { name: 'company.address.city', label: 'Ciudad' },
      { name: 'company.address.province', label: 'Provincia' },
      { name: 'company.address.country', label: 'País' },
    ],
  },
  {
    title: 'Web y Logo',
    fields: [
      { name: 'company.website_url', label: 'Web' },
      { name: 'company.logo_url_small', label: 'Logo (URL)' },
    ],
  },
  {
    title: 'Otros datos',
    fields: [
      { name: 'company.loading_place', label: 'Lugar de carga' },
      { name: 'company.signature_location', label: 'Lugar de firma' },
      { name: 'company.bcc_email', label: 'Email BCC' },
    ],
  },
  {
    title: 'Contactos',
    fields: [
      { name: 'company.contact.email_operations', label: 'Email operaciones' },
      { name: 'company.contact.email_orders', label: 'Email pedidos' },
      { name: 'company.contact.phone_orders', label: 'Teléfono pedidos' },
      { name: 'company.contact.email_admin', label: 'Email administración' },
      { name: 'company.contact.phone_admin', label: 'Teléfono administración' },
      { name: 'company.contact.emergency_email', label: 'Email emergencias' },
      { name: 'company.contact.incidents_email', label: 'Email incidencias' },
      { name: 'company.contact.loading_email', label: 'Email carga' },
      { name: 'company.contact.unloading_email', label: 'Email descarga' },
    ],
  },
  {
    title: 'Legales',
    fields: [
      { name: 'company.legal.terms_url', label: 'URL condiciones legales' },
      { name: 'company.legal.privacy_policy_url', label: 'URL política privacidad' },
    ],
  },
];
