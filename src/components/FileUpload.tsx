import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UploadedFile {
  id?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  uploaded_at?: string;
}

interface FileUploadProps {
  contractId: string;
  existingFiles?: UploadedFile[];
  onFileUploaded?: (file: UploadedFile) => void;
  onFileRemoved?: (filePath: string) => void;
}

export function FileUpload({ contractId, existingFiles = [], onFileUploaded, onFileRemoved }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Endast PDF- och DOCX-filer tillåtna');
      return;
    }

    setUploading(true);

    // Check for existing file with same name to determine version
    const baseName = file.name;
    const existingVersions = existingFiles.filter(f => f.file_name === baseName || (f as any).original_name === baseName);
    const version = existingVersions.length + 1;

    const filePath = `${contractId}/${Date.now()}-${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('contract_documents')
        .insert({
          contract_id: contractId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          version,
          original_name: baseName,
        } as never);

      if (dbError) throw dbError;

      toast.success('Dokument uppladdat');
      onFileUploaded?.({ file_name: file.name, file_path: filePath, file_size: file.size });
    } catch (err: any) {
      toast.error(`Uppladdning misslyckades: ${err.message}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (filePath: string) => {
    try {
      await supabase.storage.from('contract-documents').remove([filePath]);
      await supabase.from('contract_documents').delete().eq('file_path', filePath);
      toast.success('Dokument borttaget');
      onFileRemoved?.(filePath);
    } catch (err: any) {
      toast.error(`Kunde inte ta bort: ${err.message}`);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {existingFiles.map(f => (
        <div key={f.file_path} className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">{f.file_name}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {f.file_size && <span>{formatSize(f.file_size)}</span>}
              {(f as any).version && <span>v{(f as any).version}</span>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleRemove(f.file_path)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
        {uploading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Laddar upp...</>
        ) : (
          <><Upload className="h-5 w-5" /> Släpp en fil här eller klicka för att ladda upp (PDF/DOCX)</>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
