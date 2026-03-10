import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Plus, Mail, Phone } from 'lucide-react';
import { useCustomer, useUpdateCustomer, useContacts, useContracts, useCreateContact, useUpdateContact, useDeleteContact, useDeleteCustomer } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/PageTransition';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, canDelete } = useAuth();
  const { data: customer, isLoading: loadingCustomer } = useCustomer(id || '');
  const { data: contacts = [], isLoading: loadingContacts } = useContacts(id);
  const { data: contracts = [], isLoading: loadingContracts } = useContracts(id);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', role: '', email: '', phone: '', is_primary: false });
  const [editForm, setEditForm] = useState({
    company_name: '', org_number: '', address: '', postal_code: '', city: '', invoice_email: '', notes: '',
  });

  useEffect(() => {
    if (customer) {
      setEditForm({
        company_name: customer.company_name,
        org_number: customer.org_number,
        address: customer.address,
        postal_code: customer.postal_code,
        city: customer.city,
        invoice_email: customer.invoice_email,
        notes: customer.notes,
      });
    }
  }, [customer]);

  const handleSaveContact = async () => {
    if (!contactForm.name.trim() || !id) return;
    if (editingContact) {
      await updateContact.mutateAsync({ id: editingContact, ...contactForm });
    } else {
      await createContact.mutateAsync({ ...contactForm, customer_id: id });
    }
    setContactForm({ name: '', role: '', email: '', phone: '', is_primary: false });
    setEditingContact(null);
    setContactSheetOpen(false);
  };

  const openEditContact = (contact: typeof contacts[0]) => {
    setEditingContact(contact.id);
    setContactForm({
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      is_primary: contact.is_primary,
    });
    setContactSheetOpen(true);
  };

  const openAddContact = () => {
    setEditingContact(null);
    setContactForm({ name: '', role: '', email: '', phone: '', is_primary: false });
    setContactSheetOpen(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editForm.company_name.trim() || !id) return;
    await updateCustomer.mutateAsync({ id, ...editForm });
    setEditSheetOpen(false);
  };

  const handleDeleteCustomer = async () => {
    if (!id) return;
    await deleteCustomer.mutateAsync(id);
    navigate('/kunder');
  };

  if (loadingCustomer) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl lg:col-span-2" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!customer) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Kunden hittades inte.</p>
          <Button variant="outline" asChild className="mt-4">
            <Link to="/kunder">Tillbaka till kunder</Link>
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/kunder"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">{customer.company_name}</h1>
              <p className="text-sm text-muted-foreground">{customer.org_number}</p>
            </div>
          </div>
          <div className="flex gap-2 pl-10 sm:pl-0">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setEditSheetOpen(true)} className="h-9 sm:h-8">
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Redigera
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 h-9 sm:h-8">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ta bort</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ta bort kund?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Detta tar bort {customer.company_name} och alla tillhörande kontakter och avtal permanent.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Ta bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-heading text-base sm:text-lg font-semibold text-card-foreground">Företagsinformation</h2>
            </div>
            <dl className="space-y-2 sm:space-y-3 text-sm">
              <div><dt className="text-muted-foreground text-xs sm:text-sm">Adress</dt><dd className="font-medium text-card-foreground">{customer.address || '—'}{customer.address && `, ${customer.postal_code} ${customer.city}`}</dd></div>
              <div><dt className="text-muted-foreground text-xs sm:text-sm">Faktureringsmail</dt><dd className="font-medium text-card-foreground break-all">{customer.invoice_email || '—'}</dd></div>
              {customer.notes && <div><dt className="text-muted-foreground text-xs sm:text-sm">Anteckningar</dt><dd className="font-medium text-card-foreground whitespace-pre-wrap">{customer.notes}</dd></div>}
            </dl>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base sm:text-lg font-semibold text-foreground">Kontaktpersoner</h2>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={openAddContact} className="h-9 sm:h-8">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />Lägg till
                </Button>
              )}
            </div>
            {loadingContacts ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1,2].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
              </div>
            ) : contacts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-6 sm:p-8 text-center text-muted-foreground">
                <p className="text-sm">Inga kontaktpersoner registrerade.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {contacts.map(contact => (
                  <div key={contact.id} className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-card-foreground text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => openEditContact(contact)} className="h-8 w-8 p-0">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ta bort kontakt?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Är du säker på att du vill ta bort {contact.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteContact.mutate(contact.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Ta bort
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {contact.email && <p className="flex items-center gap-1.5 break-all"><Mail className="h-3 w-3 shrink-0" />{contact.email}</p>}
                      {contact.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{contact.phone}</p>}
                    </div>
                    {contact.is_primary && (
                      <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Primär kontakt
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="font-heading text-base sm:text-lg font-semibold text-card-foreground">Avtal</h2>
            {canEdit && (
              <Button size="sm" asChild className="h-8 sm:h-9">
                <Link to="/avtal"><Plus className="mr-1.5 h-3.5 w-3.5" />Nytt avtal</Link>
              </Button>
            )}
          </div>
          {loadingContracts ? (
            <div className="p-4 sm:p-6"><Skeleton className="h-24" /></div>
          ) : contracts.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-muted-foreground">
              <p className="text-sm">Inga avtal registrerade för denna kund.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium">Avtalsnamn</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium hidden sm:table-cell">Typ</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium hidden md:table-cell">Startdatum</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium">Slutdatum</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium">Status</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(contract => (
                    <tr key={contract.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/avtal/${contract.id}`)}>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 font-medium text-card-foreground">{contract.contract_name}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-muted-foreground hidden sm:table-cell">{contract.contract_type}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-muted-foreground hidden md:table-cell">{contract.start_date}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-muted-foreground">{contract.end_date}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3"><StatusBadge status={contract.status} /></td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3" onClick={e => e.stopPropagation()}>
                        <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                          <Link to={`/avtal/${contract.id}`}>Visa</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit customer sheet */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6">
            <SheetHeader>
              <SheetTitle className="font-heading">Redigera kund</SheetTitle>
            </SheetHeader>
            <div className="mt-4 sm:mt-6 space-y-4">
              <div>
                <Label htmlFor="edit_company_name">Företagsnamn *</Label>
                <Input id="edit_company_name" value={editForm.company_name} onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit_org_number">Organisationsnummer</Label>
                <Input id="edit_org_number" value={editForm.org_number} onChange={e => setEditForm(f => ({ ...f, org_number: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit_address">Adress</Label>
                <Input id="edit_address" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_postal_code">Postnummer</Label>
                  <Input id="edit_postal_code" value={editForm.postal_code} onChange={e => setEditForm(f => ({ ...f, postal_code: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="edit_city">Stad</Label>
                  <Input id="edit_city" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_invoice_email">Faktureringsmail</Label>
                <Input id="edit_invoice_email" type="email" value={editForm.invoice_email} onChange={e => setEditForm(f => ({ ...f, invoice_email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit_notes">Anteckningar</Label>
                <Textarea id="edit_notes" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" rows={3} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={handleUpdateCustomer} disabled={updateCustomer.isPending}>
                  {updateCustomer.isPending ? 'Sparar...' : 'Spara ändringar'}
                </Button>
                <Button variant="outline" onClick={() => setEditSheetOpen(false)}>Avbryt</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Add contact sheet */}
        <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-4 sm:p-6">
            <SheetHeader>
              <SheetTitle className="font-heading">{editingContact ? 'Redigera kontaktperson' : 'Lägg till kontaktperson'}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 sm:mt-6 space-y-4">
              <div><Label>Namn *</Label><Input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Roll</Label><Input value={contactForm.role} onChange={e => setContactForm(f => ({ ...f, role: e.target.value }))} className="mt-1" /></div>
              <div><Label>E-post</Label><Input type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className="mt-1" /></div>
              <div><Label>Telefon</Label><Input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" /></div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <Label>Primär kontakt</Label>
                <Switch checked={contactForm.is_primary} onCheckedChange={c => setContactForm(f => ({ ...f, is_primary: c }))} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={handleSaveContact} disabled={createContact.isPending || updateContact.isPending}>
                  {(createContact.isPending || updateContact.isPending) ? 'Sparar...' : editingContact ? 'Spara ändringar' : 'Spara'}
                </Button>
                <Button variant="outline" onClick={() => setContactSheetOpen(false)}>Avbryt</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
