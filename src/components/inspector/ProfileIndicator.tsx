import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInspectorProfile } from '@/contexts/InspectorProfileContext';
import { ProfileSelectionDialog } from './ProfileSelectionDialog';
import { ProfileManagerDialog } from './ProfileManagerDialog';
import { User, ChevronDown, Settings, RefreshCw, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileIndicatorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function ProfileIndicator({ variant = 'default', className }: ProfileIndicatorProps) {
  const { currentProfile, profiles, selectProfile } = useInspectorProfile();
  const [showSelection, setShowSelection] = useState(false);
  const [showManager, setShowManager] = useState(false);

  if (!currentProfile) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSelection(true)}
                className={cn('gap-2', className)}
              >
                <User className="h-4 w-4" />
                {variant === 'default' && <span>Select Profile</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select inspector profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ProfileSelectionDialog
          open={showSelection}
          onOpenChange={setShowSelection}
          allowClose
        />
      </>
    );
  }

  const otherProfiles = profiles.filter(p => p.id !== currentProfile.id);

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('gap-2 px-2', className)}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                      'bg-primary text-primary-foreground'
                    )}
                  >
                    {currentProfile.initials}
                  </div>
                  {variant === 'default' && (
                    <span className="max-w-[100px] truncate text-sm">
                      {currentProfile.name}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">{currentProfile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentProfile.certificationLevel} · {currentProfile.certificationNumber}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="end" className="w-56">
          {/* Current Profile Info */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                  'bg-primary/10 text-primary'
                )}
              >
                {currentProfile.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentProfile.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentProfile.certificationLevel}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentProfile.certificationNumber}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Quick Switch to Other Profiles */}
          {otherProfiles.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch Profile
              </DropdownMenuLabel>
              {otherProfiles.slice(0, 3).map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  onClick={() => selectProfile(profile.id)}
                  className="gap-2"
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      'bg-muted text-muted-foreground'
                    )}
                  >
                    {profile.initials}
                  </div>
                  <span className="flex-1 truncate">{profile.name}</span>
                  {profile.isDefault && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                </DropdownMenuItem>
              ))}
              {otherProfiles.length > 3 && (
                <DropdownMenuItem
                  onClick={() => setShowSelection(true)}
                  className="text-muted-foreground"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  View all profiles...
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Actions */}
          <DropdownMenuItem onClick={() => setShowSelection(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Change Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowManager(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Profiles
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileSelectionDialog
        open={showSelection}
        onOpenChange={setShowSelection}
        allowClose
      />

      <ProfileManagerDialog
        open={showManager}
        onOpenChange={setShowManager}
      />
    </>
  );
}
