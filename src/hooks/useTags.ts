import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
