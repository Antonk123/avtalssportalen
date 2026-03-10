import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useContractTypes, useCreateContractType, useDeleteContractType } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { Lock, Plus, X, Tag, User, Mail, Image, ChevronDown } from 'lucide-react';
import { BrandingSettings } from '@/components/BrandingSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

const defaultSettings = {
  id: '',
  sender_name: 'Avtalsportalen',
  sender_email: 'paminnelser@avtalsportalen.se',
  default_reminder_days: 30,
  email_template: `Hej {{kontaktperson}},

Detta är en påminnelse om att avtalet "{{avtalsnamn}}" med {{kundnamn}} löper ut den {{slutdatum}}.

Sista dag för uppsägning är {{uppsägningsdatum}}.

Vänligen vidta åtgärd för att säkerställa att avtalet hanteras i tid.

{{avtalslänk}}

Med vänliga hälsningar,
Avtalsportalen`,
};

function SettingsSection({
  icon,
  title,
  description,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-accent/30 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-base font-semibold text-card-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-6 py-5 space-y-5">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function SettingsPage() {
  const { data: dbSettings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (dbSettings) {
      setSettings({
        id: dbSettings.id,
        sender_name: dbSettings.sender_name,
        sender_email: dbSettings.sender_email,
        default_reminder_days: dbSettings.default_reminder_days,
        email_template: dbSettings.email_template || defaultSettings.email_template,
      });
    }
  }, [dbSettings]);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name || '');
      setProfileDepartment(profile.department || '');
    }
  }, [profile]);

  const previewHtml = settings.email_template
    .replace('{{kontaktperson}}', 'Erik Nordström')
    .replace('{{avtalsnamn}}', 'IT-support och drift')
    .replace('{{kundnamn}}', 'Nordström & Partners AB')
    .replace('{{slutdatum}}', '2026-04-30')
    .replace('{{uppsägningsdatum}}', '2026-01-30')
    .replace('{{avtalslänk}}', 'Öppna avtalet: https://avtalssportalen.lovable.app/avtal/...');

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profileName, department: profileDepartment, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSavingProfile(false);
    if (error) {
      toast.error('Kunde inte spara profil');
    } else {
      toast.success('Profil sparad');
      window.location.reload();
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Lösenorden matchar inte');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error('Kunde inte byta lösenord: ' + error.message);
    } else {
      toast.success('Lösenord uppdaterat');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSave = () => {
    updateSettings.mutate(settings);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4 max-w-2xl">
          <div><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-64 mt-2" /></div>
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4 max-w-2xl">
        <div className="mb-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">Inställningar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Konfigurera din profil, e-postpåminnelser och systeminställningar</p>
        </div>

        {/* Profile */}
        <SettingsSection
          icon={<User className="h-4 w-4 text-muted-foreground" />}
          title="Min profil"
          description="Namn, avdelning och e-post"
          defaultOpen
        >
          <div>
            <Label htmlFor="profile_name">Namn</Label>
            <Input id="profile_name" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Förnamn Efternamn" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="profile_department">Avdelning</Label>
            <Input id="profile_department" value={profileDepartment} onChange={e => setProfileDepartment(e.target.value)} placeholder="T.ex. IT, Ekonomi" className="mt-1" />
          </div>
          <div>
            <Label>E-post</Label>
            <Input value={user?.email || ''} disabled className="mt-1" />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? 'Sparar...' : 'Spara profil'}
          </Button>
        </SettingsSection>

        {/* Password */}
        <SettingsSection
          icon={<Lock className="h-4 w-4 text-muted-foreground" />}
          title="Lösenord"
          description="Byt ditt lösenord"
        >
          <div>
            <Label htmlFor="new_password">Nytt lösenord</Label>
            <Input id="new_password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minst 6 tecken" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="confirm_password">Bekräfta nytt lösenord</Label>
            <Input id="confirm_password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Upprepa lösenord" className="mt-1" />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline">
            {savingPassword ? 'Sparar...' : 'Byt lösenord'}
          </Button>
        </SettingsSection>

        {/* Contract Types */}
        <SettingsSection
          icon={<Tag className="h-4 w-4 text-muted-foreground" />}
          title="Avtalstyper"
          description="Hantera vilka avtalstyper som finns i systemet"
        >
          <ContractTypesContent />
        </SettingsSection>

        {/* Branding */}
        <SettingsSection
          icon={<Image className="h-4 w-4 text-muted-foreground" />}
          title="Branding"
          description="Logotyper för sidebaren och inloggningssidan"
        >
          <BrandingSettings embedded />
        </SettingsSection>

        {/* Email settings */}
        <SettingsSection
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
          title="E-postinställningar"
          description="Avsändare, påminnelsedagar och e-postmall"
        >
          <div>
            <Label htmlFor="sender_name">Avsändarnamn för mail</Label>
            <Input id="sender_name" value={settings.sender_name} onChange={e => setSettings(s => ({ ...s, sender_name: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="sender_email">Avsändaradress</Label>
            <Input id="sender_email" type="email" value={settings.sender_email} onChange={e => setSettings(s => ({ ...s, sender_email: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="default_reminder_days">Standard påminnelsedagar</Label>
            <Input id="default_reminder_days" type="number" value={settings.default_reminder_days} onChange={e => setSettings(s => ({ ...s, default_reminder_days: Number(e.target.value) }))} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              Antal dagar innan uppsägningsfristen som en påminnelse skickas (om ej angivet på avtalet)
            </p>
          </div>
          <div>
            <Label htmlFor="email_template">E-postmall för påminnelser</Label>
            <Textarea id="email_template" rows={10} value={settings.email_template} onChange={e => setSettings(s => ({ ...s, email_template: e.target.value }))} className="mt-1 font-mono text-sm" />
            <p className="mt-1 text-xs text-muted-foreground">
              Variabler: {'{{avtalsnamn}}'}, {'{{kundnamn}}'}, {'{{slutdatum}}'}, {'{{uppsägningsdatum}}'}, {'{{kontaktperson}}'}, {'{{avtalslänk}}'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Sparar...' : 'Spara inställningar'}
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? 'Dölj förhandsgranskning' : 'Förhandsgranska mail'}
            </Button>
          </div>
          {showPreview && (
            <div className="rounded-lg border border-border bg-background p-6 text-sm whitespace-pre-wrap text-foreground">
              {previewHtml}
            </div>
          )}
        </SettingsSection>
      </div>
    </PageTransition>
  );
}

function ContractTypesContent() {
  const { data: contractTypes = [] } = useContractTypes();
  const createType = useCreateContractType();
  const deleteType = useDeleteContractType();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (contractTypes.some(ct => ct.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Avtalstypen finns redan');
      return;
    }
    createType.mutate(name);
    setNewName('');
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {contractTypes.map(ct => (
          <div key={ct.id} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm">
            <span className="text-card-foreground">{ct.name}</span>
            <button
              onClick={() => deleteType.mutate(ct.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Ta bort"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Ny avtalstyp..."
          className="max-w-xs"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!newName.trim() || createType.isPending} size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Lägg till
        </Button>
      </div>
    </>
  );
}
