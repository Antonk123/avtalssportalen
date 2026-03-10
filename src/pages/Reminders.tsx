import { useState } from 'react';
import { differenceInDays, subMonths } from 'date-fns';
import { Send, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useContracts, useCustomers, useContacts, useReminderLogs, useSendReminder, useClearReminderLogs } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
export default function Reminders() {
  const { data: contracts = [], isLoading: loadingContracts } = useContracts();
  const { data: customers = [] } = useCustomers();
  const { data: allContacts = [] } = useContacts();
  const { data: reminderLogs = [], isLoading: loadingLogs } = useReminderLogs();
  const sendReminder = useSendReminder();
  const clearLogs = useClearReminderLogs();
  const today = new Date();

  const getCustomerById = (id: string) => customers.find(c => c.id === id);
  const getContactById = (id: string) => allContacts.find(c => c.id === id);

  const upcomingReminders = contracts
    .filter(c => c.status === 'Aktivt')
    .map(c => {
      const endDate = new Date(c.end_date);
      const lastNoticeDate = subMonths(endDate, c.notice_months);
      const daysUntilNotice = differenceInDays(lastNoticeDate, today);
      return { contract: c, daysUntilNotice, lastNoticeDate, endDate };
    })
    .filter(r => r.daysUntilNotice <= r.contract.reminder_days && r.daysUntilNotice >= 0)
    .sort((a, b) => a.daysUntilNotice - b.daysUntilNotice);

  if (loadingContracts || loadingLogs) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-64 mt-2" /></div>
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Påminnelser</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hantera avtalspåminnelser och e-postutskick</p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Kommande påminnelser ({upcomingReminders.length})</TabsTrigger>
            <TabsTrigger value="sent">Skickade påminnelser</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {upcomingReminders.length === 0 ? (
                <div className="px-6 py-16 text-center text-muted-foreground">
                  <p className="font-medium">Inga aktiva påminnelser just nu</p>
                  <p className="mt-1 text-sm">Påminnelser visas när ett avtal närmar sig sin uppsägningsfrist.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-6 py-3 font-medium">Kund</th>
                      <th className="px-6 py-3 font-medium">Avtal</th>
                      <th className="px-6 py-3 font-medium">Slutdatum</th>
                      <th className="px-6 py-3 font-medium">Uppsägningsdatum</th>
                      <th className="px-6 py-3 font-medium">Mottagare</th>
                      <th className="px-6 py-3 font-medium">Åtgärd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingReminders.map(({ contract, lastNoticeDate }) => {
                      const customer = getCustomerById(contract.customer_id);
                      const contact = contract.responsible_contact_id ? getContactById(contract.responsible_contact_id) : null;
                      return (
                        <tr key={contract.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                          <td className="px-6 py-3 font-medium text-card-foreground">{customer?.company_name}</td>
                          <td className="px-6 py-3 text-card-foreground">{contract.contract_name}</td>
                          <td className="px-6 py-3 text-muted-foreground">{contract.end_date}</td>
                          <td className="px-6 py-3 text-muted-foreground">{lastNoticeDate.toISOString().split('T')[0]}</td>
                          <td className="px-6 py-3 text-muted-foreground">{contact?.email || '—'}</td>
                          <td className="px-6 py-3">
                            <Button size="sm" onClick={() => sendReminder.mutate(contract.id)} disabled={sendReminder.isPending}>
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                              {sendReminder.isPending ? 'Skickar...' : 'Skicka påminnelse'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent">
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {reminderLogs.length === 0 ? (
                <div className="px-6 py-16 text-center text-muted-foreground">
                  <p className="font-medium">Inga påminnelser har skickats ännu</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                    <p className="text-sm text-muted-foreground">{reminderLogs.length} påminnelser i loggen</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Rensa alla
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Rensa påminnelseloggen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Detta tar bort alla skickade påminnelser från loggen. Åtgärden kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => clearLogs.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Rensa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-6 py-3 font-medium">Datum skickat</th>
                      <th className="px-6 py-3 font-medium">Kund</th>
                      <th className="px-6 py-3 font-medium">Avtal</th>
                      <th className="px-6 py-3 font-medium">Skickat till</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminderLogs.map(log => {
                      const contract = contracts.find(c => c.id === log.contract_id);
                      const customer = contract ? getCustomerById(contract.customer_id) : null;
                      return (
                        <tr key={log.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                          <td className="px-6 py-3 text-muted-foreground">{new Date(log.sent_at).toLocaleDateString('sv-SE')}</td>
                          <td className="px-6 py-3 font-medium text-card-foreground">{customer?.company_name}</td>
                          <td className="px-6 py-3 text-card-foreground">{contract?.contract_name}</td>
                          <td className="px-6 py-3 text-muted-foreground">{log.sent_to_email}</td>
                          <td className="px-6 py-3">
                            {log.success ? (
                              <span className="inline-flex items-center gap-1 text-status-active text-xs font-medium">
                                <CheckCircle className="h-3.5 w-3.5" /> Levererat
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-status-expired text-xs font-medium">
                                <XCircle className="h-3.5 w-3.5" /> Misslyckades
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
