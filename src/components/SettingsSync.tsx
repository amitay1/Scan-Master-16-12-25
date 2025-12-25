/**
 * Component that syncs app settings with external providers
 * Place this inside SettingsProvider to enable automatic syncing
 */

import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from 'next-themes';

export function SettingsSync() {
  const { settings } = useSettings();
  const { setTheme, theme } = useTheme();

  // Sync theme with next-themes whenever settings change
  useEffect(() => {
    if (settings.general.theme !== theme) {
      setTheme(settings.general.theme);
    }
  }, [settings.general.theme, setTheme, theme]);

  // Apply language direction
  useEffect(() => {
    document.documentElement.dir = settings.general.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.general.language;
  }, [settings.general.language]);

  // This component doesn't render anything
  return null;
}
