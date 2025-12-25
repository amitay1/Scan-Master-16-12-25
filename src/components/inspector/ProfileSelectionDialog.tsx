import React, { useState } from 'react';
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
    rememberSelection,
    selectProfile,
    setRememberSelection,
  } = useInspectorProfile();

  const [selectedId, setSelectedId] = useState<string | null>(currentProfile?.id || null);
  const [showManager, setShowManager] = useState(false);

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
        'w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all',
        selected
          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {profile.initials}
    </div>
  );

  return (
    <>
      <Dialog open={open && !showManager} onOpenChange={allowClose ? onOpenChange : undefined}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={allowClose ? undefined : (e) => e.preventDefault()}
          onEscapeKeyDown={allowClose ? undefined : (e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Your Profile
            </DialogTitle>
            <DialogDescription>
              Choose your inspector profile to continue. Your credentials will be used for documentation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {profiles.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No profiles yet</p>
                  <p className="text-xs text-muted-foreground">
                    Create your first inspector profile to get started
                  </p>
                </div>
                <Button onClick={handleCreateNew} className="mt-2">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            ) : (
              <>
                {/* Profile List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {profiles.map((profile) => {
                    const isSelected = selectedId === profile.id;
                    return (
                      <button
                        key={profile.id}
                        onClick={() => handleSelect(profile)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        )}
                      >
                        <ProfileAvatar profile={profile} selected={isSelected} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{profile.name}</span>
                            {profile.isDefault && (
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {profile.certificationLevel} · {profile.certificationNumber}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.certifyingOrganization}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={handleCreateNew}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    New Profile
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowManager(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>

                {/* Remember Selection */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="remember"
                    checked={rememberSelection}
                    onCheckedChange={(checked) => setRememberSelection(!!checked)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Remember my selection
                  </label>
                </div>

                {/* Continue Button */}
                <Button
                  onClick={handleContinue}
                  disabled={!selectedId}
                  className="w-full"
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
