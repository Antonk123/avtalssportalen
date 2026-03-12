import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Calendar, Clock, RefreshCw, Send, Upload, Building2, User, FileText, Hash, Banknote, Bell, StickyNote, Pencil, Trash2 } from 'lucide-react';
import { differenceInDays, format, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useContract, useCustomers, useContacts, useUpdateContract, useDeleteContract, useSendReminder, useProfiles, useContractTypes, ContractType, ContractStatus } from '@/hooks/useSupabaseData';
import { useDepartments } from '@/hooks/useDepartments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { PdfViewer } from '@/components/PdfViewer';
import { FileUpload } from '@/components/FileUpload';
import { TagManager } from '@/components/TagManager';
import { RelatedContracts } from '@/components/RelatedContracts';
import { AuditLog } from '@/components/AuditLog';
import { ContractComments } from '@/components/ContractComments';
import { ActivityLog } from '@/components/ActivityLog';
import { ApprovalWorkflow } from '@/components/ApprovalWorkflow';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface DocFile {
  id?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  uploaded_at?: string;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, canDelete } = useAuth();
  const { data: contract, isLoading } = useContract(id || '');
  const { data: customers = [] } = useCustomers();
  const { data: allContacts = [] } = useContacts();
  const { data: profiles = [] } = useProfiles();
  const { data: contractTypes = [] } = useContractTypes();
  const { data: departments = [] } = useDepartments();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const sendReminder = useSendReminder();
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    contract_name: '',
    customer_id: '',
    contract_type: 'Serviceavtal' as ContractType,
    department_id: '',
    start_date: '',
    end_date: '',
    binding_months: 12,
    notice_months: 3,
    value_sek: '' as string | number,
    auto_renew: false,
    responsible_contact_id: '',
    internal_responsible: '',
    reminder_days: 30,
    notes: '',
    status: 'Aktivt' as ContractStatus,
  });

  useEffect(() => {
    if (contract) {
      setEditForm({
        contract_name: contract.contract_name,
        customer_id: contract.customer_id,
        contract_type: contract.contract_type as ContractType,
        department_id: contract.department_id || '',
        start_date: contract.start_date,
        end_date: contract.end_date,
        binding_months: contract.binding_months,
        notice_months: contract.notice_months,
        value_sek: contract.value_sek ?? '',
        auto_renew: contract.auto_renew,
        responsible_contact_id: contract.responsible_contact_id || '',
        internal_responsible: contract.internal_responsible,
        reminder_days: contract.reminder_days,
        notes: contract.notes,
        status: contract.status as ContractStatus,
      });
    }
  }, [contract]);

  const handleUpdateContract = async () => {
    if (!editForm.contract_name.trim() || !id) return;
    await updateContract.mutateAsync({
      id,
      contract_name: editForm.contract_name,
      customer_id: editForm.customer_id,
      contract_type: editForm.contract_type,
      department_id: editForm.department_id || null,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      binding_months: editForm.binding_months,
      notice_months: editForm.notice_months,
      value_sek: editForm.value_sek ? Number(editForm.value_sek) : null,
      auto_renew: editForm.auto_renew,
      responsible_contact_id: editForm.responsible_contact_id || null,
      internal_responsible: editForm.internal_responsible,
      reminder_days: editForm.reminder_days,
      notes: editForm.notes,
      status: editForm.status,
    });
    setEditSheetOpen(false);
  };

  const handleDeleteContract = async () => {
    if (!id) return;
    await deleteContract.mutateAsync(id);
    navigate('/avtal');
  };

  const getContactsForCustomer = (customerId: string) => allContacts.filter(c => c.customer_id === customerId);

  useEffect(() => {
    if (id) fetchDocuments();
  }, [id]);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from('contract_documents')
      .select('*')
      .eq('contract_id', id)
      .order('uploaded_at', { ascending: false });
    setDocuments((data as DocFile[]) || []);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!contract) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Avtalet hittades inte.</p>
          <Button variant="outline" asChild className="mt-4">
            <Link to="/avtal">Tillbaka till avtal</Link>
          </Button>
        </div>
      </PageTransition>
    );
  }

  const customer = customers.find(c => c.id === contract.customer_id);
  const contact = contract.responsible_contact_id
    ? allContacts.find(c => c.id === contract.responsible_contact_id)
    : null;
  const endDate = new Date(contract.end_date);
  const startDate = new Date(contract.start_date);
  const lastNoticeDate = subMonths(endDate, contract.notice_months);
  const daysUntilEnd = differenceInDays(endDate, new Date());
  const daysUntilNotice = differenceInDays(lastNoticeDate, new Date());
  const isInReminderWindow = daysUntilNotice <= contract.reminder_days && daysUntilNotice >= 0;

  const formatDate = (d: Date) => format(d, 'd MMMM yyyy', { locale: sv });
  const formatShortDate = (d: Date) => format(d, 'd MMM yyyy', { locale: sv });

  const totalDuration = differenceInDays(endDate, startDate);
  const elapsedDuration = differenceInDays(new Date(), startDate);
  const progressPercent = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
  const noticePercent = Math.max(0, Math.min(100, (differenceInDays(lastNoticeDate, startDate) / totalDuration) * 100));

  return (
    <PageTransition>
      <motion.div
        className="space-y-4 sm:space-y-6"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Header - Hero Section */}
        <motion.div
          variants={fadeUp}
          className="relative flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl bg-gradient-to-br from-card to-accent/5 p-5 sm:p-6 border-l-4 border-l-primary shadow-sm overflow-hidden"
        >
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-copper/15 via-transparent to-transparent rounded-bl-full pointer-events-none" />

          <Button variant="ghost" size="icon" asChild className="shrink-0 self-start relative z-10">
            <Link to="/avtal"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex-1 min-w-0 relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground tracking-tight">{contract.contract_name}</h1>
              <StatusBadge status={contract.status} />
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Link to={`/kunder/${contract.customer_id}`} className="text-sm text-primary hover:underline font-medium">
                {customer?.company_name}
              </Link>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-sm text-muted-foreground">{contract.contract_type}</span>
              <TagManager contractId={contract.id} readOnly={!canEdit} />
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap relative z-10">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setEditSheetOpen(true)} className="h-9 sm:h-8">
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Redigera</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setUploadSheetOpen(true)} className="h-9 sm:h-8">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ladda upp</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => sendReminder.mutate(contract.id)} disabled={sendReminder.isPending} className="h-9 sm:h-8">
              <Send className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">{sendReminder.isPending ? 'Skickar...' : 'Påminnelse'}</span>
            </Button>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 h-9 sm:h-8">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ta bort avtal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Är du säker på att du vill ta bort "{contract.contract_name}" permanent?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteContract} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Ta bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </motion.div>

        {/* Warning banner */}
        {isInReminderWindow && contract.status === 'Aktivt' && (
          <motion.div
            variants={fadeUp}
            className="flex items-start gap-3 rounded-xl border border-status-warning/30 bg-status-warning/8 px-4 py-3 sm:px-5 sm:py-3.5"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-status-warning/15 shrink-0">
              <AlertTriangle className="h-4 w-4 text-status-warning" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-foreground">Uppsägningsfristen närmar sig</p>
              <p className="text-muted-foreground mt-0.5">
                Sista dag: <span className="font-medium text-foreground">{formatDate(lastNoticeDate)}</span> ({daysUntilNotice} dagar kvar)
              </p>
            </div>
          </motion.div>
        )}

        {/* Main grid: stacked on mobile, 2/3 + 1/3 on desktop */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left column — contract info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Timeline card */}
            <motion.div variants={fadeUp} className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="font-heading text-sm sm:text-base font-semibold text-card-foreground">Avtalstid</h2>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                  <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                  {daysUntilEnd > 0 ? `${daysUntilEnd} dagar kvar` : 'Utgånget'}
                </div>
              </div>
              <div className="relative">
                <div className="h-2 sm:h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                  />
                </div>
                {/* Notice marker */}
                <div
                  className="absolute top-0 h-2 sm:h-2.5 w-0.5 bg-status-warning rounded-full"
                  style={{ left: `${noticePercent}%` }}
                />
                <div className="mt-3 sm:mt-4 flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">{formatShortDate(startDate)}</p>
                    <p className="mt-0.5">Start</p>
                  </div>
                  <div className="text-center hidden sm:block" style={{ position: 'absolute', left: `${Math.min(Math.max(noticePercent, 15), 85)}%`, transform: 'translateX(-50%)' }}>
                    <p className="font-medium text-status-warning">{formatShortDate(lastNoticeDate)}</p>
                    <p className="mt-0.5 text-status-warning">Uppsägning</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatShortDate(endDate)}</p>
                    <p className="mt-0.5">Slut</p>
                  </div>
                </div>
                {/* Mobile notice date below timeline */}
                <div className="sm:hidden mt-2 text-center">
                  <p className="text-[10px] font-medium text-status-warning">Uppsägning: {formatShortDate(lastNoticeDate)}</p>
                </div>
              </div>
            </motion.div>

            {/* Detail grid */}
            <motion.div variants={fadeUp} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
                <h2 className="font-heading text-sm sm:text-base font-semibold text-card-foreground">Avtalsdetaljer</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-border">
                <DetailCell icon={<Hash className="h-3.5 w-3.5" />} label="Avtalstyp" value={contract.contract_type} />
                <DetailCell
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Avdelning"
                  value={departments.find(d => d.id === contract.department_id)?.name || '—'}
                />
                <DetailCell icon={<Calendar className="h-3.5 w-3.5" />} label="Bindningstid" value={`${contract.binding_months} mån`} />
                <DetailCell icon={<Clock className="h-3.5 w-3.5" />} label="Uppsägningstid" value={`${contract.notice_months} mån`} />
                <DetailCell
                  icon={<Banknote className="h-3.5 w-3.5" />}
                  label="Avtalsvärde"
                  value={contract.value_sek ? `${contract.value_sek.toLocaleString('sv-SE')} kr` : '—'}
                  highlight
                />
                <DetailCell
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  label="Auto-förnyelse"
                  value={contract.auto_renew ? 'Ja' : 'Nej'}
                  valueColor={contract.auto_renew ? 'text-status-active' : undefined}
                />
                <DetailCell icon={<Bell className="h-3.5 w-3.5" />} label="Påminnelse" value={`${contract.reminder_days} dagar`} />
              </div>
            </motion.div>

            {/* Responsible parties */}
            <motion.div variants={fadeUp} className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
              <h2 className="font-heading text-sm sm:text-base font-semibold text-card-foreground mb-3 sm:mb-4">Ansvariga</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ResponsibleCard
                  icon={<Building2 className="h-4 w-4 text-primary" />}
                  label="Kund"
                  primary={
                    <Link to={`/kunder/${contract.customer_id}`} className="text-primary hover:underline font-medium">
                      {customer?.company_name}
                    </Link>
                  }
                />
                {contact && (
                  <ResponsibleCard
                    icon={<User className="h-4 w-4 text-primary" />}
                    label="Kontaktperson"
                    primary={<span className="font-medium text-card-foreground">{contact.name}</span>}
                    secondary={`${contact.role} · ${contact.email}`}
                  />
                )}
                <ResponsibleCard
                  icon={<User className="h-4 w-4 text-muted-foreground" />}
                  label="Intern ansvarig"
                  primary={<span className="font-medium text-card-foreground">{contract.internal_responsible || '—'}</span>}
                />
              </div>
              {contract.notes && (
                <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-border flex gap-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Anteckningar</p>
                    <p className="text-sm text-card-foreground whitespace-pre-wrap">{contract.notes}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Section Divider */}
            <motion.div variants={fadeUp} className="relative h-8 flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="relative bg-background px-4 text-muted-foreground text-xs">◆</span>
            </motion.div>

            {/* Tabs for secondary content */}
            <motion.div variants={fadeUp}>
              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 rounded-xl p-1 overflow-x-auto flex-nowrap no-scrollbar">
                  <TabsTrigger value="comments" className="rounded-lg text-[11px] sm:text-xs whitespace-nowrap">Kommentarer</TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-lg text-[11px] sm:text-xs whitespace-nowrap">Aktivitet</TabsTrigger>
                  <TabsTrigger value="related" className="rounded-lg text-[11px] sm:text-xs whitespace-nowrap">Relaterade</TabsTrigger>
                  <TabsTrigger value="audit" className="rounded-lg text-[11px] sm:text-xs whitespace-nowrap">Ändringslogg</TabsTrigger>
                </TabsList>
                <TabsContent value="comments" className="mt-3 sm:mt-4">
                  <ContractComments contractId={contract.id} />
                </TabsContent>
                <TabsContent value="activity" className="mt-3 sm:mt-4">
                  <ActivityLog contractId={contract.id} />
                </TabsContent>
                <TabsContent value="related" className="mt-3 sm:mt-4">
                  <RelatedContracts contractId={contract.id} readOnly={!canEdit} />
                </TabsContent>
                <TabsContent value="audit" className="mt-3 sm:mt-4">
                  <AuditLog contractId={contract.id} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Right column — documents (stacks below on mobile) */}
          <motion.div variants={fadeUp} className="space-y-4 sm:space-y-6">
            <div className="lg:sticky lg:top-20 space-y-4 sm:space-y-6">
              {/* Approval workflow */}
              <ApprovalWorkflow contractId={contract.id} contractStatus={contract.status} />

              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
                  <h2 className="font-heading text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Dokument
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setUploadSheetOpen(true)}>
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <DocumentsSidebar documents={documents} onUploadClick={() => setUploadSheetOpen(true)} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Upload sheet */}
        <Sheet open={uploadSheetOpen} onOpenChange={setUploadSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-4 sm:p-6">
            <SheetHeader>
              <SheetTitle className="font-heading">Ladda upp dokument</SheetTitle>
            </SheetHeader>
            <div className="mt-4 sm:mt-6">
              <FileUpload
                contractId={contract.id}
                existingFiles={documents}
                onFileUploaded={() => fetchDocuments()}
                onFileRemoved={() => fetchDocuments()}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit contract sheet */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6">
            <SheetHeader>
              <SheetTitle className="font-heading">Redigera avtal</SheetTitle>
            </SheetHeader>
            <div className="mt-4 sm:mt-6 space-y-4">
              <div>
                <Label>Avtalsnamn *</Label>
                <Input value={editForm.contract_name} onChange={e => setEditForm(f => ({ ...f, contract_name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Kund</Label>
                <Select value={editForm.customer_id} onValueChange={v => setEditForm(f => ({ ...f, customer_id: v, responsible_contact_id: '' }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Avtalstyp</Label>
                <Select value={editForm.contract_type} onValueChange={v => setEditForm(f => ({ ...f, contract_type: v as ContractType }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(ct => <SelectItem key={ct.id} value={ct.name}>{ct.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department_id">Avdelning (valfritt)</Label>
                <Select value={editForm.department_id || undefined} onValueChange={v => setEditForm(f => ({ ...f, department_id: v }))}>
                  <SelectTrigger className="mt-1" id="department_id">
                    <SelectValue placeholder="Välj avdelning..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Startdatum *</Label>
                  <Input type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Slutdatum *</Label>
                  <Input type="date" value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Bindningstid (mån)</Label>
                  <Input type="number" value={editForm.binding_months} onChange={e => setEditForm(f => ({ ...f, binding_months: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
                <div>
                  <Label>Uppsägningstid (mån)</Label>
                  <Input type="number" value={editForm.notice_months} onChange={e => setEditForm(f => ({ ...f, notice_months: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Avtalsvärde SEK</Label>
                <Input type="number" value={editForm.value_sek} onChange={e => setEditForm(f => ({ ...f, value_sek: e.target.value }))} className="mt-1" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label>Förnyas automatiskt</Label>
                  <p className="text-xs text-muted-foreground">Avtalet förnyas vid slutdatum</p>
                </div>
                <Switch checked={editForm.auto_renew} onCheckedChange={c => setEditForm(f => ({ ...f, auto_renew: c }))} />
              </div>
              {editForm.customer_id && (
                <div>
                  <Label>Ansvarig kontaktperson</Label>
                  <Select value={editForm.responsible_contact_id} onValueChange={v => setEditForm(f => ({ ...f, responsible_contact_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Välj kontakt..." /></SelectTrigger>
                    <SelectContent>
                      {getContactsForCustomer(editForm.customer_id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Intern ansvarig</Label>
                <Select value={editForm.internal_responsible} onValueChange={v => setEditForm(f => ({ ...f, internal_responsible: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Välj ansvarig" /></SelectTrigger>
                  <SelectContent>
                    {(profiles || []).map(p => (
                      <SelectItem key={p.id} value={p.full_name || p.id}>
                        {p.full_name || 'Namnlös användare'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Påminnelsedagar</Label>
                <Input type="number" value={editForm.reminder_days} onChange={e => setEditForm(f => ({ ...f, reminder_days: parseInt(e.target.value) || 30 }))} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as ContractStatus }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktivt">Aktivt</SelectItem>
                    <SelectItem value="Utkast">Utkast</SelectItem>
                    <SelectItem value="Granskning">Granskning</SelectItem>
                    <SelectItem value="Utgånget">Utgånget</SelectItem>
                    <SelectItem value="Uppsagt">Uppsagt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Anteckningar</Label>
                <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" rows={3} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={handleUpdateContract} disabled={updateContract.isPending}>
                  {updateContract.isPending ? 'Sparar...' : 'Spara ändringar'}
                </Button>
                <Button variant="outline" onClick={() => setEditSheetOpen(false)}>Avbryt</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>
    </PageTransition>
  );
}

/* ─── Sub-components ─── */

function DetailCell({
  icon,
  label,
  value,
  highlight,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] sm:text-xs">{label}</span>
      </div>
      <p className={`text-xs sm:text-sm font-semibold ${valueColor || 'text-card-foreground'} ${highlight ? 'sm:text-base' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function ResponsibleCard({
  icon,
  label,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  primary: React.ReactNode;
  secondary?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-xs sm:text-sm truncate">{primary}</div>
        {secondary && <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{secondary}</p>}
      </div>
    </div>
  );
}

function DocumentsSidebar({
  documents,
  onUploadClick,
}: {
  documents: DocFile[];
  onUploadClick: () => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="px-4 sm:px-5 py-6 sm:py-8 text-center">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block"
        >
          <FileText className="h-8 sm:h-10 w-8 sm:w-10 text-primary/25 mx-auto" />
        </motion.div>
        <p className="mt-3 text-sm text-muted-foreground">Inga dokument ännu</p>
        <p className="text-xs text-muted-foreground/60 mt-1">PDF & DOCX stöds</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={onUploadClick}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Ladda upp
        </Button>
      </div>
    );
  }

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('contract-documents').getPublicUrl(path);
    return data.publicUrl;
  };

  // Group documents by original_name (or file_name), show latest first
  const grouped: Record<string, DocFile[]> = {};
  documents.forEach(doc => {
    const key = (doc as any).original_name || doc.file_name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(doc);
  });

  // Sort each group by version descending
  Object.values(grouped).forEach(group => {
    group.sort((a, b) => ((b as any).version || 1) - ((a as any).version || 1));
  });

  return (
    <div className="divide-y divide-border">
      {Object.entries(grouped).map(([name, versions]) => {
        const latest = versions[0];
        const url = getPublicUrl(latest.file_path);
        const hasMultiple = versions.length > 1;

        return (
          <div key={name}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-accent/50 transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                  {latest.file_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    v{(latest as any).version || 1} — aktiv
                  </span>
                  {latest.uploaded_at && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {format(new Date(latest.uploaded_at), 'd MMM yyyy', { locale: sv })}
                    </span>
                  )}
                </div>
              </div>
            </a>
            {hasMultiple && (
              <div className="pl-14 sm:pl-16 pr-4 sm:pr-5 pb-2 space-y-1">
                {versions.slice(1).map(doc => {
                  const docUrl = getPublicUrl(doc.file_path);
                  return (
                    <a
                      key={doc.file_path}
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                    >
                      <FileText className="h-3 w-3 shrink-0" />
                      <span>v{(doc as any).version || 1}</span>
                      {doc.uploaded_at && (
                        <span>— {format(new Date(doc.uploaded_at), 'd MMM yyyy', { locale: sv })}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
