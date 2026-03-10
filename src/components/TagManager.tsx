import { useState, useEffect } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  contractId: string;
  readOnly?: boolean;
}

export function TagManager({ contractId, readOnly = false }: TagManagerProps) {
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [assignedTags, setAssignedTags] = useState<TagData[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [contractId]);

  const fetchTags = async () => {
    const [{ data: all }, { data: assigned }] = await Promise.all([
      supabase.from('tags').select('*').order('name'),
      supabase.from('contract_tags').select('tag_id, tags(*)').eq('contract_id', contractId),
    ]);
    setAllTags((all as TagData[]) || []);
    setAssignedTags(
      (assigned || []).map((r: any) => r.tags).filter(Boolean)
    );
  };

  const addTag = async (tag: TagData) => {
    if (assignedTags.some(t => t.id === tag.id)) return;
    const { error } = await supabase.from('contract_tags').insert({ contract_id: contractId, tag_id: tag.id });
    if (error) { toast.error('Kunde inte lägga till tagg'); return; }
    setAssignedTags(prev => [...prev, tag]);
  };

  const removeTag = async (tagId: string) => {
    const { error } = await supabase.from('contract_tags').delete().eq('contract_id', contractId).eq('tag_id', tagId);
    if (error) { toast.error('Kunde inte ta bort tagg'); return; }
    setAssignedTags(prev => prev.filter(t => t.id !== tagId));
  };

  const createAndAdd = async () => {
    if (!newTagName.trim()) return;
    const colors = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#E11D48', '#0891B2', '#4F46E5'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const { data, error } = await supabase.from('tags').insert({ name: newTagName.trim(), color }).select().single();
    if (error) { toast.error('Taggen finns redan eller kunde inte skapas'); return; }
    const tag = data as TagData;
    setAllTags(prev => [...prev, tag]);
    await addTag(tag);
    setNewTagName('');
  };

  const availableTags = allTags.filter(t => !assignedTags.some(a => a.id === t.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assignedTags.map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
          {!readOnly && (
            <button onClick={() => removeTag(tag.id)} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {!readOnly && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Tagg
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-2">
              {availableTags.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => { addTag(tag); setOpen(false); }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                    >
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5 border-t border-border pt-2">
                <Input
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Ny tagg..."
                  className="h-7 text-xs"
                  onKeyDown={e => e.key === 'Enter' && createAndAdd()}
                />
                <Button size="sm" className="h-7 px-2 text-xs" onClick={createAndAdd} disabled={!newTagName.trim()}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {assignedTags.length === 0 && readOnly && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Tag className="h-3 w-3" /> Inga taggar
        </span>
      )}
    </div>
  );
}
