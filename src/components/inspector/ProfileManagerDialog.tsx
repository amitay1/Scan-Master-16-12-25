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
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Manage Profiles
        </DialogTitle>
        <DialogDescription>
          Create, edit, or delete inspector profiles
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
        {profiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No profiles created yet</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                  'bg-primary/10 text-primary'
                )}
              >
                {profile.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{profile.name}</span>
                  {profile.isDefault && (
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {profile.certificationLevel} · {profile.certificationNumber}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!profile.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSetDefault(profile.id)}
                    title="Set as default"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(profile)}
                  title="Edit profile"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
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

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
        <Button onClick={handleCreate}>
          <UserPlus className="h-4 w-4 mr-2" />
          New Profile
        </Button>
      </DialogFooter>
    </>
  );

  // Render create/edit form
  const renderForm = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {mode === 'list' ? null : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {mode === 'create' ? 'Create Profile' : 'Edit Profile'}
        </DialogTitle>
        <DialogDescription>
          {mode === 'create'
            ? 'Enter your inspector credentials'
            : 'Update inspector credentials'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormField('name', e.target.value)}
            placeholder="John Smith"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Certification Level */}
        <div className="space-y-2">
          <Label htmlFor="certLevel">
            Certification Level <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.certificationLevel}
            onValueChange={(value) => updateFormField('certificationLevel', value)}
          >
            <SelectTrigger id="certLevel">
              <SelectValue placeholder="Select level..." />
            </SelectTrigger>
            <SelectContent>
              {CERTIFICATION_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Certification Number */}
        <div className="space-y-2">
          <Label htmlFor="certNumber">
            Certification Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="certNumber"
            value={formData.certificationNumber}
            onChange={(e) => updateFormField('certificationNumber', e.target.value)}
            placeholder="UT-12345"
            className={errors.certificationNumber ? 'border-destructive' : ''}
          />
          {errors.certificationNumber && (
            <p className="text-xs text-destructive">{errors.certificationNumber}</p>
          )}
        </div>

        {/* Certifying Organization */}
        <div className="space-y-2">
          <Label htmlFor="certOrg">
            Certifying Organization <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.certifyingOrganization}
            onValueChange={(value) => updateFormField('certifyingOrganization', value)}
          >
            <SelectTrigger id="certOrg">
              <SelectValue placeholder="Select organization..." />
            </SelectTrigger>
            <SelectContent>
              {CERTIFYING_ORGANIZATIONS.map((org) => (
                <SelectItem key={org} value={org}>
                  {org}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Optional Fields - Collapsible Section */}
        <div className="space-y-4 pt-2 border-t">
          <p className="text-sm text-muted-foreground">Optional Information</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employeeId || ''}
                onChange={(e) => updateFormField('employeeId', e.target.value)}
                placeholder="EMP-001"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department || ''}
                onChange={(e) => updateFormField('department', e.target.value)}
                placeholder="NDT Lab"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateFormField('email', e.target.value)}
                placeholder="john@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => updateFormField('phone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={mode === 'create' && profiles.length === 0 ? handleClose : handleBack}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          {mode === 'create' ? 'Create Profile' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          {mode === 'list' ? renderList() : renderForm()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The profile will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
