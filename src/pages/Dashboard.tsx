import { useState, useMemo } from 'react';
import { differenceInDays, format, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { FileText, AlertTriangle, Users, BarChart3, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useContracts, useCustomers, useContractTypes } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge, DaysRemainingBadge } from '@/components/StatusBadge';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// CONTRACT_TYPES is now dynamic

export default function Dashboard() {
  const { data: contracts = [], isLoading: loadingContracts } = useContracts();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: contractTypes = [] } = useContractTypes();
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0];
  const today = new Date();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('Alla');

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (typeFilter !== 'Alla' && c.contract_type !== typeFilter) return false;
      if (dateFrom && c.end_date < dateFrom) return false;
      if (dateTo && c.start_date > dateTo) return false;
      return true;
    });
  }, [contracts, dateFrom, dateTo, typeFilter]);

  const getCustomerById = (id: string) => customers.find(c => c.id === id);

  // --- Report: value per customer ---
  const valueByCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    filteredContracts.forEach(c => {
      if (c.value_sek) {
        const name = getCustomerById(c.customer_id)?.company_name || 'Okänd';
        map[name] = (map[name] || 0) + c.value_sek;
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredContracts, customers]);

  // --- Report: value per category ---
  const valueByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredContracts.forEach(c => {
      if (c.value_sek) {
        map[c.contract_type] = (map[c.contract_type] || 0) + c.value_sek;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredContracts]);

  // --- Report: expiring per month (next 12 months) ---
  const expiringByMonth = useMemo(() => {
    const months: { name: string; count: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(addMonths(today, i));
      const monthEnd = endOfMonth(addMonths(today, i));
      const count = filteredContracts.filter(c =>
        c.status === 'Aktivt' && isWithinInterval(parseISO(c.end_date), { start: monthStart, end: monthEnd })
      ).length;
      months.push({ name: format(monthStart, 'MMM yy', { locale: sv }), count });
    }
    return months;
  }, [filteredContracts]);

  if (loadingContracts || loadingCustomers) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  const totalContracts = filteredContracts.length;
  const activeContracts = filteredContracts.filter(c => c.status === 'Aktivt');
  const expiringSoon = activeContracts.filter(c => {
    const days = differenceInDays(new Date(c.end_date), today);
    return days >= 0 && days <= 90;
  }).sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());

  const customerIdsWithActive = new Set(activeContracts.map(c => c.customer_id));
  const customersWithoutActive = customers.filter(c => !customerIdsWithActive.has(c.id)).length;

  const statusCounts = {
    Aktivt: filteredContracts.filter(c => c.status === 'Aktivt').length,
    Granskning: filteredContracts.filter(c => c.status === 'Granskning').length,
    Utgånget: filteredContracts.filter(c => c.status === 'Utgånget').length,
    Uppsagt: filteredContracts.filter(c => c.status === 'Uppsagt').length,
    Utkast: filteredContracts.filter(c => c.status === 'Utkast').length,
  };
  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const pieColors: Record<string, string> = {
    Aktivt: 'hsl(var(--status-active))',
    Granskning: 'hsl(var(--status-review))',
    Utgånget: 'hsl(var(--status-expired))',
    Uppsagt: 'hsl(var(--status-terminated))',
    Utkast: 'hsl(var(--status-draft))',
  };

  const hasFilters = dateFrom || dateTo || typeFilter !== 'Alla';

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {firstName ? `Välkommen tillbaka, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Översikt av alla avtal och kunder</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm">
          <Filter className="hidden sm:block h-4 w-4 text-muted-foreground mt-1" />
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Från</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1 w-full h-9 sm:h-8 text-xs" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Till</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1 w-full h-9 sm:h-8 text-xs" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Avtalstyp</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="mt-1 w-full h-9 sm:h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem key="Alla" value="Alla">Alla</SelectItem>
                {contractTypes.map(ct => <SelectItem key={ct.id} value={ct.name}>{ct.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="text-xs h-9 sm:h-8 w-full sm:w-auto" onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('Alla'); }}>
              Rensa filter
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [perspective:1000px]">
          <KpiCard title="Totalt antal avtal" value={totalContracts} icon={FileText} index={0} />
          <KpiCard title="Aktiva avtal" value={activeContracts.length} icon={BarChart3} variant="active" index={1} />
          <KpiCard title="Löper ut inom 90 dagar" value={expiringSoon.length} icon={AlertTriangle} variant="warning" index={2} />
          <KpiCard title="Kunder utan aktiva avtal" value={customersWithoutActive} icon={Users} variant="muted" index={3} />
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="font-heading text-base sm:text-lg font-semibold text-card-foreground">Avtal som snart löper ut</h2>
            </div>
            {expiringSoon.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-muted-foreground">
                <AlertTriangle className="mx-auto mb-3 h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground/40" />
                <p className="font-medium text-sm sm:text-base">Inga avtal löper ut inom 90 dagar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium">Kund</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium hidden sm:table-cell">Avtalsnamn</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium">Slutdatum</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium hidden md:table-cell">Uppsägningstid</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium">Dagar kvar</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium">Åtgärd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.map(contract => {
                      const customer = getCustomerById(contract.customer_id);
                      const daysLeft = differenceInDays(new Date(contract.end_date), today);
                      return (
                        <tr key={contract.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 sm:py-3 font-medium text-card-foreground">{customer?.company_name}</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-3 text-card-foreground hidden sm:table-cell">{contract.contract_name}</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-3 text-muted-foreground text-xs sm:text-sm">{contract.end_date}</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-3 text-muted-foreground hidden md:table-cell">{contract.notice_months} mån</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-3"><DaysRemainingBadge days={daysLeft} /></td>
                          <td className="px-3 sm:px-6 py-2 sm:py-3">
                            <Button variant="outline" size="sm" asChild className="h-7 sm:h-8 text-xs">
                              <Link to={`/avtal/${contract.id}`}>Visa</Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="font-heading text-base sm:text-lg font-semibold text-card-foreground">Avtalsstatus</h2>
            </div>
            <div className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => <Cell key={entry.name} fill={pieColors[entry.name]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3 justify-center">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full" style={{ backgroundColor: pieColors[entry.name] }} />
                    <span className="text-muted-foreground">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reports section */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Value per customer */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="font-heading text-sm sm:text-base font-semibold text-card-foreground">Avtalsvärde per kund (SEK)</h2>
            </div>
            <div className="p-3 sm:p-4">
              {valueByCustomer.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Inga avtal med värde</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={valueByCustomer} layout="vertical" margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString('sv-SE')} kr`, 'Värde']} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Value per category */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="font-heading text-sm sm:text-base font-semibold text-card-foreground">Avtalsvärde per kategori (SEK)</h2>
            </div>
            <div className="p-3 sm:p-4">
              {valueByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Inga avtal med värde</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={valueByCategory} margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString('sv-SE')} kr`, 'Värde']} />
                    <Bar dataKey="value" fill="hsl(var(--primary-vibrant))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Expiring contracts per month */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="font-heading text-sm sm:text-base font-semibold text-card-foreground">Avtal som löper ut per månad (kommande 12 mån)</h2>
            </div>
            <div className="p-3 sm:p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={expiringByMonth} margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [v, 'Avtal']} />
                  <Bar dataKey="count" name="Utgående avtal" fill="hsl(var(--accent-copper))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
