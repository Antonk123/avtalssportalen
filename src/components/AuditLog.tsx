import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { History, Plus, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditEntry {
  id: string;
  contract_id: string;
  user_id: string;
  action: string;
  changed_fields: Record<string, unknown>;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  created_at: string;
  profile?: { full_name: string } | null;
}

const FIELD_LABELS: Record<string, string> = {
  contract_name: 'Avtalsnamn',
  contract_type: 'Avtalstyp',
  status: 'Status',
  start_date: 'Startdatum',
  end_date: 'Slutdatum',
  binding_months: 'Bindningstid',
  notice_months: 'Uppsägningstid',
  value_sek: 'Avtalsvärde',
  auto_renew: 'Automatisk förnyelse',
  internal_responsible: 'Intern ansvarig',
  reminder_days: 'Påminnelsedagar',
  notes: 'Anteckningar',
  customer_id: 'Kund',
  responsible_contact_id: 'Kontaktperson',
  document_url: 'Dokument-URL',
};

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case 'INSERT': return <Plus className="h-4 w-4 text-status-active" />;
    case 'UPDATE': return <Pencil className="h-4 w-4 text-primary" />;
    case 'DELETE': return <Trash2 className="h-4 w-4 text-destructive" />;
    default: return <History className="h-4 w-4 text-muted-foreground" />;
  }
}

function actionLabel(action: string) {
  switch (action) {
    case 'INSERT': return 'Avtal skapat';
    case 'UPDATE': return 'Avtal uppdaterat';
    case 'DELETE': return 'Avtal borttaget';
    default: return action;
  }
}

export function AuditLog({ contractId }: { contractId: string }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['audit_log', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log' as never)
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles for user names
      const userIds = [...new Set((data as AuditEntry[]).map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) ?? []);

      return (data as AuditEntry[]).map(entry => ({
        ...entry,
        profile: { full_name: profileMap.get(entry.user_id) || 'System' },
      }));
    },
    enabled: !!contractId,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-card-foreground mb-2 flex items-center gap-2">
          <History className="h-5 w-5" />
          Ändringslogg
        </h2>
        <p className="text-sm text-muted-foreground">Inga ändringar har loggats ännu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <History className="h-5 w-5" />
        Ändringslogg
      </h2>
      <div className="relative space-y-0">
        {entries.map((entry, idx) => (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline line */}
            {idx < entries.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}
            {/* Icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
              <ActionIcon action={entry.action} />
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {actionLabel(entry.action)}
                </span>
                <span className="text-xs text-muted-foreground">
                  av {entry.profile?.full_name || 'Okänd'}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(entry.created_at), 'd MMM yyyy HH:mm', { locale: sv })}
                </span>
              </div>
              {entry.action === 'UPDATE' && entry.changed_fields && (
                <div className="mt-2 space-y-1">
                  {Object.keys(entry.changed_fields)
                    .filter(k => k !== 'created_at')
                    .map(field => (
                      <div key={field} className="text-xs rounded-md bg-muted px-2.5 py-1.5 inline-flex items-center gap-1.5 mr-1.5 mb-1">
                        <span className="font-medium text-foreground">{FIELD_LABELS[field] || field}:</span>
                        <span className="text-muted-foreground line-through">
                          {String(entry.old_values[field] ?? '—')}
                        </span>
                        <span className="text-foreground">→</span>
                        <span className="text-foreground">
                          {String(entry.new_values[field] ?? '—')}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
