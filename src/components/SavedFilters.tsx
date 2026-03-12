import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, Plus, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

export interface FilterState {
  searchQuery: string;
  statusFilter: string;
  customerFilter: string;
  typeFilter: string;
  departmentFilter: string;
  selectedTags: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  filters: FilterState;
  is_shared: boolean;
  created_at: string;
}

interface SavedFiltersProps {
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
}

export function SavedFilters({ currentFilters, onApply }: SavedFiltersProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: filters = [] } = useQuery({
    queryKey: ['saved_filters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_filters' as never)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as SavedFilter[];
    },
  });

  const saveFilter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('saved_filters' as never)
        .insert({
          user_id: user?.id,
          name,
          filters: currentFilters as never,
          is_shared: isShared,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved_filters'] });
      setName('');
      setIsShared(false);
      toast.success('Filtervy sparad');
    },
    onError: () => toast.error('Kunde inte spara filtervyn'),
  });

  const deleteFilter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_filters' as never)
        .delete()
        .eq('id', id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved_filters'] });
      toast.success('Filtervy borttagen');
    },
  });

  const hasActiveFilters = currentFilters.searchQuery ||
    currentFilters.statusFilter !== 'all' ||
    currentFilters.customerFilter !== 'all' ||
    currentFilters.typeFilter !== 'all' ||
    currentFilters.departmentFilter !== 'all' ||
    currentFilters.selectedTags.length > 0 ||
    currentFilters.dateFrom ||
    currentFilters.dateTo;

  const handleSave = () => {
    if (!name.trim()) return;
    saveFilter.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Sparade vyer
          {filters.length > 0 && (
            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-medium">
              {filters.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Saved filters list */}
        {filters.length > 0 && (
          <div className="max-h-48 overflow-y-auto border-b border-border">
            {filters.map(f => (
              <div
                key={f.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 cursor-pointer group transition-colors"
                onClick={() => {
                  onApply(f.filters);
                  setOpen(false);
                }}
              >
                <Bookmark className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  {f.is_shared && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Share2 className="h-2.5 w-2.5" /> Delad
                    </p>
                  )}
                </div>
                {f.user_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={e => {
                      e.stopPropagation();
                      deleteFilter.mutate(f.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Save current filter */}
        <div className="p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Spara nuvarande filter</p>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="T.ex. Mina avtal, Utgående Q2..."
            className="h-8 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="shared"
                checked={isShared}
                onCheckedChange={setIsShared}
                className="scale-75"
              />
              <Label htmlFor="shared" className="text-xs text-muted-foreground cursor-pointer">
                Dela med kollegor
              </Label>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || !hasActiveFilters || saveFilter.isPending}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Spara
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
