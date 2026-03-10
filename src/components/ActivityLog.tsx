import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Activity, Plus, Pencil, FileUp, Bell, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityEntry {
  id: string;
  type: 'create' | 'update' | 'upload' | 'reminder' | 'comment';
  description: string;
  user_name: string;
  timestamp: string;
  details?: string;
}

const typeConfig = {
  create: { icon: Plus, color: 'text-status-active', label: 'Skapat' },
  update: { icon: Pencil, color: 'text-primary', label: 'Ändring' },
  upload: { icon: FileUp, color: 'text-accent-foreground', label: 'Uppladdning' },
  reminder: { icon: Bell, color: 'text-status-warning', label: 'Påminnelse' },
  comment: { icon: MessageSquare, color: 'text-muted-foreground', label: 'Kommentar' },
};

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
};

export function ActivityLog({ contractId }: { contractId: string }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['activity_log', contractId],
    queryFn: async () => {
      // Fetch all data sources in parallel
      const [auditRes, docsRes, remindersRes, commentsRes] = await Promise.all([
        supabase
          .from('audit_log' as never)
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false }),
        supabase
          .from('contract_documents')
          .select('*')
          .eq('contract_id', contractId)
          .order('uploaded_at', { ascending: false }),
        supabase
          .from('reminder_log')
          .select('*')
          .eq('contract_id', contractId)
          .order('sent_at', { ascending: false }),
        supabase
          .from('contract_comments' as never)
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false }),
      ]);

      // Collect all user IDs
      const userIds = new Set<string>();
      (auditRes.data as any[])?.forEach(e => userIds.add(e.user_id));
      (commentsRes.data as any[])?.forEach(e => userIds.add(e.user_id));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', [...userIds]);
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) ?? []);

      const activities: ActivityEntry[] = [];

      // Audit log entries
      (auditRes.data as any[])?.forEach(entry => {
        const userName = profileMap.get(entry.user_id) || 'System';
        if (entry.action === 'INSERT') {
          activities.push({
            id: `audit-${entry.id}`,
            type: 'create',
            description: 'Avtal skapat',
            user_name: userName,
            timestamp: entry.created_at,
          });
        } else if (entry.action === 'UPDATE') {
          const fields = entry.changed_fields ? Object.keys(entry.changed_fields).filter(k => k !== 'created_at') : [];
          const fieldNames = fields.map(f => FIELD_LABELS[f] || f).join(', ');
          activities.push({
            id: `audit-${entry.id}`,
            type: 'update',
            description: `Ändrade ${fieldNames}`,
            user_name: userName,
            timestamp: entry.created_at,
            details: fields.map(f => {
              const old = String(entry.old_values?.[f] ?? '—');
              const newVal = String(entry.new_values?.[f] ?? '—');
              return `${FIELD_LABELS[f] || f}: ${old} → ${newVal}`;
            }).join(' · '),
          });
        }
      });

      // Document uploads
      (docsRes.data as any[])?.forEach(doc => {
        activities.push({
          id: `doc-${doc.id}`,
          type: 'upload',
          description: `Dokument uppladdad: ${doc.original_name || doc.file_name}`,
          user_name: 'Användare',
          timestamp: doc.uploaded_at,
        });
      });

      // Reminders
      (remindersRes.data as any[])?.forEach(rem => {
        activities.push({
          id: `rem-${rem.id}`,
          type: 'reminder',
          description: `Påminnelse skickad till ${rem.sent_to_email}`,
          user_name: 'System',
          timestamp: rem.sent_at,
          details: rem.success ? 'Lyckades' : `Misslyckades: ${rem.error_message}`,
        });
      });

      // Comments
      (commentsRes.data as any[])?.forEach(comment => {
        const userName = profileMap.get(comment.user_id) || 'Okänd';
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          description: comment.content.length > 80 ? comment.content.slice(0, 80) + '…' : comment.content,
          user_name: userName,
          timestamp: comment.created_at,
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return activities;
    },
    enabled: !!contractId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
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
          <Activity className="h-5 w-5" />
          Aktivitetslogg
        </h2>
        <p className="text-sm text-muted-foreground">Ingen aktivitet registrerad ännu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Aktivitetslogg
        <span className="text-xs font-normal text-muted-foreground">({entries.length})</span>
      </h2>
      <div className="relative space-y-0">
        {entries.map((entry, idx) => {
          const config = typeConfig[entry.type];
          const Icon = config.icon;
          return (
            <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
              {idx < entries.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
              )}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{entry.description}</span>
                  <span className="text-xs text-muted-foreground">— {entry.user_name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(entry.timestamp), 'd MMM yyyy HH:mm', { locale: sv })}
                  </span>
                </div>
                {entry.details && (
                  <p className="mt-1 text-xs text-muted-foreground">{entry.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
