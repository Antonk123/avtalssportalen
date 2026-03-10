import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useSupabaseData';
import { MessageSquare, Send, Trash2, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface Comment {
  id: string;
  contract_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string } | null;
}

function renderContentWithMentions(content: string) {
  const parts = content.split(/(@[A-ZÅÄÖÜ\u00C0-\u024F]\w*(?:\s[A-ZÅÄÖÜ\u00C0-\u024F]\w*)*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@') && /^@[A-ZÅÄÖÜ\u00C0-\u024F]/.test(part)) {
      return (
        <span key={i} className="inline-flex items-center rounded-md bg-primary/15 text-primary px-1.5 py-0.5 text-xs font-semibold">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ContractComments({ contractId }: { contractId: string }) {
  const { user, canEdit } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['contract_comments', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_comments' as never)
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data as Comment[]).map(c => c.user_id))];
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profileData?.map(p => [p.id, p.full_name]) ?? []);

      return (data as Comment[]).map(c => ({
        ...c,
        profile: { full_name: profileMap.get(c.user_id) || 'Okänd' },
      }));
    },
    enabled: !!contractId,
  });

  const filteredProfiles = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()) && p.id !== user?.id
  ).slice(0, 5);

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionQuery]);

  const handleContentChange = (value: string) => {
    setContent(value);
    // Check if we're typing a mention
    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    const cursorPos = textareaRef.current?.selectionStart ?? content.length;
    const textBeforeCursor = content.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const before = textBeforeCursor.slice(0, mentionMatch.index);
      const after = content.slice(cursorPos);
      setContent(`${before}@${name} ${after}`);
    }
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredProfiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(i => Math.min(i + 1, filteredProfiles.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredProfiles[mentionIndex].full_name);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const createNotificationsForMentions = async (text: string) => {
    const mentionRegex = /@(\w[\w\s]*?\w)(?=\s|$|[.,!?])/g;
    const mentions = [...text.matchAll(mentionRegex)].map(m => m[1]);
    if (!mentions.length) return;

    const mentionedProfiles = profiles.filter(p =>
      mentions.some(m => p.full_name?.toLowerCase() === m.toLowerCase()) && p.id !== user?.id
    );

    for (const profile of mentionedProfiles) {
      await supabase
        .from('notifications' as never)
        .insert({
          user_id: profile.id,
          from_user_id: user?.id,
          type: 'mention',
          title: `Du nämndes i en kommentar`,
          body: text.length > 100 ? text.slice(0, 100) + '…' : text,
          link: `/avtal/${contractId}`,
        } as never);
    }
  };

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('contract_comments' as never)
        .insert({ contract_id: contractId, user_id: user?.id, content: text } as never);
      if (error) throw error;
      await createNotificationsForMentions(text);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract_comments', contractId] });
      qc.invalidateQueries({ queryKey: ['activity_log', contractId] });
      setContent('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contract_comments' as never)
        .delete()
        .eq('id', id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract_comments', contractId] });
      qc.invalidateQueries({ queryKey: ['activity_log', contractId] });
      toast.success('Kommentar borttagen');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate(content.trim());
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Kommentarer
        {comments.length > 0 && (
          <span className="text-xs font-normal text-muted-foreground">({comments.length})</span>
        )}
      </h2>

      {canEdit && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Skriv en kommentar... Använd @ för att nämna kollegor"
              rows={2}
              className="resize-none pr-12"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || addComment.isPending}
              className="absolute bottom-2 right-2 h-7 w-7 p-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>

            {/* Mention autocomplete dropdown */}
            {showMentions && filteredProfiles.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-72 rounded-lg border-2 border-primary/20 bg-popover shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-border bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <AtSign className="h-3 w-3 text-primary" /> Nämn en kollega
                  </p>
                </div>
                {filteredProfiles.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-l-2 ${
                      idx === mentionIndex ? 'bg-primary/10 text-primary border-l-primary' : 'text-foreground hover:bg-accent/50 border-l-transparent'
                    }`}
                    onMouseDown={e => {
                      e.preventDefault();
                      insertMention(p.full_name);
                    }}
                  >
                    <span className="font-semibold">{p.full_name}</span>
                    {p.department && (
                      <span className="text-xs text-muted-foreground ml-2">· {p.department}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <AtSign className="h-2.5 w-2.5" /> Skriv @ för att nämna och notifiera en kollega
          </p>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga kommentarer ännu.</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.profile?.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.created_at), 'd MMM yyyy HH:mm', { locale: sv })}
                  </span>
                </div>
                {(c.user_id === user?.id) && (
                  <Button variant="ghost" size="sm" onClick={() => deleteComment.mutate(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">
                {renderContentWithMentions(c.content)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
