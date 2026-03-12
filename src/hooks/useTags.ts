import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ContractTag {
  contract_id: string;
  tag_id: string;
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').order('name');
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useContractTags() {
  return useQuery({
    queryKey: ['contract_tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contract_tags').select('contract_id, tag_id');
      if (error) throw error;
      return data as ContractTag[];
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .insert(tag)
        .select()
        .single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tagg skapad');
    },
    onError: (e: Error) => toast.error(`Kunde inte skapa tagg: ${e.message}`),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tag> & { id: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tagg uppdaterad');
    },
    onError: (e: Error) => toast.error(`Kunde inte uppdatera: ${e.message}`),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['contract_tags'] });
      toast.success('Tagg borttagen');
    },
    onError: (e: Error) => toast.error(`Kunde inte ta bort: ${e.message}`),
  });
}

export function useTagUsageCount() {
  return useQuery({
    queryKey: ['tag_usage_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_tags')
        .select('tag_id');
      if (error) throw error;

      const counts = new Map<string, number>();
      data.forEach(ct => {
        counts.set(ct.tag_id, (counts.get(ct.tag_id) || 0) + 1);
      });
      return counts;
    },
  });
}
