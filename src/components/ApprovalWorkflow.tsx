import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateContract } from '@/hooks/useSupabaseData';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Approval {
  id: string;
  contract_id: string;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  decided_by: string | null;
  decided_at: string | null;
  comment: string;
  requester_name?: string;
  decider_name?: string;
}

export function ApprovalWorkflow({ contractId, contractStatus }: { contractId: string; contractStatus: string }) {
  const { user, isAdmin, canEdit } = useAuth();
  const queryClient = useQueryClient();
  const updateContract = useUpdateContract();
  const [comment, setComment] = useState('');
  const [showCommentField, setShowCommentField] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['contract_approvals', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_approvals')
        .select('*')
        .eq('contract_id', contractId)
        .order('requested_at', { ascending: false });
      if (error) throw error;

      // Fetch profile names
      const userIds = [...new Set((data as Approval[]).flatMap(a => [a.requested_by, a.decided_by].filter(Boolean) as string[]))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) ?? []);

      return (data as Approval[]).map(a => ({
        ...a,
        requester_name: profileMap.get(a.requested_by) || 'Okänd',
        decider_name: a.decided_by ? profileMap.get(a.decided_by) || 'Okänd' : null,
      }));
    },
    enabled: !!contractId,
  });

  const pendingApproval = approvals.find(a => a.status === 'pending');

  const requestApproval = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Ej inloggad');
      // Update contract status to Granskning
      await updateContract.mutateAsync({ id: contractId, status: 'Granskning' as never });
      const { error } = await supabase.from('contract_approvals').insert({
        contract_id: contractId,
        requested_by: user.id,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_approvals', contractId] });
      toast.success('Begäran om godkännande skickad');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decideApproval = useMutation({
    mutationFn: async ({ approvalId, decision }: { approvalId: string; decision: 'approved' | 'rejected' }) => {
      if (!user) throw new Error('Ej inloggad');
      const { error } = await supabase
        .from('contract_approvals')
        .update({
          status: decision,
          decided_by: user.id,
          decided_at: new Date().toISOString(),
          comment,
        })
        .eq('id', approvalId);
      if (error) throw error;

      // Update contract status based on decision
      const newStatus = decision === 'approved' ? 'Aktivt' : 'Utkast';
      await updateContract.mutateAsync({ id: contractId, status: newStatus as never });
    },
    onSuccess: (_, { decision }) => {
      queryClient.invalidateQueries({ queryKey: ['contract_approvals', contractId] });
      setComment('');
      setShowCommentField(false);
      setActionType(null);
      toast.success(decision === 'approved' ? 'Avtal godkänt' : 'Avtal avvisat');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAction = (type: 'approve' | 'reject') => {
    setActionType(type);
    setShowCommentField(true);
  };

  const confirmAction = () => {
    if (!pendingApproval || !actionType) return;
    decideApproval.mutate({
      approvalId: pendingApproval.id,
      decision: actionType === 'approve' ? 'approved' : 'rejected',
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-status-active" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-status-review" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Godkänt';
      case 'rejected': return 'Avvisat';
      default: return 'Inväntar godkännande';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5" />
        Godkännandeflöde
      </h2>

      {/* Action buttons */}
      {contractStatus === 'Utkast' && canEdit && !pendingApproval && (
        <Button
          onClick={() => requestApproval.mutate()}
          disabled={requestApproval.isPending}
          className="mb-4"
          size="sm"
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Skicka för godkännande
        </Button>
      )}

      {pendingApproval && isAdmin && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-status-review font-medium">
            <Clock className="h-4 w-4" />
            Inväntar ditt godkännande
          </div>
          <AnimatePresence mode="wait">
            {!showCommentField ? (
              <motion.div key="buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                <Button size="sm" onClick={() => handleAction('approve')} className="bg-status-active hover:bg-status-active/90 text-status-active-foreground">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Godkänn
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction('reject')} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Avvisa
                </Button>
              </motion.div>
            ) : (
              <motion.div key="comment" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                <Textarea
                  placeholder={actionType === 'approve' ? 'Valfri kommentar...' : 'Ange anledning till avvisning...'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="text-sm min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={confirmAction}
                    disabled={decideApproval.isPending}
                    className={actionType === 'approve' ? 'bg-status-active hover:bg-status-active/90 text-status-active-foreground' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}
                  >
                    {actionType === 'approve' ? 'Bekräfta godkännande' : 'Bekräfta avvisning'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCommentField(false); setActionType(null); }}>
                    Avbryt
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {pendingApproval && !isAdmin && (
        <div className="mb-4 flex items-center gap-2 text-sm text-status-review font-medium">
          <Clock className="h-4 w-4 animate-pulse" />
          Inväntar godkännande från admin
        </div>
      )}

      {/* History */}
      {approvals.length > 0 ? (
        <div className="space-y-3">
          {approvals.map((a) => (
            <div key={a.id} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5">{statusIcon(a.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{statusLabel(a.status)}</span>
                  <span className="text-xs text-muted-foreground">
                    begärd av {a.requester_name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(a.requested_at), 'd MMM yyyy HH:mm', { locale: sv })}
                  </span>
                </div>
                {a.decided_by && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.status === 'approved' ? 'Godkänt' : 'Avvisat'} av {a.decider_name}
                    {a.decided_at && ` — ${format(new Date(a.decided_at), 'd MMM yyyy HH:mm', { locale: sv })}`}
                  </p>
                )}
                {a.comment && (
                  <p className="text-xs text-muted-foreground mt-1 italic">"{a.comment}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Inga godkännanden ännu.</p>
      )}
    </div>
  );
}
