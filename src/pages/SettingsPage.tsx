import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useContractTypes, useCreateContractType, useDeleteContractType, useUpdateContractType, useContractTypeUsageCount } from '@/hooks/useSupabaseData';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, useTagUsageCount, Tag as TagType } from '@/hooks/useTags';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useDepartmentUsageCount, Department } from '@/hooks/useDepartments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { Lock, Plus, X, Tag, User, Mail, Image, ChevronDown, Pencil, FileText, Building2 } from 'lucide-react';
import { BrandingSettings } from '@/components/BrandingSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
  const { data: departments = [] } = useDepartments();
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
      setProfileDepartment(profile.department_id || '');
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
      .update({ full_name: profileName, department_id: profileDepartment, updated_at: new Date().toISOString() })
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
            <Select value={profileDepartment} onValueChange={setProfileDepartment}>
              <SelectTrigger className="mt-1" id="profile_department">
                <SelectValue placeholder="Välj avdelning..." />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {/* Tags */}
        <SettingsSection
          icon={<Tag className="h-4 w-4 text-muted-foreground" />}
          title="Taggar"
          description="Hantera färgkodade taggar för att kategorisera avtal"
        >
          <TagManagementContent />
        </SettingsSection>

        {/* Contract Types */}
        <SettingsSection
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          title="Avtalstyper"
          description="Hantera vilka avtalstyper som finns i systemet"
        >
          <ContractTypesContent />
        </SettingsSection>

        {/* Departments */}
        <SettingsSection
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          title="Avdelningar"
          description="Hantera organisationens avdelningar för avtalsfiltrering"
        >
          <DepartmentManagementContent />
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

