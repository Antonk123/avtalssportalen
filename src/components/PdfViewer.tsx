import { useState } from 'react';
import { FileText, Download, ExternalLink, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface DocumentFile {
  id?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  uploaded_at?: string;
}

interface PdfViewerProps {
  documents: DocumentFile[];
  onUploadClick?: () => void;
}

export function PdfViewer({ documents, onUploadClick }: PdfViewerProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(
    documents.length === 1 ? documents[0].file_path : null
  );

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 bg-primary/[0.03] p-8 shadow-sm">
        <div className="flex flex-col items-center py-6">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <FileText className="h-12 w-12 text-primary/30" />
          </motion.div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Inga dokument uppladdade ännu</p>
          <p className="mt-1 text-xs text-muted-foreground/60">PDF och DOCX stöds</p>
          {onUploadClick && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={onUploadClick}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Ladda upp dokument
            </Button>
          )}
        </div>
      </div>
    );
  }

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('contract-documents').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-card-foreground">
          Dokument ({documents.length})
        </h2>
        {onUploadClick && (
          <Button variant="ghost" size="sm" onClick={onUploadClick}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Ladda upp fler
          </Button>
        )}
      </div>

      {documents.map(doc => {
        const url = getPublicUrl(doc.file_path);
        const isPdf = doc.file_name.toLowerCase().endsWith('.pdf');
        const isExpanded = expandedFile === doc.file_path;

        return (
          <div key={doc.file_path} className="border-b border-border last:border-0">
            <div className="flex items-center gap-3 px-6 py-3">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="flex-1 text-sm font-medium text-card-foreground truncate">{doc.file_name}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <a href={url} download={doc.file_name}>
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                {isPdf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedFile(isExpanded ? null : doc.file_path)}
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>

            {isPdf && isExpanded && (
              <div className="px-6 pb-4">
                <iframe
                  src={`${url}#toolbar=1&navpanes=0`}
                  className="w-full rounded-lg border border-border"
                  style={{ height: '600px' }}
                  title={doc.file_name}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
