import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExportContract {
  contract_name: string;
  customer_name?: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  binding_months: number;
  notice_months: number;
  value_sek: number | null;
  auto_renew: boolean;
  status: string;
  internal_responsible: string;
}

function escapeCSV(val: string) {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function downloadFile(content: string, filename: string, type: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const HEADERS = [
  'Avtalsnamn', 'Kund', 'Typ', 'Start', 'Slut',
  'Bindning (mån)', 'Uppsägning (mån)', 'Värde (SEK)',
  'Auto-förnyelse', 'Status', 'Intern ansvarig',
];

function toRow(c: ExportContract): (string | number)[] {
  return [
    c.contract_name,
    c.customer_name || '',
    c.contract_type,
    c.start_date,
    c.end_date,
    c.binding_months,
    c.notice_months,
    c.value_sek !== null ? c.value_sek : '',
    c.auto_renew ? 'Ja' : 'Nej',
    c.status,
    c.internal_responsible,
  ];
}

export function ContractExport({ contracts }: { contracts: ExportContract[] }) {
  const exportCSV = () => {
    const rows = [HEADERS.map(escapeCSV).join(',')];
    contracts.forEach(c => rows.push(toRow(c).map(v => escapeCSV(String(v))).join(',')));
    downloadFile(rows.join('\n'), `avtal-export-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    toast.success(`${contracts.length} avtal exporterade som CSV`);
  };

  const exportExcel = () => {
    const data = [HEADERS, ...contracts.map(c => toRow(c))];
    const ws = XLSX.utils.aoa_to_sheet(data);
    // Auto-size columns
    ws['!cols'] = HEADERS.map((_, i) => ({
      wch: Math.max(
        HEADERS[i].length,
        ...contracts.map(c => String(toRow(c)[i]).length)
      ) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Avtal');
    XLSX.writeFile(wb, `avtal-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`${contracts.length} avtal exporterade som Excel`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportera
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>Exportera som CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel}>Exportera som Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
