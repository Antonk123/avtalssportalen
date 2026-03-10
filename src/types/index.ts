export interface Customer {
  id: string;
  created_at: string;
  company_name: string;
  org_number: string;
  address: string;
  postal_code: string;
  city: string;
  invoice_email: string;
  notes: string;
}

export interface Contact {
  id: string;
  customer_id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: boolean;
}

export type ContractType = 'Serviceavtal' | 'Licensavtal' | 'Ramavtal' | 'NDA' | 'Övrigt';
export type ContractStatus = 'Aktivt' | 'Utgånget' | 'Uppsagt' | 'Utkast' | 'Granskning';

export interface Contract {
  id: string;
  created_at: string;
  customer_id: string;
  contract_name: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string;
  binding_months: number;
  notice_months: number;
  value_sek: number | null;
  auto_renew: boolean;
  responsible_contact_id: string | null;
  internal_responsible: string;
  reminder_days: number;
  document_url: string | null;
  notes: string;
  status: ContractStatus;
}

export interface ReminderLog {
  id: string;
  contract_id: string;
  sent_at: string;
  sent_to_email: string;
  success: boolean;
  error_message: string | null;
}

export interface AppSettings {
  id: string;
  sender_name: string;
  sender_email: string;
  default_reminder_days: number;
  email_template: string;
}
