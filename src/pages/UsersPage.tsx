import { useState, useEffect } from 'react';
import { Users, Plus, Shield, User, Eye, Trash2, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useDepartments } from '@/hooks/useDepartments';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  department_id: string | null;
  role: AppRole;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  user: 'Användare',
  reader: 'Läsare',
};

const roleIcons: Record<AppRole, typeof Shield> = {
  admin: Shield,
  user: User,
  reader: Eye,
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-status-expired/15 text-status-expired',
  user: 'bg-primary/15 text-primary',
  reader: 'bg-muted text-muted-foreground',
};

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const { data: departments = [] } = useDepartments();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('reader');
  const [inviteDepartment, setInviteDepartment] = useState<string>('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with their roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, department_id, created_at');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (profiles && roles) {
        // We can't access auth.users directly, so we'll fetch emails differently
        // For now, we'll show the profile data we have
        const usersWithRoles = profiles.map(profile => {
          const userRole = roles.find(r => r.user_id === profile.id);
          return {
            id: profile.id,
            email: '', // Will be filled by auth metadata if available
            full_name: profile.full_name || 'Namnlös användare',
            department_id: profile.department_id || null,
            role: (userRole?.role || 'reader') as AppRole,
            created_at: profile.created_at,
          };
        });
        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: inviteEmail,
          full_name: inviteName,
          role: inviteRole,
          department_id: inviteDepartment || null,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Okänt fel');

      toast.success(`Användare skapad! Temporärt lösenord: ${data.temp_password}`, {
        duration: 15000,
        description: 'Kopiera lösenordet och dela med användaren.',
      });

      setInviteEmail('');
      setInviteName('');
      setInviteRole('reader');
      setInviteDepartment('');
      setSheetOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Kunde inte bjuda in: ${error.message}`);
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast.error('Kunde inte uppdatera roll');
      return;
    }

    toast.success('Roll uppdaterad');
    fetchUsers();
  };

  const updateUserDepartment = async (userId: string, departmentId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ department_id: departmentId })
      .eq('id', userId);

    if (error) {
      toast.error('Kunde inte uppdatera avdelning');
      return;
    }

    toast.success('Avdelning uppdaterad');
    fetchUsers();
  };

  if (!isAdmin) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Du har inte behörighet att se denna sida.</p>
        </div>
      </PageTransition>
    );
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-64 mt-2" /></div>
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Användare</h1>
            <p className="mt-1 text-sm text-muted-foreground">{users.length} registrerade användare</p>
          </div>
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Bjud in användare
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-6 py-3 font-medium">Namn</th>
                <th className="px-6 py-3 font-medium">Avdelning</th>
                <th className="px-6 py-3 font-medium">Roll</th>
                <th className="px-6 py-3 font-medium">Skapad</th>
                <th className="px-6 py-3 font-medium">Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const RoleIcon = roleIcons[user.role];
                const isCurrentUser = user.id === currentUser?.id;
                return (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-card-foreground">{user.full_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {!isCurrentUser ? (
                        <Select
                          value={user.department_id || undefined}
                          onValueChange={v => updateUserDepartment(user.id, v)}
                        >
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue placeholder="Ingen avdelning" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(d => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {departments.find(d => d.id === user.department_id)?.name || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-3">
                      {!isCurrentUser && (
                        <Select value={user.role} onValueChange={v => updateRole(user.id, v as AppRole)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">Användare</SelectItem>
                            <SelectItem value="reader">Läsare</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground">Du själv</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="font-heading text-sm font-semibold text-card-foreground mb-2">Rollbeskrivningar</h3>
          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-status-expired shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-card-foreground">Admin</p>
                <p className="text-muted-foreground">Full åtkomst. Kan bjuda in användare, ändra roller, ta bort data.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-card-foreground">Användare</p>
                <p className="text-muted-foreground">Kan skapa och redigera kunder, avtal och kontakter.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-card-foreground">Läsare</p>
                <p className="text-muted-foreground">Kan endast se data, inte göra ändringar.</p>
              </div>
            </div>
          </div>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="font-heading">Bjud in användare</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="inviteEmail">E-postadress *</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="name@prefabmastarna.se"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="inviteName">Namn</Label>
                <Input
                  id="inviteName"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Anna Andersson"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Roll</Label>
                <Select value={inviteRole} onValueChange={v => setInviteRole(v as AppRole)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — Full åtkomst</SelectItem>
                    <SelectItem value="user">Användare — Kan redigera</SelectItem>
                    <SelectItem value="reader">Läsare — Endast läsning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="invite_department">Avdelning</Label>
                <Select value={inviteDepartment} onValueChange={setInviteDepartment}>
                  <SelectTrigger className="mt-1" id="invite_department">
                    <SelectValue placeholder="Välj avdelning (valfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Skapar...</>
                  ) : (
                    <><Mail className="mr-2 h-4 w-4" /> Skapa användare</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setSheetOpen(false)}>Avbryt</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ett temporärt lösenord genereras som du kan dela med användaren. De kan sedan logga in och ändra sitt lösenord.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
