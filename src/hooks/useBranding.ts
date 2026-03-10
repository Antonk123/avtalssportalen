import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'branding';
const SIDEBAR_LOGO_PATH = 'sidebar-logo';
const LOGIN_LOGO_PATH = 'login-logo';

async function getLogoUrl(path: string): Promise<string | null> {
  // List files that start with the path prefix to find the actual file (with extension)
  const { data: files, error } = await supabase.storage.from(BUCKET).list('', {
    search: path,
  });
  if (error || !files?.length) return null;
  
  const file = files.find(f => f.name.startsWith(path));
  if (!file) return null;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
  // Add cache buster
  return `${data.publicUrl}?t=${file.updated_at || Date.now()}`;
}

export function useSidebarLogo() {
  return useQuery({
    queryKey: ['branding', 'sidebar-logo'],
    queryFn: () => getLogoUrl(SIDEBAR_LOGO_PATH),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLoginLogo() {
  return useQuery({
    queryKey: ['branding', 'login-logo'],
    queryFn: () => getLogoUrl(LOGIN_LOGO_PATH),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();

  const upload = async (file: File, type: 'sidebar' | 'login') => {
    const prefix = type === 'sidebar' ? SIDEBAR_LOGO_PATH : LOGIN_LOGO_PATH;
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${prefix}.${ext}`;

    // Remove existing files with this prefix
    const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: prefix });
    if (existing?.length) {
      const toRemove = existing.filter(f => f.name.startsWith(prefix)).map(f => f.name);
      if (toRemove.length) await supabase.storage.from(BUCKET).remove(toRemove);
    }

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) throw error;

    qc.invalidateQueries({ queryKey: ['branding'] });
  };

  const remove = async (type: 'sidebar' | 'login') => {
    const prefix = type === 'sidebar' ? SIDEBAR_LOGO_PATH : LOGIN_LOGO_PATH;
    const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: prefix });
    if (existing?.length) {
      const toRemove = existing.filter(f => f.name.startsWith(prefix)).map(f => f.name);
      if (toRemove.length) await supabase.storage.from(BUCKET).remove(toRemove);
    }
    qc.invalidateQueries({ queryKey: ['branding'] });
  };

  return { upload, remove };
}
