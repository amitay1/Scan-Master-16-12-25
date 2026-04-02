import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useInspectorProfile } from '@/contexts/InspectorProfileContext';
import { InspectorProfile } from '@/types/inspectorProfile';
import { User, UserPlus, Settings, Star, Check } from 'lucide-react';
import { ProfileManagerDialog } from './ProfileManagerDialog';
import { cn } from '@/lib/utils';

interface ProfileSelectionDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  allowClose?: boolean;
}

export function ProfileSelectionDialog({
  open,
  onOpenChange,
  allowClose = false,
}: ProfileSelectionDialogProps) {
  const {
    profiles,
    currentProfile,
    preferredProfileId,
    rememberSelection,
    selectProfile,
    setRememberSelection,
  } = useInspectorProfile();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const suggestedProfile =
      (preferredProfileId && profiles.find((profile) => profile.id === preferredProfileId)) ||
      profiles.find((profile) => profile.isDefault) ||
      profiles[0] ||
      null;

    setSelectedId(currentProfile?.id || suggestedProfile?.id || null);
  }, [open, profiles, currentProfile?.id, preferredProfileId]);

  const handleSelect = (profile: InspectorProfile) => {
    setSelectedId(profile.id);
  };

  const handleContinue = () => {
    if (selectedId) {
      selectProfile(selectedId);
      onOpenChange?.(false);
    }
  };

  const handleCreateNew = () => {
    setShowManager(true);
  };

  const handleManagerClose = () => {
    setShowManager(false);
  };

  // Avatar component for profile initials
  const ProfileAvatar = ({ profile, selected }: { profile: InspectorProfile; selected: boolean }) => (
    <div
      className={cn(
        'w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all',
        selected
          ? 'bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/30'
          : 'bg-white/[0.05] text-slate-300'
      )}
    >
      {profile.initials}
    </div>
  );

  return (
    <>
      <Dialog open={open && !showManager} onOpenChange={allowClose ? onOpenChange : undefined}>
        <DialogContent
          className="sm:max-w-2xl overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,22,0.98),rgba(12,18,28,0.98))] p-0 shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
          onPointerDownOutside={allowClose ? undefined : (e) => e.preventDefault()}
          onEscapeKeyDown={allowClose ? undefined : (e) => e.preventDefault()}
        >
          <DialogHeader className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(12,18,28,0.96))] px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
                  <User className="h-5 w-5 text-blue-300" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200">
                      Session Access
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                      {profiles.length} profile{profiles.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <DialogTitle className="flex items-center gap-2 text-white text-xl">
                    <User className="h-5 w-5 text-blue-400" />
                    Choose Session Profile
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Pick the inspector profile for this session. The system will ask again next time you open the app.
                  </DialogDescription>
                </div>
              </div>

              <div className="grid w-full min-w-0 grid-cols-2 gap-3 lg:max-w-[320px]">
                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="truncate text-[11px] uppercase tracking-[0.24em] text-slate-500">Suggested</div>
                  <div
                    className="mt-1 block truncate text-sm font-semibold text-white"
                    title={(preferredProfileId && profiles.find((profile) => profile.id === preferredProfileId)?.name) || 'Auto'}
                  >
                    {(preferredProfileId && profiles.find((profile) => profile.id === preferredProfileId)?.name) || 'Auto'}
                  </div>
                </div>
                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="truncate text-[11px] uppercase tracking-[0.24em] text-slate-500">Active</div>
                  <div
                    className="mt-1 block truncate text-sm font-semibold text-white"
                    title={currentProfile?.name || 'None'}
                  >
                    {currentProfile?.name || 'None'}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            {profiles.length === 0 ? (
              <div className="text-center py-10 space-y-4 rounded-[28px] border border-dashed border-white/10 bg-white/[0.03]">
                <div className="mx-auto w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">No profiles yet</p>
                  <p className="text-xs text-slate-400">
                    Create your first inspector profile to get started
                  </p>
                </div>
                <Button onClick={handleCreateNew} className="mt-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            ) : (
              <>
                {/* Profile List */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {profiles.map((profile) => {
                    const isSelected = selectedId === profile.id;
                    return (
                      <button
                        key={profile.id}
                        onClick={() => handleSelect(profile)}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-[24px] border transition-all text-left',
                          isSelected
                            ? 'border-blue-400/20 bg-blue-500/10 shadow-[0_18px_40px_rgba(37,99,235,0.14)]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]'
                        )}
                      >
                        <ProfileAvatar profile={profile} selected={isSelected} />
                        <div className="flex-1 min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="min-w-0 flex-1 truncate font-medium text-white" title={profile.name}>
                              {profile.name}
                            </span>
                            {preferredProfileId === profile.id && (
                              <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
                                Suggested
                              </span>
                            )}
                            {profile.isDefault && (
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-slate-400 truncate">
                            {profile.certificationLevel} · {profile.certificationNumber}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {profile.certifyingOrganization}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-300 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/8">
                  <Button variant="ghost" size="sm" onClick={handleCreateNew} className="rounded-2xl text-slate-300 hover:bg-white/[0.05] hover:text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    New Profile
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowManager(true)} className="rounded-2xl text-slate-300 hover:bg-white/[0.05] hover:text-white">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>

                {/* Remember Selection */}
                <div className="flex items-center space-x-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <Checkbox
                    id="remember"
                    checked={rememberSelection}
                    onCheckedChange={(checked) => setRememberSelection(!!checked)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-slate-400 cursor-pointer select-none"
                  >
                    Suggest this profile next time
                  </label>
                </div>

                {/* Continue Button */}
                <Button
                  onClick={handleContinue}
                  disabled={!selectedId}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                  size="lg"
                >
                  Continue
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ProfileManagerDialog
        open={showManager}
        onOpenChange={handleManagerClose}
        initialMode="create"
      />
    </>
  );
}
