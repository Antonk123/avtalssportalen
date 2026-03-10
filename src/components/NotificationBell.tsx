import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface Notification {
  id: string;
  user_id: string;
  from_user_id: string | null;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
  from_profile?: { full_name: string } | null;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications' as never)
        .select('*')
        .eq('user_id', user?.id as never)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      const fromIds = [...new Set((data as unknown as Notification[]).filter(n => n.from_user_id).map(n => n.from_user_id!))];
      let profileMap = new Map<string, string>();
      if (fromIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', fromIds);
        profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) ?? []);
      }

      return (data as unknown as Notification[]).map(n => ({
        ...n,
        from_profile: n.from_user_id ? { full_name: profileMap.get(n.from_user_id) || 'Okänd' } : null,
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('notifications' as never)
        .update({ read: true } as never)
        .eq('id', id as never);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from('notifications' as never)
        .update({ read: true } as never)
        .eq('user_id', user?.id as never)
        .eq('read', false as never);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notifikationer</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Markera alla
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Inga notifikationer</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50 ${!n.read ? 'bg-primary/5' : ''}`}
                onClick={() => handleClick(n)}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {n.from_profile?.full_name && `${n.from_profile.full_name} · `}
                    {format(new Date(n.created_at), 'd MMM HH:mm', { locale: sv })}
                  </p>
                </div>
                {!n.read && (
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