function TagManagementContent() {
  const { data: tags = [] } = useTags();
  const { data: usageCounts } = useTagUsageCount();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#2563EB');

  const colors = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#E11D48', '#0891B2', '#4F46E5'];

  const openCreateSheet = () => {
    setEditingTag(null);
    setFormName('');
    setFormColor('#2563EB');
    setSheetOpen(true);
  };

  const openEditSheet = (tag: TagType) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    const name = formName.trim();
    if (!name) return;

    if (tags.some(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== editingTag?.id)) {
      toast.error('Taggen finns redan');
      return;
    }

    if (editingTag) {
      await updateTag.mutateAsync({ id: editingTag.id, name, color: formColor });
    } else {
      await createTag.mutateAsync({ name, color: formColor });
    }
    setSheetOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteTagId) return;
    await deleteTag.mutateAsync(deleteTagId);
    setDeleteTagId(null);
  };

  const usageCount = (tagId: string) => usageCounts?.get(tagId) || 0;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag, i) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{tag.name}</p>
                <p className="text-xs text-muted-foreground">
                  {usageCount(tag.id)} avtal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditSheet(tag)}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTagId(tag.id)}
                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <Button onClick={openCreateSheet} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Skapa ny tagg
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingTag ? 'Redigera tagg' : 'Skapa ny tagg'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="tag_name">Namn *</Label>
              <Input
                id="tag_name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="IT, Säkerhet, etc."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Färg</Label>
              <div className="mt-2 grid grid-cols-8 gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={cn(
                      "h-10 w-10 rounded-lg transition-all",
                      formColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    title={`Välj färg ${color}`}
                    aria-label={`Välj färg ${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || createTag.isPending || updateTag.isPending}
                className="flex-1"
              >
                {editingTag ? 'Spara ändringar' : 'Skapa tagg'}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Avbryt
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTagId} onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort tagg?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTagId && usageCount(deleteTagId) > 0
                ? `Taggen används på ${usageCount(deleteTagId)} avtal. Den kommer att tas bort från alla dessa avtal.`
                : 'Detta kan inte ångras.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ContractTypesContent() {
  const { data: contractTypes = [] } = useContractTypes();
  const { data: usageCounts } = useContractTypeUsageCount();
  const createType = useCreateContractType();
  const updateType = useUpdateContractType();
  const deleteType = useDeleteContractType();

  const [editingType, setEditingType] = useState<any | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formName, setFormName] = useState('');

  const openCreateSheet = () => {
    setEditingType(null);
    setFormName('');
    setSheetOpen(true);
  };

  const openEditSheet = (type: any) => {
    setEditingType(type);
    setFormName(type.name);
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    const name = formName.trim();
    if (!name) return;

    if (contractTypes.some(ct => ct.name.toLowerCase() === name.toLowerCase() && ct.id !== editingType?.id)) {
      toast.error('Avtalstypen finns redan');
      return;
    }

    if (editingType) {
      await updateType.mutateAsync({ id: editingType.id, name });
    } else {
      createType.mutate(name);
    }
    setSheetOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteTypeId) return;
    await deleteType.mutateAsync(deleteTypeId);
    setDeleteTypeId(null);
  };

  const usageCount = (typeName: string) => usageCounts?.get(typeName) || 0;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contractTypes.map((ct, i) => (
          <motion.div
            key={ct.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{ct.name}</p>
              <p className="text-xs text-muted-foreground">
                {usageCount(ct.name)} avtal
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditSheet(ct)}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {!ct.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTypeId(ct.id)}
                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Button onClick={openCreateSheet} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Skapa ny avtalstyp
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingType ? 'Redigera avtalstyp' : 'Skapa ny avtalstyp'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="type_name">Namn *</Label>
              <Input
                id="type_name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Serviceavtal, Licensavtal, etc."
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || createType.isPending || updateType.isPending}
                className="flex-1"
              >
                {editingType ? 'Spara ändringar' : 'Skapa avtalstyp'}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Avbryt
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTypeId} onOpenChange={(open) => !open && setDeleteTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort avtalstyp?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTypeId && (() => {
                const type = contractTypes.find(t => t.id === deleteTypeId);
                const count = type ? usageCount(type.name) : 0;
                return count > 0
                  ? `Avtalstypen används på ${count} avtal. Du måste ändra dessa avtal först.`
                  : 'Detta kan inte ångras.';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DepartmentManagementContent() {
  const { data: departments = [] } = useDepartments();
  const { data: usageCounts } = useDepartmentUsageCount();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const openCreateSheet = () => {
    setEditingDept(null);
    setFormName('');
    setFormDescription('');
    setSheetOpen(true);
  };

  const openEditSheet = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormDescription(dept.description);
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    const name = formName.trim();
    if (!name) return;

    if (departments.some(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== editingDept?.id)) {
      toast.error('Avdelningen finns redan');
      return;
    }

    if (editingDept) {
      await updateDept.mutateAsync({ id: editingDept.id, name, description: formDescription });
    } else {
      await createDept.mutateAsync({ name, description: formDescription });
    }
    setSheetOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteDeptId) return;
    await deleteDept.mutateAsync(deleteDeptId);
    setDeleteDeptId(null);
  };

  const usageCount = (deptId: string) => usageCounts?.get(deptId) || 0;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept, i) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{dept.name}</p>
              <p className="text-xs text-muted-foreground">{usageCount(dept.id)} avtal</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => openEditSheet(dept)} className="h-7 w-7 p-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {!dept.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDeptId(dept.id)}
                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Button onClick={openCreateSheet} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Skapa ny avdelning
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingDept ? 'Redigera avdelning' : 'Skapa ny avdelning'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="dept_name">Namn *</Label>
              <Input
                id="dept_name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="IT, Marknad, etc."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dept_description">Beskrivning</Label>
              <Textarea
                id="dept_description"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Valfri beskrivning..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || createDept.isPending || updateDept.isPending}
                className="flex-1"
              >
                {editingDept ? 'Spara ändringar' : 'Skapa avdelning'}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Avbryt</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteDeptId} onOpenChange={(open) => !open && setDeleteDeptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort avdelning?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDeptId && (() => {
                const dept = departments.find(d => d.id === deleteDeptId);
                const count = dept ? usageCount(dept.id) : 0;
                return count > 0
                  ? `Avdelningen används på ${count} avtal. Dessa avtal kommer att få avdelningsfältet tomt.`
                  : 'Detta kan inte ångras.';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
