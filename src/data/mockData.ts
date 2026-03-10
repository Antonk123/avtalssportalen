import { Customer, Contact, Contract, ReminderLog, AppSettings } from '@/types';

export const customers: Customer[] = [
  {
    id: 'c1', created_at: '2024-01-15', company_name: 'Nordström & Partners AB',
    org_number: '556789-1234', address: 'Storgatan 12', postal_code: '111 22', city: 'Stockholm',
    invoice_email: 'faktura@nordstrom.se', notes: 'Viktig kund sedan 2020.',
  },
  {
    id: 'c2', created_at: '2023-06-01', company_name: 'Tekniklösningar Sverige AB',
    org_number: '559012-5678', address: 'Teknikvägen 5', postal_code: '412 58', city: 'Göteborg',
    invoice_email: 'ekonomi@tekniklosningar.se', notes: '',
  },
  {
    id: 'c3', created_at: '2024-03-10', company_name: 'Fjällbergs Fastigheter AB',
    org_number: '556345-9012', address: 'Bergsvägen 88', postal_code: '831 40', city: 'Östersund',
    invoice_email: 'faktura@fjallbergs.se', notes: 'Hanterar flera fastigheter i Jämtland.',
  },
  {
    id: 'c4', created_at: '2025-01-20', company_name: 'Digitalflow Nordic AB',
    org_number: '559876-3456', address: 'Innovationsgatan 3', postal_code: '211 45', city: 'Malmö',
    invoice_email: 'billing@digitalflow.se', notes: '',
  },
  {
    id: 'c5', created_at: '2024-09-05', company_name: 'Grönwall Konsult AB',
    org_number: '556123-7890', address: 'Konsultvägen 1', postal_code: '752 28', city: 'Uppsala',
    invoice_email: 'faktura@gronwall.se', notes: 'Konsultbolag specialiserat på hållbarhet.',
  },
];

export const contacts: Contact[] = [
  { id: 'ct1', customer_id: 'c1', name: 'Erik Nordström', role: 'VD', email: 'erik@nordstrom.se', phone: '070-123 45 67', is_primary: true },
  { id: 'ct2', customer_id: 'c1', name: 'Anna Lindqvist', role: 'Ekonomiansvarig', email: 'anna@nordstrom.se', phone: '070-234 56 78', is_primary: false },
  { id: 'ct3', customer_id: 'c2', name: 'Johan Bergman', role: 'CTO', email: 'johan@tekniklosningar.se', phone: '073-345 67 89', is_primary: true },
  { id: 'ct4', customer_id: 'c3', name: 'Maria Fjällberg', role: 'Fastighetsförvaltare', email: 'maria@fjallbergs.se', phone: '076-456 78 90', is_primary: true },
  { id: 'ct5', customer_id: 'c4', name: 'Oscar Svensson', role: 'Projektledare', email: 'oscar@digitalflow.se', phone: '072-567 89 01', is_primary: true },
  { id: 'ct6', customer_id: 'c4', name: 'Lisa Hansson', role: 'CEO', email: 'lisa@digitalflow.se', phone: '070-678 90 12', is_primary: false },
  { id: 'ct7', customer_id: 'c5', name: 'Karl Grönwall', role: 'Partner', email: 'karl@gronwall.se', phone: '073-789 01 23', is_primary: true },
];

