import React, { useMemo } from 'react';
import { useLicense } from '@/contexts/LicenseContext';
import { X, AlertTriangle, Clock, AlertCircle, XCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type LicenseWarningLevel = 'none' | 'info' | 'warning' | 'critical' | 'expired';

interface LicenseExpiryInfo {
  level: LicenseWarningLevel;
  daysRemaining: number | null;
  message: string;
  showBanner: boolean;
}

/**
 * Calculate license expiry information
 */
export function calculateLicenseExpiry(expiryDate: string | null | undefined, isLifetime: boolean | undefined): LicenseExpiryInfo {
  // Lifetime licenses never expire
  if (isLifetime) {
    return {
      level: 'none',
      daysRemaining: null,
      message: '',
      showBanner: false
    };
  }

  // No expiry date set
  if (!expiryDate) {
    return {
      level: 'none',
      daysRemaining: null,
      message: '',
      showBanner: false
    };
  }

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Already expired
  if (daysRemaining <= 0) {
    return {
      level: 'expired',
      daysRemaining: 0,
      message: 'Your license has expired. Some features are disabled.',
      showBanner: true
    };
  }

  // 1 day remaining - Critical
  if (daysRemaining === 1) {
    return {
      level: 'critical',
      daysRemaining: 1,
      message: 'CRITICAL: Your license expires tomorrow! Contact support immediately.',
      showBanner: true
    };
  }

  // 7 days or less - Critical warning
  if (daysRemaining <= 7) {
    return {
      level: 'critical',
      daysRemaining,
      message: `WARNING: Your license expires in ${daysRemaining} days!`,
      showBanner: true
    };
  }

  // 30 days or less - Warning
  if (daysRemaining <= 30) {
    return {
      level: 'warning',
      daysRemaining,
      message: `Your license expires in ${daysRemaining} days. Contact support for renewal.`,
      showBanner: true
    };
  }

  // 90 days or less - Info
  if (daysRemaining <= 90) {
    return {
      level: 'info',
      daysRemaining,
      message: `Your license expires in ${daysRemaining} days.`,
      showBanner: true
    };
  }

  // More than 90 days - No warning
  return {
    level: 'none',
    daysRemaining,
    message: '',
    showBanner: false
  };
}

interface LicenseWarningBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export function LicenseWarningBanner({ onDismiss, className }: LicenseWarningBannerProps) {
  const { license, isElectron } = useLicense();

  const expiryInfo = useMemo(() => {
    if (!license || !license.valid) {
      return null;
    }
    return calculateLicenseExpiry(license.expiryDate, license.isLifetime);
  }, [license]);

  // Don't show in web mode or if no warning needed
  if (!isElectron || !expiryInfo || !expiryInfo.showBanner) {
    return null;
  }

  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      icon: Clock
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      icon: AlertTriangle
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: AlertCircle
    },
    expired: {
      bg: 'bg-red-100 dark:bg-red-950/50',
      border: 'border-red-300 dark:border-red-700',
      text: 'text-red-800 dark:text-red-300',
      icon: XCircle
    },
    none: {
      bg: '',
      border: '',
      text: '',
      icon: ShieldAlert
    }
  };

  const style = styles[expiryInfo.level];
  const IconComponent = style.icon;

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-2 border-b',
      style.bg,
      style.border,
      className
    )}>
      <div className="flex items-center gap-2">
        <IconComponent className={cn('h-4 w-4', style.text)} />
        <span className={cn('text-sm font-medium', style.text)}>
          {expiryInfo.message}
        </span>
        {expiryInfo.level !== 'expired' && (
          <a
            href="mailto:support@scanmaster.com?subject=License%20Renewal"
            className={cn('text-sm underline ml-2', style.text)}
          >
            Contact Support
          </a>
        )}
      </div>
      {onDismiss && expiryInfo.level !== 'expired' && expiryInfo.level !== 'critical' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className={cn('h-6 w-6 p-0', style.text)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Hook to get license expiry information
 */
export function useLicenseExpiry() {
  const { license, isElectron } = useLicense();

  return useMemo(() => {
    if (!isElectron || !license || !license.valid) {
      return {
        level: 'none' as LicenseWarningLevel,
        daysRemaining: null,
        message: '',
        showBanner: false,
        isExpired: false,
        isExpiringSoon: false
      };
    }

    const info = calculateLicenseExpiry(license.expiryDate, license.isLifetime);

    return {
      ...info,
      isExpired: info.level === 'expired',
      isExpiringSoon: info.level === 'warning' || info.level === 'critical'
    };
  }, [license, isElectron]);
}

export default LicenseWarningBanner;
