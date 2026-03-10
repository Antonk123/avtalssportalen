import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Building2, User, Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useContracts, useCustomers, useContacts } from '@/hooks/useSupabaseData';
import { StatusBadge } from '@/components/StatusBadge';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: contracts = [] } = useContracts();
  const { data: customers = [] } = useCustomers();
  const { data: contacts = [] } = useContacts();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => map.set(c.id, c.company_name));
    return map;
  }, [customers]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sök...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Sök avtal, kunder, kontakter..." />
        <CommandList>
          <CommandEmpty>Inga resultat hittades.</CommandEmpty>

          {contracts.length > 0 && (
            <CommandGroup heading="Avtal">
              {contracts.slice(0, 8).map(c => (
                <CommandItem
                  key={c.id}
                  value={`${c.contract_name} ${customerMap.get(c.customer_id) || ''}`}
                  onSelect={() => goTo(`/avtal/${c.id}`)}
                  className="flex items-center gap-3"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.contract_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{customerMap.get(c.customer_id)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {customers.length > 0 && (
            <CommandGroup heading="Kunder">
              {customers.slice(0, 6).map(c => (
                <CommandItem
                  key={c.id}
                  value={`${c.company_name} ${c.org_number}`}
                  onSelect={() => goTo(`/kunder/${c.id}`)}
                  className="flex items-center gap-3"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.company_name}</p>
                    <p className="text-xs text-muted-foreground">{c.org_number || c.city}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {contacts.length > 0 && (
            <CommandGroup heading="Kontakter">
              {contacts.slice(0, 6).map(c => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.email} ${c.role}`}
                  onSelect={() => goTo(`/kunder/${c.customer_id}`)}
                  className="flex items-center gap-3"
                >
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.role} · {c.email}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
