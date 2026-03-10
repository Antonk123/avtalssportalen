import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Copy, Trash2, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContractTypes } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Template {
  id: string;
  name: string;
  description: string;
  contract_type: string;
  binding_months: number;
  notice_months: number;
  auto_renew: boolean;
  reminder_days: number;
  notes: string;
  created_at: string;
  created_by: string;
}

const defaultForm = {
  name: '',
  description: '',
  contract_type: 'Serviceavtal',
  binding_months: 12,
  notice_months: 3,
  auto_renew: false,
  reminder_days: 30,
  notes: '',
};

export default function TemplatesPage() {
  const { canEdit, user } = useAuth();
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const { data: contractTypes = [] } = useContractTypes();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['contract_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates' as never)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (tmpl: typeof defaultForm) => {
      const { error } = await supabase
        .from('contract_templates' as never)
        .insert({ ...tmpl, created_by: user?.id } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract_templates'] });
      toast.success('Mall skapad');
      setSheetOpen(false);
      setForm(defaultForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contract_templates' as never)
        .delete()
        .eq('id', id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract_templates'] });
      toast.success('Mall borttagen');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Avtalsmallar</h1>
            <p className="mt-1 text-sm text-muted-foreground">{templates.length} mallar</p>
          </div>
          {canEdit && (
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ny mall
            </Button>
          )}
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-medium text-foreground">Inga mallar ännu</p>
            <p className="mt-1 text-sm text-muted-foreground">Skapa din första avtalsmall för att snabba upp avtalshanteringen.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(t => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-semibold text-card-foreground">{t.name}</h3>
                    <span className="text-xs text-muted-foreground">{t.contract_type}</span>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
                {t.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                )}
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><dt className="font-medium">Bindning</dt><dd>{t.binding_months} mån</dd></div>
                  <div><dt className="font-medium">Uppsägning</dt><dd>{t.notice_months} mån</dd></div>
                  <div><dt className="font-medium">Auto-förnyelse</dt><dd>{t.auto_renew ? 'Ja' : 'Nej'}</dd></div>
                  <div><dt className="font-medium">Påminnelse</dt><dd>{t.reminder_days} dagar</dd></div>
                </dl>
                <div className="mt-auto pt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/avtal?template=${t.id}`}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Använd
                    </Link>
                  </Button>
                  {canEdit && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ta bort mall?</AlertDialogTitle>
                          <AlertDialogDescription>Mallen "{t.name}" tas bort permanent.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTemplate.mutate(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Ta bort</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-heading">Ny avtalsmall</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <Label>Mallnamn *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Beskrivning</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={3} />
              </div>
              <div>
                <Label>Avtalstyp</Label>
                <Select value={form.contract_type} onValueChange={v => setForm(f => ({ ...f, contract_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(ct => <SelectItem key={ct.id} value={ct.name}>{ct.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Bindningstid (mån)</Label>
                  <Input type="number" value={form.binding_months} onChange={e => setForm(f => ({ ...f, binding_months: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label>Uppsägningstid (mån)</Label>
                  <Input type="number" value={form.notice_months} onChange={e => setForm(f => ({ ...f, notice_months: Number(e.target.value) }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Påminnelsedagar</Label>
                  <Input type="number" value={form.reminder_days} onChange={e => setForm(f => ({ ...f, reminder_days: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.auto_renew} onCheckedChange={v => setForm(f => ({ ...f, auto_renew: v }))} />
                  <Label>Auto-förnyelse</Label>
                </div>
              </div>
              <div>
                <Label>Standardanteckningar</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" rows={3} />
              </div>
              <Button className="w-full" onClick={() => createTemplate.mutate(form)} disabled={!form.name.trim() || createTemplate.isPending}>
                {createTemplate.isPending ? 'Skapar...' : 'Skapa mall'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
