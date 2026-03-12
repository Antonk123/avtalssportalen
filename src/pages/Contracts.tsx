import { useState, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Eye, X, Filter, Download, Upload, FileText, Loader2, CheckSquare } from 'lucide-react';
import { useContracts, useCustomers, useContacts, useCreateContract, useCreateCustomer, useDeleteContract, useProfiles, useContractTypes, Contract, ContractStatus, ContractType } from '@/hooks/useSupabaseData';
import { useTags, useContractTags } from '@/hooks/useTags';
import { useDepartments } from '@/hooks/useDepartments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ContractExport } from '@/components/ContractExport';
import { SavedFilters, FilterState } from '@/components/SavedFilters';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const defaultForm = {
  contract_name: '',
  customer_id: '',
  contract_type: 'Serviceavtal' as ContractType,
  start_date: '',
  end_date: '',
  binding_months: 12,
  notice_months: 3,
  value_sek: '',
  auto_renew: false,
  responsible_contact_id: '',
  internal_responsible: '',
  reminder_days: 30,
  notes: '',
  status: 'Aktivt' as ContractStatus,
  department_id: '',
};

export default function Contracts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canEdit, canDelete } = useAuth();
  const { data: contracts = [], isLoading: loadingContracts } = useContracts();
  const { data: customers = [] } = useCustomers();
  const { data: allContacts = [] } = useContacts();
  const { data: profiles = [] } = useProfiles();
  const { data: tags = [] } = useTags();
  const { data: contractTypes = [] } = useContractTypes();
  const { data: departments = [] } = useDepartments();
  const { data: contractTags = [] } = useContractTags();
  const createContract = useCreateContract();
  const createCustomer = useCreateCustomer();
  const deleteContract = useDeleteContract();

  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerOrg, setQuickCustomerOrg] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  // Handle template query param - prefill form from template
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (!templateId) return;
    
    (async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (error || !data) return;
      
      setForm(f => ({
        ...f,
        contract_type: (data.contract_type || 'Övrigt') as ContractType,
        binding_months: data.binding_months ?? 12,
        notice_months: data.notice_months ?? 3,
        auto_renew: data.auto_renew ?? false,
        reminder_days: data.reminder_days ?? 30,
        notes: data.notes || '',
      }));
      setSheetOpen(true);
      // Clear the query param so it doesn't re-trigger
      setSearchParams({}, { replace: true });
    })();
  }, [searchParams]);

  const getCustomerById = (id: string) => customers.find(c => c.id === id);
  const getContactsForCustomer = (customerId: string) => allContacts.filter(c => c.customer_id === customerId);

  const tagsByContract = useMemo(() => {
    const map = new Map<string, string[]>();
    contractTags.forEach(ct => {
      const list = map.get(ct.contract_id) || [];
      list.push(ct.tag_id);
      map.set(ct.contract_id, list);
    });
    return map;
  }, [contractTags]);

  const activeFilterCount = [
    statusFilter !== 'all',
    customerFilter !== 'all',
    typeFilter !== 'all',
    departmentFilter !== 'all',
    selectedTags.length > 0,
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('all');
    setCustomerFilter('all');
    setTypeFilter('all');
    setDepartmentFilter('all');
    setSelectedTags([]);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery('');
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (customerFilter !== 'all' && c.customer_id !== customerFilter) return false;
      if (typeFilter !== 'all' && c.contract_type !== typeFilter) return false;
      if (departmentFilter !== 'all' && c.department_id !== departmentFilter) return false;
      if (dateFrom && new Date(c.end_date) < dateFrom) return false;
      if (dateTo && new Date(c.end_date) > dateTo) return false;
      if (selectedTags.length > 0) {
        const cTags = tagsByContract.get(c.id) || [];
        if (!selectedTags.some(t => cTags.includes(t))) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const customer = getCustomerById(c.customer_id);
        return c.contract_name.toLowerCase().includes(q) || customer?.company_name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [contracts, searchQuery, statusFilter, customerFilter, typeFilter, departmentFilter, selectedTags, dateFrom, dateTo, customers, tagsByContract]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContracts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContracts.map(c => c.id)));
    }
  };
  const selectedContracts = filteredContracts.filter(c => selectedIds.has(c.id));

  const handleBulkStatusChange = async (newStatus: ContractStatus) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} avtal ändrade till "${newStatus}"`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    } catch (err: any) {
      toast.error('Kunde inte uppdatera avtal: ' + err.message);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const valid = files.filter(f => allowed.includes(f.type));
    if (valid.length < files.length) toast.error('Endast PDF- och DOCX-filer tillåtna');
    setPendingFiles(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    if (!form.contract_name.trim() || !form.customer_id || !form.start_date || !form.end_date) return;
    try {
      const result = await createContract.mutateAsync({
        contract_name: form.contract_name,
        customer_id: form.customer_id,
        contract_type: form.contract_type,
        department_id: form.department_id || null,
        start_date: form.start_date,
        end_date: form.end_date,
        binding_months: form.binding_months,
        notice_months: form.notice_months,
        value_sek: form.value_sek ? parseInt(form.value_sek) : null,
        auto_renew: form.auto_renew,
        responsible_contact_id: form.responsible_contact_id || null,
        internal_responsible: form.internal_responsible,
        reminder_days: form.reminder_days,
        notes: form.notes,
        status: form.status,
        document_url: null,
      });

      // Upload pending files
      if (pendingFiles.length > 0 && result?.id) {
        setUploadingFiles(true);
        for (const file of pendingFiles) {
          const filePath = `${result.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('contract-documents')
            .upload(filePath, file);
          if (uploadError) {
            toast.error(`Kunde inte ladda upp ${file.name}: ${uploadError.message}`);
            continue;
          }
          await supabase.from('contract_documents').insert({
            contract_id: result.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            version: 1,
            original_name: file.name,
          } as never);
        }
        setUploadingFiles(false);
        toast.success(`${pendingFiles.length} dokument uppladdade`);
      }

      setForm(defaultForm);
      setPendingFiles([]);
      setSheetOpen(false);
    } catch (err) {
      // Error handled by mutation
    }
  };

  if (loadingContracts) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div><Skeleton className="h-8 w-24" /><Skeleton className="h-4 w-40 mt-2" /></div>
            <Skeleton className="h-10 w-36" />
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Avtal</h1>
            <p className="mt-1 text-sm text-muted-foreground">{contracts.length} registrerade avtal</p>
          </div>
          <div className="flex gap-2">
            <ContractExport
              contracts={filteredContracts.map(c => ({
                ...c,
                customer_name: getCustomerById(c.customer_id)?.company_name,
              }))}
            />
            {canEdit && (
              <Button onClick={() => setSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Lägg till avtal
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm">
            <div className="flex-1 min-w-full sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Sök avtal eller kund..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-10 sm:h-9" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 sm:h-9"><SelectValue placeholder="Alla statusar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="Aktivt">Aktivt</SelectItem>
                <SelectItem value="Utgånget">Utgånget</SelectItem>
                <SelectItem value="Uppsagt">Uppsagt</SelectItem>
                <SelectItem value="Utkast">Utkast</SelectItem>
                <SelectItem value="Granskning">Granskning</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="default"
                onClick={() => setShowFilters(v => !v)}
                className="gap-2 flex-1 sm:flex-initial h-10 sm:h-9"
              >
                <Filter className="h-4 w-4" />
                <span className="sm:inline">Filter</span>
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              <SavedFilters
                currentFilters={{
                  searchQuery,
                  statusFilter,
                  customerFilter,
                  typeFilter,
                  departmentFilter,
                  selectedTags,
                  dateFrom: dateFrom?.toISOString() ?? null,
                  dateTo: dateTo?.toISOString() ?? null,
                }}
                onApply={(f: FilterState) => {
                  setSearchQuery(f.searchQuery || '');
                  setStatusFilter(f.statusFilter || 'all');
                  setCustomerFilter(f.customerFilter || 'all');
                  setTypeFilter(f.typeFilter || 'all');
                  setDepartmentFilter(f.departmentFilter || 'all');
                  setSelectedTags(f.selectedTags || []);
                  setDateFrom(f.dateFrom ? new Date(f.dateFrom) : undefined);
                  setDateTo(f.dateTo ? new Date(f.dateTo) : undefined);
                }}
              />
            </div>
            {(activeFilterCount > 0 || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-10 sm:h-9 w-full sm:w-auto">
                <X className="h-3.5 w-3.5 mr-1" />
                Rensa
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 sm:h-9"><SelectValue placeholder="Alla kunder" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla kunder</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-9"><SelectValue placeholder="Alla avtalstyper" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla avtalstyper</SelectItem>
                  {contractTypes.map(ct => <SelectItem key={ct.id} value={ct.name}>{ct.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-9"><SelectValue placeholder="Alla avdelningar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla avdelningar</SelectItem>
                  {departments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full sm:w-[160px] h-10 sm:h-9 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    {dateFrom ? format(dateFrom, 'd MMM yyyy', { locale: sv }) : 'Slutdatum från'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={sv} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full sm:w-[160px] h-10 sm:h-9 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    {dateTo ? format(dateTo, 'd MMM yyyy', { locale: sv }) : 'Slutdatum till'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={sv} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center w-full">
                  <span className="text-xs text-muted-foreground mr-1">Taggar:</span>
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTags(prev =>
                        prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
                      )}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 sm:py-0.5 text-xs font-medium border transition-colors",
                        selectedTags.includes(tag.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && canEdit && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size} avtal markerade
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Select onValueChange={(v) => handleBulkStatusChange(v as ContractStatus)}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Ändra status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktivt">Aktivt</SelectItem>
                  <SelectItem value="Utgånget">Utgånget</SelectItem>
                  <SelectItem value="Uppsagt">Uppsagt</SelectItem>
                  <SelectItem value="Utkast">Utkast</SelectItem>
                  <SelectItem value="Granskning">Granskning</SelectItem>
                </SelectContent>
              </Select>
              <ContractExport
                contracts={selectedContracts.map(c => ({
                  ...c,
                  customer_name: getCustomerById(c.customer_id)?.company_name,
                }))}
              />
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" />
                Avmarkera
              </Button>
            </div>
            {bulkUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {filteredContracts.length === 0 ? (
            <div className="px-6 py-16 text-center text-muted-foreground">
              <p className="font-medium">Inga avtal matchade din sökning.</p>
              <p className="mt-1 text-sm">Prova att justera dina filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.size === filteredContracts.length && filteredContracts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 font-medium">Avtalsnamn</th>
                    <th className="px-6 py-3 font-medium hidden sm:table-cell">Kund</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Startar</th>
                    <th className="px-6 py-3 font-medium">Löper ut</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Bindningstid</th>
                    <th className="px-6 py-3 font-medium hidden lg:table-cell">Uppsägningstid</th>
                    <th className="px-6 py-3 font-medium hidden sm:table-cell">Värde</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract, index) => {
                    const customer = getCustomerById(contract.customer_id);
                    return (
                      <motion.tr
                        key={contract.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        className={cn(
                          "border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer",
                          selectedIds.has(contract.id) && "bg-primary/5"
                        )}
                        onClick={() => navigate(`/avtal/${contract.id}`)}
                      >
                        <td className="px-3 py-3 w-10" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(contract.id)}
                            onCheckedChange={() => toggleSelect(contract.id)}
                          />
                        </td>
                        <td className="px-6 py-3 font-medium text-card-foreground">{contract.contract_name}</td>
                        <td className="px-6 py-3 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                          <Link to={`/kunder/${contract.customer_id}`} className="text-primary hover:underline">
                            {customer?.company_name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground hidden md:table-cell">{contract.start_date}</td>
                        <td className="px-6 py-3 text-muted-foreground">{contract.end_date}</td>
                        <td className="px-6 py-3 text-muted-foreground hidden md:table-cell">{contract.binding_months} mån</td>
                        <td className="px-6 py-3 text-muted-foreground hidden lg:table-cell">{contract.notice_months} mån</td>
                        <td className="px-6 py-3 text-muted-foreground hidden sm:table-cell">
                          {contract.value_sek ? `${contract.value_sek.toLocaleString('sv-SE')} kr` : '—'}
                        </td>
                        <td className="px-6 py-3"><StatusBadge status={contract.status} /></td>
                        <td className="px-6 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Ta bort avtal?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Är du säker på att du vill ta bort avtalet "{contract.contract_name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteContract.mutate(contract.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Ta bort
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-heading">Lägg till avtal</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="contract_name">Avtalsnamn *</Label>
                <Input id="contract_name" value={form.contract_name} onChange={e => setForm(f => ({ ...f, contract_name: e.target.value }))} placeholder="T.ex. IT-support" className="mt-1" />
              </div>
              <div>
                <Label>Kund *</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={form.customer_id} onValueChange={v => setForm(f => ({ ...f, customer_id: v, responsible_contact_id: '' }))}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Välj kund..." /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setQuickCustomerOpen(true)} title="Skapa ny kund">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Avtalstyp</Label>
                <Select value={form.contract_type} onValueChange={v => setForm(f => ({ ...f, contract_type: v as ContractType }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(ct => <SelectItem key={ct.id} value={ct.name}>{ct.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department_id">Avdelning</Label>
                <Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}>
                  <SelectTrigger className="mt-1" id="department_id">
                    <SelectValue placeholder="Välj avdelning (valfritt)" />
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
                  <Label htmlFor="start_date">Startdatum *</Label>
                  <Input id="start_date" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="end_date">Slutdatum *</Label>
                  <Input id="end_date" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="binding_months">Bindningstid (månader)</Label>
                  <Input id="binding_months" type="number" value={form.binding_months} onChange={e => setForm(f => ({ ...f, binding_months: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="notice_months">Uppsägningstid (månader)</Label>
                  <Input id="notice_months" type="number" value={form.notice_months} onChange={e => setForm(f => ({ ...f, notice_months: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="value_sek">Avtalsvärde SEK</Label>
                <Input id="value_sek" type="number" value={form.value_sek} onChange={e => setForm(f => ({ ...f, value_sek: e.target.value }))} placeholder="100000" className="mt-1" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label>Förnyas automatiskt</Label>
                  <p className="text-xs text-muted-foreground">Avtalet förnyas vid slutdatum</p>
                </div>
                <Switch checked={form.auto_renew} onCheckedChange={c => setForm(f => ({ ...f, auto_renew: c }))} />
              </div>
              {form.customer_id && (
                <div>
                  <Label>Ansvarig kontaktperson</Label>
                  <Select value={form.responsible_contact_id} onValueChange={v => setForm(f => ({ ...f, responsible_contact_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Välj kontakt..." /></SelectTrigger>
                    <SelectContent>
                      {getContactsForCustomer(form.customer_id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="internal_responsible">Intern ansvarig</Label>
                <Select value={form.internal_responsible} onValueChange={v => setForm(f => ({ ...f, internal_responsible: v }))}>
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
                <Label htmlFor="reminder_days">Påminnelsedagar före uppsägningsfrist</Label>
                <Input id="reminder_days" type="number" value={form.reminder_days} onChange={e => setForm(f => ({ ...f, reminder_days: parseInt(e.target.value) || 30 }))} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ContractStatus }))}>
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
                <Label>Dokument</Label>
                <div className="mt-1 space-y-2">
                  {pendingFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removePendingFile(i)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Upload className="h-5 w-5" />
                    Ladda upp dokument (PDF/DOCX)
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Anteckningar</Label>
                <Textarea id="notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Övrig information..." className="mt-1" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={handleSubmit} disabled={createContract.isPending || uploadingFiles}>
                  {uploadingFiles ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Laddar upp...</> : createContract.isPending ? 'Sparar...' : 'Spara avtal'}
                </Button>
                <Button variant="outline" onClick={() => setSheetOpen(false)}>Avbryt</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={quickCustomerOpen} onOpenChange={setQuickCustomerOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Skapa ny kund</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="quick_company_name">Företagsnamn *</Label>
                <Input id="quick_company_name" value={quickCustomerName} onChange={e => setQuickCustomerName(e.target.value)} placeholder="AB Företaget" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="quick_org_number">Organisationsnummer</Label>
                <Input id="quick_org_number" value={quickCustomerOrg} onChange={e => setQuickCustomerOrg(e.target.value)} placeholder="556123-4567" className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuickCustomerOpen(false)}>Avbryt</Button>
              <Button
                disabled={!quickCustomerName.trim() || createCustomer.isPending}
                onClick={async () => {
                  try {
                    const newCustomer = await createCustomer.mutateAsync({
                      company_name: quickCustomerName.trim(),
                      org_number: quickCustomerOrg.trim(),
                      address: '',
                      postal_code: '',
                      city: '',
                      invoice_email: '',
                      notes: '',
                    });
                    setForm(f => ({ ...f, customer_id: newCustomer.id, responsible_contact_id: '' }));
                    setQuickCustomerName('');
                    setQuickCustomerOrg('');
                    setQuickCustomerOpen(false);
                  } catch {}
                }}
              >
                {createCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Skapa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
