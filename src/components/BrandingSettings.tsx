import { useRef, useState } from 'react';
import { Upload, Trash2, Image } from 'lucide-react';
import { useSidebarLogo, useLoginLogo, useUploadLogo } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function LogoSlot({ label, description, logoUrl, isLoading, onUpload, onRemove }: {
  label: string;
  description: string;
  logoUrl: string | null | undefined;
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vänligen välj en bildfil');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Bilden får vara max 2 MB');
      return;
    }
    setUploading(true);
    try {
      await onUpload(file);
      toast.success('Logga uppladdad');
    } catch {
      toast.error('Kunde inte ladda upp loggan');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = async () => {
    try {
      await onRemove();
      toast.success('Logga borttagen');
    } catch {
      toast.error('Kunde inte ta bort loggan');
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 overflow-hidden">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : logoUrl ? (
            <img src={logoUrl} alt={label} className="h-full w-full object-contain p-1" />
          ) : (
            <Image className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {uploading ? 'Laddar upp...' : 'Ladda upp'}
          </Button>
          {logoUrl && (
            <Button variant="outline" size="sm" onClick={handleRemove}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Ta bort
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BrandingSettings({ embedded }: { embedded?: boolean }) {
  const { data: sidebarLogo, isLoading: loadingSidebar } = useSidebarLogo();
  const { data: loginLogo, isLoading: loadingLogin } = useLoginLogo();
  const { upload, remove } = useUploadLogo();

  const content = (
    <div className="space-y-6">
      <LogoSlot
        label="Sidebar-logga"
        description="Visas i sidomenyn bredvid företagsnamnet. Rekommenderad storlek: 36×36 px, transparent PNG."
        logoUrl={sidebarLogo}
        isLoading={loadingSidebar}
        onUpload={(file) => upload(file, 'sidebar')}
        onRemove={() => remove('sidebar')}
      />

      <LogoSlot
        label="Inloggningssidans logga"
        description="Visas på inloggningssidans vänstra panel. Rekommenderad storlek: 64×64 px, transparent PNG."
        logoUrl={loginLogo}
        isLoading={loadingLogin}
        onUpload={(file) => upload(file, 'login')}
        onRemove={() => remove('login')}
      />
    </div>
  );

  if (embedded) return content;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-card-foreground">Branding</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Ladda upp logotyper som visas i sidebaren och på inloggningssidan</p>
      </div>
      {content}
    </div>
  );
}
