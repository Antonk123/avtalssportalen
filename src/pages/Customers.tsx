import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, FileText, Trash2, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCustomers, useContacts, useContracts, useCreateCustomer, useCreateContact, useDeleteCustomer } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Customers() {
  const { canEdit, canDelete } = useAuth();
  const { data: customers = [], isLoading } = useCustomers();
  const { data: allContacts = [] } = useContacts();
  const { data: allContracts = [] } = useContracts();
  const createCustomer = useCreateCustomer();
  const createContact = useCreateContact();
  const deleteCustomer = useDeleteCustomer();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: '', org_number: '', address: '', postal_code: '', city: '', invoice_email: '', notes: '',
    contact_name: '', contact_role: '', contact_email: '', contact_phone: '',
  });

  const handleCompanyLookup = async () => {
    if (!form.org_number.trim()) return;
    setLookupLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('company-lookup', {
        body: { org_number: form.org_number },
      });
      if (error) throw error;
      if (data?.success && data.data) {
        const c = data.data;
        setForm(f => ({
          ...f,
          company_name: c.company_name || f.company_name,
          org_number: c.org_number || f.org_number,
          address: c.address || f.address,
          postal_code: c.postal_code || f.postal_code,
          city: c.city || f.city,
        }));
        toast.success(`Hittade: ${c.company_name}`);
      } else {
        toast.error(data?.error || 'Kunde inte hitta företaget');
      }
    } catch (err: any) {
      toast.error(err.message || 'Något gick fel vid uppslaget');
    } finally {
      setLookupLoading(false);
    }
  };

  const getPrimaryContact = (customerId: string) => allContacts.find(c => c.customer_id === customerId && c.is_primary);
  const getActiveContractCount = (customerId: string) => allContracts.filter(c => c.customer_id === customerId && c.status === 'Aktivt').length;

  const handleSubmit = async () => {
    if (!form.company_name.trim()) return;
    const customer = await createCustomer.mutateAsync({
      company_name: form.company_name,
      org_number: form.org_number,
      address: form.address,
      postal_code: form.postal_code,
      city: form.city,
      invoice_email: form.invoice_email,
      notes: form.notes,
    });
    if (form.contact_name.trim()) {
      await createContact.mutateAsync({
        customer_id: customer.id,
        name: form.contact_name,
        role: form.contact_role,
        email: form.contact_email,
        phone: form.contact_phone,
        is_primary: true,
      });
    }
    setForm({ company_name: '', org_number: '', address: '', postal_code: '', city: '', invoice_email: '', notes: '', contact_name: '', contact_role: '', contact_email: '', contact_phone: '' });
    setSheetOpen(false);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-48 mt-2" /></div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
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
            <h1 className="font-heading text-2xl font-bold text-foreground">Kunder</h1>
            <p className="mt-1 text-sm text-muted-foreground">{customers.length} registrerade kunder</p>
          </div>
          {canEdit && (
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Lägg till kund
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer, i) => {
            const primaryContact = getPrimaryContact(customer.id);
            const activeCount = getActiveContractCount(customer.id);
            return (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <Link to={`/kunder/${customer.id}`}>
                      <h3 className="font-heading text-lg font-semibold text-card-foreground hover:text-primary">{customer.company_name}</h3>
                      <p className="text-sm text-muted-foreground">{customer.org_number}</p>
                    </Link>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {activeCount} aktiva avtal
                    </span>
                  </div>

                  {primaryContact && (
                    <div className="mt-4 border-t border-border pt-3 space-y-1">
                      <p className="text-sm font-medium text-card-foreground">{primaryContact.name}</p>
                      <p className="text-xs text-muted-foreground">{primaryContact.email}</p>
                      <p className="text-xs text-muted-foreground">{primaryContact.phone}</p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/kunder/${customer.id}`}>
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Visa avtal
                      </Link>
                    </Button>
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Detta tar bort kunden {customer.company_name} och alla tillhörande kontakter och avtal.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCustomer.mutate(customer.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Ta bort
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6">
            <SheetHeader>
              <SheetTitle className="font-heading text-lg sm:text-xl">Lägg till kund</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="company_name">Företagsnamn *</Label>
                <Input id="company_name" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="AB Företaget" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="org_number">Organisationsnummer</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="org_number" value={form.org_number} onChange={e => setForm(f => ({ ...f, org_number: e.target.value }))} placeholder="556xxx-xxxx" />
                  <Button type="button" variant="outline" size="icon" onClick={handleCompanyLookup} disabled={lookupLoading || !form.org_number.trim()} title="Sök företagsinfo">
                    {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ange org.nr och klicka sök för att autofylla</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="postal_code">Postnummer</Label>
                  <Input id="postal_code" value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} placeholder="123 45" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="city">Stad</Label>
                  <Input id="city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Stockholm" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adress</Label>
                <Input id="address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Gatan 1" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="invoice_email">Faktureringsmail</Label>
                <Input id="invoice_email" value={form.invoice_email} onChange={e => setForm(f => ({ ...f, invoice_email: e.target.value }))} type="email" placeholder="faktura@prefabmastarna.se" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="notes">Anteckningar</Label>
                <Textarea id="notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Frivilliga anteckningar..." className="mt-1" />
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Kontaktperson</h3>
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Namn</Label>
                      <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Anna Andersson" className="mt-1" />
                    </div>
                    <div>
                      <Label>Roll</Label>
                      <Input value={form.contact_role} onChange={e => setForm(f => ({ ...f, contact_role: e.target.value }))} placeholder="VD" className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>E-post</Label>
                      <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="name@prefabmastarna.se" className="mt-1" />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="070-123 45 67" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={handleSubmit} disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? 'Sparar...' : 'Spara kund'}
                </Button>
                <Button variant="outline" onClick={() => setSheetOpen(false)}>Avbryt</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
