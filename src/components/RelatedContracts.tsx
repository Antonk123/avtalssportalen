import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useContracts, useCustomers } from '@/hooks/useSupabaseData';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface RelatedContract {
  contract_id: string;
  related_contract_id: string;
  relation_type: string;
}

interface RelatedContractsProps {
  contractId: string;
  readOnly?: boolean;
}

export function RelatedContracts({ contractId, readOnly = false }: RelatedContractsProps) {
  const { data: contracts = [] } = useContracts();
  const { data: customers = [] } = useCustomers();
  const [relations, setRelations] = useState<RelatedContract[]>([]);
  const [selectedContract, setSelectedContract] = useState('');
  const [relationType, setRelationType] = useState('Relaterat');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchRelations();
  }, [contractId]);

  const fetchRelations = async () => {
    const { data } = await supabase
      .from('related_contracts')
      .select('*')
      .or(`contract_id.eq.${contractId},related_contract_id.eq.${contractId}`);
    setRelations((data as RelatedContract[]) || []);
  };

  const relatedIds = relations.map(r =>
    r.contract_id === contractId ? r.related_contract_id : r.contract_id
  );

  const relatedContractData = relatedIds
    .map(id => contracts.find(c => c.id === id))
    .filter(Boolean);

  const availableContracts = contracts.filter(
    c => c.id !== contractId && !relatedIds.includes(c.id)
  );

  const getCustomerById = (id: string) => customers.find(c => c.id === id);

  const addRelation = async () => {
    if (!selectedContract) return;
    const { error } = await supabase.from('related_contracts').insert({
      contract_id: contractId,
      related_contract_id: selectedContract,
      relation_type: relationType,
    });
    if (error) { toast.error('Kunde inte koppla avtal'); return; }
    toast.success('Avtal kopplat');
    setSelectedContract('');
    setOpen(false);
    fetchRelations();
  };

  const removeRelation = async (relatedId: string) => {
    await supabase.from('related_contracts').delete()
      .or(`and(contract_id.eq.${contractId},related_contract_id.eq.${relatedId}),and(contract_id.eq.${relatedId},related_contract_id.eq.${contractId})`);
    toast.success('Koppling borttagen');
    fetchRelations();
  };

  if (relatedContractData.length === 0 && readOnly) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-semibold text-card-foreground flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Relaterade avtal
        </h2>
        {!readOnly && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Koppla avtal
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
              <div className="space-y-3">
                <Select value={selectedContract} onValueChange={setSelectedContract}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Välj avtal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContracts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.contract_name} — {getCustomerById(c.customer_id)?.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={relationType} onValueChange={setRelationType}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Relaterat">Relaterat</SelectItem>
                    <SelectItem value="Tilläggsavtal">Tilläggsavtal</SelectItem>
                    <SelectItem value="Huvudavtal">Huvudavtal</SelectItem>
                    <SelectItem value="Ersätter">Ersätter</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="w-full" onClick={addRelation} disabled={!selectedContract}>
                  Koppla
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {relatedContractData.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga relaterade avtal</p>
      ) : (
        <div className="space-y-2">
          {relatedContractData.map(c => {
            if (!c) return null;
            const customer = getCustomerById(c.customer_id);
            const rel = relations.find(
              r => (r.contract_id === contractId && r.related_contract_id === c.id) ||
                   (r.related_contract_id === contractId && r.contract_id === c.id)
            );
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <Link to={`/avtal/${c.id}`} className="text-sm font-medium text-primary hover:underline">
                    {c.contract_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {customer?.company_name} · {rel?.relation_type}
                  </p>
                </div>
                <StatusBadge status={c.status} />
                {!readOnly && (
                  <Button variant="ghost" size="sm" onClick={() => removeRelation(c.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
