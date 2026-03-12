import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Department {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  created_at: string;
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Department[];
    },
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dept: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .insert(dept)
        .select()
        .single();
      if (error) throw error;
      return data as Department;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Avdelning skapad');
    },
    onError: (e: Error) => toast.error(`Kunde inte skapa: ${e.message}`),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Department> & { id: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Department;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Avdelning uppdaterad');
    },
    onError: (e: Error) => toast.error(`Kunde inte uppdatera: ${e.message}`),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Avdelning borttagen');
    },
    onError: (e: Error) => toast.error(`Kunde inte ta bort: ${e.message}`),
  });
}

export function useDepartmentUsageCount() {
  return useQuery({
    queryKey: ['department_usage_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('department_id');
      if (error) throw error;

      const counts = new Map<string, number>();
      data.forEach(c => {
        if (c.department_id) {
          counts.set(c.department_id, (counts.get(c.department_id) || 0) + 1);
        }
      });
      return counts;
    },
  });
}