export const contracts: Contract[] = [
  {
    id: 'a1', created_at: '2024-01-01', customer_id: 'c1', contract_name: 'IT-support och drift',
    contract_type: 'Serviceavtal', start_date: '2024-01-01', end_date: '2026-04-30',
    binding_months: 24, notice_months: 3, value_sek: 180000, auto_renew: true,
    responsible_contact_id: 'ct1', internal_responsible: 'Magnus Ek', reminder_days: 30,
    document_url: null, notes: 'Inkluderar helpdesk och nätverksövervakning.', status: 'Aktivt',
  },
  {
    id: 'a2', created_at: '2023-06-01', customer_id: 'c2', contract_name: 'Microsoft 365 licenser',
    contract_type: 'Licensavtal', start_date: '2023-06-01', end_date: '2026-05-31',
    binding_months: 36, notice_months: 3, value_sek: 96000, auto_renew: true,
    responsible_contact_id: 'ct3', internal_responsible: 'Sara Holm', reminder_days: 60,
    document_url: null, notes: '', status: 'Aktivt',
  },
  {
    id: 'a3', created_at: '2025-01-01', customer_id: 'c3', contract_name: 'Fastighetsskötsel',
    contract_type: 'Serviceavtal', start_date: '2025-01-01', end_date: '2027-01-01',
    binding_months: 24, notice_months: 6, value_sek: 420000, auto_renew: false,
    responsible_contact_id: 'ct4', internal_responsible: 'Magnus Ek', reminder_days: 30,
    document_url: null, notes: 'Fastighetsskötsel för 12 fastigheter.', status: 'Aktivt',
  },
  {
    id: 'a4', created_at: '2025-03-01', customer_id: 'c4', contract_name: 'NDA — Projektsamarbete',
    contract_type: 'NDA', start_date: '2025-03-01', end_date: '2026-03-01',
    binding_months: 12, notice_months: 1, value_sek: null, auto_renew: false,
    responsible_contact_id: 'ct5', internal_responsible: 'Sara Holm', reminder_days: 30,
    document_url: null, notes: '', status: 'Utgånget',
  },
  {
    id: 'a5', created_at: '2024-06-01', customer_id: 'c5', contract_name: 'Ramavtal konsulttjänster',
    contract_type: 'Ramavtal', start_date: '2024-06-01', end_date: '2026-06-01',
    binding_months: 24, notice_months: 3, value_sek: 350000, auto_renew: true,
    responsible_contact_id: 'ct7', internal_responsible: 'Magnus Ek', reminder_days: 45,
    document_url: null, notes: 'Hållbarhetskonsulttjänster.', status: 'Aktivt',
  },
  {
    id: 'a6', created_at: '2025-06-01', customer_id: 'c4', contract_name: 'Webbutveckling',
    contract_type: 'Serviceavtal', start_date: '2025-06-01', end_date: '2026-12-31',
    binding_months: 18, notice_months: 3, value_sek: 240000, auto_renew: false,
    responsible_contact_id: 'ct6', internal_responsible: 'Sara Holm', reminder_days: 30,
    document_url: null, notes: 'Ny webbplats och e-handel.', status: 'Aktivt',
  },
  {
    id: 'a7', created_at: '2023-01-01', customer_id: 'c3', contract_name: 'Kontorshyra',
    contract_type: 'Övrigt', start_date: '2023-01-01', end_date: '2025-12-31',
    binding_months: 36, notice_months: 6, value_sek: 540000, auto_renew: false,
    responsible_contact_id: 'ct4', internal_responsible: 'Magnus Ek', reminder_days: 90,
    document_url: null, notes: '', status: 'Utgånget',
  },
  {
    id: 'a8', created_at: '2025-09-01', customer_id: 'c1', contract_name: 'Säkerhetstjänster',
    contract_type: 'Serviceavtal', start_date: '2025-09-01', end_date: '2027-09-01',
    binding_months: 24, notice_months: 3, value_sek: 156000, auto_renew: true,
    responsible_contact_id: 'ct2', internal_responsible: 'Sara Holm', reminder_days: 30,
    document_url: null, notes: '', status: 'Aktivt',
  },
  {
    id: 'a9', created_at: '2026-01-01', customer_id: 'c2', contract_name: 'Datalagring molntjänst',
    contract_type: 'Licensavtal', start_date: '2026-01-01', end_date: '2026-03-15',
    binding_months: 3, notice_months: 1, value_sek: 24000, auto_renew: true,
    responsible_contact_id: 'ct3', internal_responsible: 'Magnus Ek', reminder_days: 14,
    document_url: null, notes: 'Korttidsavtal, behöver förnyas.', status: 'Aktivt',
  },
  {
    id: 'a10', created_at: '2026-02-15', customer_id: 'c5', contract_name: 'Marknadsföringsstrategi',
    contract_type: 'Övrigt', start_date: '2026-04-01', end_date: '2027-04-01',
    binding_months: 12, notice_months: 2, value_sek: 85000, auto_renew: false,
    responsible_contact_id: null, internal_responsible: 'Sara Holm', reminder_days: 30,
    document_url: null, notes: 'Inväntar kundens signatur.', status: 'Utkast',
  },
];

export const reminderLogs: ReminderLog[] = [
  { id: 'r1', contract_id: 'a9', sent_at: '2026-02-28T10:30:00', sent_to_email: 'johan@tekniklosningar.se', success: true, error_message: null },
  { id: 'r2', contract_id: 'a4', sent_at: '2026-01-15T09:00:00', sent_to_email: 'oscar@digitalflow.se', success: true, error_message: null },
  { id: 'r3', contract_id: 'a7', sent_at: '2025-09-01T08:00:00', sent_to_email: 'maria@fjallbergs.se', success: false, error_message: 'Ogiltig e-postadress' },
];

export const appSettings: AppSettings = {
  id: 's1',
  sender_name: 'Avtalsportalen',
  sender_email: 'paminnelser@avtalsportalen.se',
  default_reminder_days: 30,
  email_template: `Hej {{kontaktperson}},

Detta är en påminnelse om att avtalet "{{avtalsnamn}}" med {{kundnamn}} löper ut den {{slutdatum}}.

Sista dag för uppsägning är {{uppsägningsdatum}}.

Vänligen vidta åtgärd för att säkerställa att avtalet hanteras i tid.

Med vänliga hälsningar,
Avtalsportalen`,
};

// Helper functions
export function getCustomerById(id: string): Customer | undefined {
  return customers.find(c => c.id === id);
}

export function getContactsByCustomerId(customerId: string): Contact[] {
  return contacts.filter(c => c.customer_id === customerId);
}

export function getContractsByCustomerId(customerId: string): Contract[] {
  return contracts.filter(c => c.customer_id === customerId);
}

export function getContactById(id: string): Contact | undefined {
  return contacts.find(c => c.id === id);
}

export function getActiveContractCount(customerId: string): number {
  return contracts.filter(c => c.customer_id === customerId && c.status === 'Aktivt').length;
}

export function getPrimaryContact(customerId: string): Contact | undefined {
  return contacts.find(c => c.customer_id === customerId && c.is_primary);
}
