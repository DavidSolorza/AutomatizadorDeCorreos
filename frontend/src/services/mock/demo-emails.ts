/** Plantillas de correos demo — sector seguros AseEsta */

export interface DemoIncomingEmail {
  key: string;
  sender: string;
  sender_name: string;
  subject: string;
  body: string;
  /** Buzón destino preferido (analista) */
  mailboxAnalystId?: 'paula' | 'cristina' | 'marcela';
}

export const DEMO_INCOMING_EMAILS: DemoIncomingEmail[] = [
  {
    key: 'cotiz-empresa',
    sender: 'compras@grupoandino.com.co',
    sender_name: 'Grupo Andino SAS',
    subject: 'Cotización póliza empresarial — 120 empleados',
    body: 'Buenos días, requerimos cotización de póliza empresarial integral para 120 empleados. Incluir salud, vida y ARL. Favor enviar propuesta antes del viernes.',
    mailboxAnalystId: 'paula',
  },
  {
    key: 'cotiz-autos',
    sender: 'flota@transportesdelvalle.com',
    sender_name: 'Transportes del Valle',
    subject: 'Renovación flota vehículos comerciales — 45 unidades',
    body: 'Solicitamos renovación de póliza de flota para 45 vehículos comerciales. Adjuntamos listado de placas. Urgente respuesta.',
    mailboxAnalystId: 'paula',
  },
  {
    key: 'cartera-mora',
    sender: 'cobranzas@clientecorporativo.com',
    sender_name: 'Cartera Corporativa',
    subject: 'Reporte cartera en mora — vencimientos próximos 15 días',
    body: 'Informe de cartera: 23 pólizas con vencimiento en los próximos 15 días. Se requiere gestión de cobro y contacto con tomadores.',
    mailboxAnalystId: 'paula',
  },
  {
    key: 'renov-salud',
    sender: 'rrhh@techsolutions.co',
    sender_name: 'Tech Solutions Ltda',
    subject: 'Renovación póliza colectiva de salud 2026',
    body: 'Estimados, iniciamos proceso de renovación del plan colectivo de salud para 85 colaboradores. Necesitamos comparativo de coberturas y tarifas.',
    mailboxAnalystId: 'cristina',
  },
  {
    key: 'licit-gob',
    sender: 'contratacion@entidad.gov.co',
    sender_name: 'Entidad Pública Nacional',
    subject: 'Licitación pública LP-2026-0847 — Seguros patrimoniales',
    body: 'Invitación a participar en licitación pública para seguros patrimoniales. Plazo presentación ofertas: 20 días hábiles. Documentos en portal SECOP.',
    mailboxAnalystId: 'cristina',
  },
  {
    key: 'renov-vida',
    sender: 'gerencia@constructoraomega.com',
    sender_name: 'Constructora Omega',
    subject: 'Renovación seguro de vida grupo — 200 trabajadores',
    body: 'Requerimos cotización para renovación de seguro de vida colectivo. Vigencia actual vence en 30 días. Incluir beneficiarios y exclusiones.',
    mailboxAnalystId: 'cristina',
  },
  {
    key: 'emision-auto',
    sender: 'cliente@nuevovehiculo.com',
    sender_name: 'Carlos Méndez',
    subject: 'Emisión póliza vehículo nuevo — Mazda CX-5 2026',
    body: 'Acabo de adquirir vehículo Mazda CX-5 2026. Necesito emisión inmediata de póliza todo riesgo. Placa pendiente. Documentos adjuntos.',
    mailboxAnalystId: 'marcela',
  },
  {
    key: 'colectiva-autos',
    sender: 'admin@empresalogistica.com',
    sender_name: 'Empresa Logística SA',
    subject: 'Colectiva de automóviles — inclusión 12 vehículos nuevos',
    body: 'Solicitud de inclusión de 12 vehículos nuevos a colectiva de automóviles existente. Listado con VIN y valor comercial adjunto.',
    mailboxAnalystId: 'marcela',
  },
  {
    key: 'emision-hogar',
    sender: 'propietario@inmobiliaria.co',
    sender_name: 'Inmobiliaria Horizonte',
    subject: 'Emisión seguro hogar — edificio administrativo',
    body: 'Requerimos emisión de póliza de hogar para edificio administrativo de 3 pisos. Valor asegurado $2.500M. Inspección disponible esta semana.',
    mailboxAnalystId: 'marcela',
  },
  {
    key: 'urgente-siniestro',
    sender: 'siniestros@clienteurgente.com',
    sender_name: 'Cliente Urgente',
    subject: 'URGENTE: Reporte siniestro vehículo — requiere autorización',
    body: 'Reportamos siniestro vehicular ayer. Requiere autorización inmediata para taller. Póliza #POL-88492. Contactar al ajustador.',
    mailboxAnalystId: 'paula',
  },
  {
    key: 'docs-pendientes',
    sender: 'legal@aseguradora-cliente.com',
    sender_name: 'Departamento Legal',
    subject: 'Documentación pendiente — póliza colectiva',
    body: 'Faltan certificados de afiliación y listado actualizado de asegurados para continuar emisión. Plazo: 48 horas.',
    mailboxAnalystId: 'marcela',
  },
  {
    key: 'cotiz-pyme',
    sender: 'administracion@pymeinnovadora.com',
    sender_name: 'PYME Innovadora',
    subject: 'Cotización seguro PYME — local comercial',
    body: 'Somos PYME con local comercial de 120m². Necesitamos cotización de seguro todo riesgo empresarial incluyendo mercancía.',
    mailboxAnalystId: 'paula',
  },
];
