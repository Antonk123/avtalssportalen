import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ===== TYPES =====
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

// ===== CUSTOMERS =====
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name');
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('customers').insert(customer).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kund skapad');
    },
    onError: (e: Error) => toast.error(`Kunde inte skapa kund: ${e.message}`),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kund uppdaterad');
    },
    onError: (e: Error) => toast.error(`Kunde inte uppdatera: ${e.message}`),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kund borttagen');
    },
    onError: (e: Error) => toast.error(`Kunde inte ta bort: ${e.message}`),
  });
}

// ===== CONTACTS =====
export function useContacts(customerId?: string) {
  return useQuery({
    queryKey: ['contacts', customerId],
    queryFn: async () => {
      let query = supabase.from('contacts').select('*').order('is_primary', { ascending: false });
      if (customerId) query = query.eq('customer_id', customerId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Omit<Contact, 'id'>) => {
      const { data, error } = await supabase.from('contacts').insert(contact).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Kontakt skapad');
    },
    onError: (e: Error) => toast.error(`Kunde inte skapa kontakt: ${e.message}`),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Kontakt uppdaterad');
    },
    onError: (e: Error) => toast.error(`Kunde inte uppdatera: ${e.message}`),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Kontakt borttagen');
    },
    onError: (e: Error) => toast.error(`Kunde inte ta bort: ${e.message}`),
  });
}

// ===== CONTRACTS =====
export function useContracts(customerId?: string) {
  return useQuery({
    queryKey: ['contracts', customerId],
    queryFn: async () => {
      let query = supabase.from('contracts').select('*').order('end_date', { ascending: true });
      if (customerId) query = query.eq('customer_id', customerId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Contract[];
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contracts', 'single', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Contract;
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contract: Omit<Contract, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('contracts').insert(contract).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Avtal skapat');
    },
    onError: (e: Error) => toast.error(`Kunde inte skapa avtal: ${e.message}`),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase.from('contracts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Avtal uppdaterat');
    },
    onError: (e: Error) => toast.error(`Kunde inte uppdatera: ${e.message}`),
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Avtal borttaget');
    },
    onError: (e: Error) => toast.error(`Kunde inte ta bort: ${e.message}`),
  });
}

// ===== REMINDER LOG =====
export function useReminderLogs() {
  return useQuery({
    queryKey: ['reminder_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder_log')
        .select('*')
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data as ReminderLog[];
    },
  });
}

export function useClearReminderLogs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reminder_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminder_logs'] });
      toast.success('Påminnelseloggen har rensats');
    },
    onError: (e: Error) => toast.error(`Kunde inte rensa: ${e.message}`),
  });
}

// ===== SEND REMINDER =====
export function useSendReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: string) => {
      const { data, error } = await supabase.functions.invoke('send-reminder', {
        body: { contract_id: contractId },
      });
      if (error) throw error;
      if (data?.results?.[0]?.success === false) {
        throw new Error(data.results[0].error || 'Misslyckades att skicka påminnelse');
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminder_logs'] });
      toast.success('Påminnelse skickad!');
    },
    onError: (e: Error) => toast.error(`Kunde inte skicka: ${e.message}`),
  });
}

// ===== SETTINGS =====
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as AppSettings | null;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<AppSettings> & { id?: string }) => {
      if (settings.id) {
        const { data, error } = await supabase.from('settings').update(settings).eq('id', settings.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('settings').insert(settings).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Inställningar sparade');
    },
    onError: (e: Error) => toast.error(`Kunde inte spara: ${e.message}`),
  });
}

// ===== CONTRACT TYPES =====
export interface ContractTypeRecord {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export function useContractTypes() {
  return useQuery({
    queryKey: ['contract_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as ContractTypeRecord[];
    },
  });
}

export function useCreateContractType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('contract_types').insert({ name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract_types'] });
      toast.success('Avtalstyp skapad');
    },
    onError: (e: Error) => toast.error(`Kunde inte skapa: ${e.message}`),
  });
}

export function useDeleteContractType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contract_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract_types'] });
      toast.success('Avtalstyp borttagen');
    },
    onError: (e: Error) => toast.error(`Kunde inte ta bort: ${e.message}`),
  });
}

// ===== PROFILES =====
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, department');
      if (error) throw error;
      return data;
    },
  });
}

// ===== HELPERS =====
export function useActiveContractCount(customerId: string) {
  const { data: contracts } = useContracts(customerId);
  return contracts?.filter(c => c.status === 'Aktivt').length ?? 0;
}

export function usePrimaryContact(customerId: string) {
  const { data: contacts } = useContacts(customerId);
  return contacts?.find(c => c.is_primary);
}
