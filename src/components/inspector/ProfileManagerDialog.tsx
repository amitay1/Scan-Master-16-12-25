import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInspectorProfile } from '@/contexts/InspectorProfileContext';
import {
  InspectorProfile,
  InspectorProfileFormData,
  CERTIFICATION_LEVELS,
  CERTIFYING_ORGANIZATIONS,
  createEmptyProfile,
  validateProfileForm,
} from '@/types/inspectorProfile';
import {
  User,
  UserPlus,
  Pencil,
  Trash2,
  Star,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogMode = 'list' | 'create' | 'edit';

interface ProfileManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: DialogMode;
}

export function ProfileManagerDialog({
  open,
  onOpenChange,
  initialMode = 'list',
}: ProfileManagerDialogProps) {
  const {
    profiles,
    createProfile,
    updateProfile,
    deleteProfile,
    setDefaultProfile,
    selectProfile,
  } = useInspectorProfile();

  const [mode, setMode] = useState<DialogMode>(initialMode);
  const [editingProfile, setEditingProfile] = useState<InspectorProfile | null>(null);
  const [formData, setFormData] = useState<InspectorProfileFormData>(createEmptyProfile());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setEditingProfile(null);
      setFormData(createEmptyProfile());
      setErrors({});
    }
  }, [open, initialMode]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleBack = () => {
    setMode('list');
    setEditingProfile(null);
    setFormData(createEmptyProfile());
    setErrors({});
  };

  const handleCreate = () => {
    setMode('create');
    setFormData(createEmptyProfile());
    setErrors({});
  };

  const handleEdit = (profile: InspectorProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      certificationLevel: profile.certificationLevel,
      certificationNumber: profile.certificationNumber,
      certifyingOrganization: profile.certifyingOrganization,
      employeeId: profile.employeeId || '',
      department: profile.department || '',
      email: profile.email || '',
      phone: profile.phone || '',
    });
    setMode('edit');
    setErrors({});
  };

  const handleSave = () => {
    const validationErrors = validateProfileForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (mode === 'create') {
      const newProfile = createProfile(formData);
      selectProfile(newProfile.id);
      handleClose();
    } else if (mode === 'edit' && editingProfile) {
      updateProfile(editingProfile.id, formData);
      handleBack();
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteProfile(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultProfile(id);
  };

  const updateFormField = (field: keyof InspectorProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Render profile list
  const renderList = () => (
    <>
      <DialogHeader className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(12,18,28,0.96))] px-6 py-5">
        <DialogTitle className="flex items-center gap-3 text-white text-xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
            <User className="h-5 w-5 text-blue-300" />
          </span>
          Manage Profiles
        </DialogTitle>
        <DialogDescription className="text-slate-400">
          Create, edit, or delete inspector profiles
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 px-6 py-5 max-h-[480px] overflow-y-auto">
        {profiles.length === 0 ? (
          <div className="text-center py-10 text-slate-400 rounded-[28px] border border-dashed border-white/10 bg-white/[0.03]">
            <p>No profiles created yet</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 p-4 rounded-[24px] border border-white/10 bg-white/[0.03]"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center font-semibold',
                  'bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/20'
                )}
              >
                {profile.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate text-white">{profile.name}</span>
                  {profile.isDefault && (
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-slate-400 truncate">
                  {profile.certificationLevel} · {profile.certificationNumber}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!profile.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-2xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    onClick={() => handleSetDefault(profile.id)}
                    title="Set as default"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-2xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  onClick={() => handleEdit(profile)}
                  title="Edit profile"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-2xl text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  onClick={() => handleDelete(profile.id)}
                  title="Delete profile"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0 border-t border-white/8 bg-black/15 px-6 py-4">
        <Button variant="outline" onClick={handleClose} className="rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] hover:text-white">
          Close
        </Button>
        <Button onClick={handleCreate} className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
          <UserPlus className="h-4 w-4 mr-2" />
          New Profile
        </Button>
      </DialogFooter>
    </>
  );

  // Render create/edit form
  const renderForm = () => (
    <>
      <DialogHeader className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(12,18,28,0.96))] px-6 py-5">
        <DialogTitle className="flex items-center gap-2 text-white text-xl">
          {mode === 'list' ? null : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2 rounded-2xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {mode === 'create' ? 'Create Profile' : 'Edit Profile'}
        </DialogTitle>
        <DialogDescription className="text-slate-400">
          {mode === 'create'
            ? 'Enter your inspector credentials'
            : 'Update inspector credentials'}
        </DialogDescription>
      </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {/* Name */}
          <div className="space-y-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <Label htmlFor="name" className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormField('name', e.target.value)}
              placeholder="John Smith"
              className={cn('h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500', errors.name ? 'border-destructive' : '')}
            />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Certification Level */}
          <div className="space-y-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <Label htmlFor="certLevel" className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Certification Level <span className="text-destructive">*</span>
            </Label>
          <Select
            value={formData.certificationLevel}
            onValueChange={(value) => updateFormField('certificationLevel', value)}
          >
            <SelectTrigger id="certLevel" className="h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100">
              <SelectValue placeholder="Select level..." />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-950 text-slate-100">
              {CERTIFICATION_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Certification Number */}
          <div className="space-y-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <Label htmlFor="certNumber" className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Certification Number <span className="text-destructive">*</span>
            </Label>
          <Input
            id="certNumber"
            value={formData.certificationNumber}
            onChange={(e) => updateFormField('certificationNumber', e.target.value)}
            placeholder="UT-12345"
              className={cn('h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500', errors.certificationNumber ? 'border-destructive' : '')}
            />
          {errors.certificationNumber && (
            <p className="text-xs text-destructive">{errors.certificationNumber}</p>
          )}
        </div>

        {/* Certifying Organization */}
          <div className="space-y-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <Label htmlFor="certOrg" className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Certifying Organization <span className="text-destructive">*</span>
            </Label>
          <Select
            value={formData.certifyingOrganization}
            onValueChange={(value) => updateFormField('certifyingOrganization', value)}
          >
            <SelectTrigger id="certOrg" className="h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100">
              <SelectValue placeholder="Select organization..." />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-950 text-slate-100">
              {CERTIFYING_ORGANIZATIONS.map((org) => (
                <SelectItem key={org} value={org}>
                  {org}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Optional Fields - Collapsible Section */}
        <div className="space-y-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Optional Information</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employeeId" className="text-slate-400">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employeeId || ''}
                onChange={(e) => updateFormField('employeeId', e.target.value)}
                placeholder="EMP-001"
                className="h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="text-slate-400">Department</Label>
              <Input
                id="department"
                value={formData.department || ''}
                onChange={(e) => updateFormField('department', e.target.value)}
                placeholder="NDT Lab"
                className="h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-400">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateFormField('email', e.target.value)}
                placeholder="john@example.com"
                className={cn('h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500', errors.email ? 'border-destructive' : '')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-400">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => updateFormField('phone', e.target.value)}
                placeholder="+1 234 567 8900"
                className="h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0 border-t border-white/8 bg-black/15 px-6 py-4">
        <Button variant="outline" onClick={mode === 'create' && profiles.length === 0 ? handleClose : handleBack} className="rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] hover:text-white">
          Cancel
        </Button>
        <Button onClick={handleSave} className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
          <Save className="h-4 w-4 mr-2" />
          {mode === 'create' ? 'Create Profile' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,22,0.98),rgba(12,18,28,0.98))] p-0 shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
          {mode === 'list' ? renderList() : renderForm()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,22,0.98),rgba(12,18,28,0.98))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. The profile will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
