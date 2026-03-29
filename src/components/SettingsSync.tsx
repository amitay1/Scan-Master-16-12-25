/**
 * Component that syncs app settings with external providers
 * Place this inside SettingsProvider to enable automatic syncing
 */

import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from 'next-themes';
import { normalizeAppFontValue, resolveAppFontStacks } from '@/lib/appFonts';

export function SettingsSync() {
  const { settings } = useSettings();
  const { setTheme, theme } = useTheme();

  // Sync theme with next-themes whenever settings change
  useEffect(() => {
    if (settings.general.theme !== theme) {
      setTheme(settings.general.theme);
    }
  }, [settings.general.theme, setTheme, theme]);

  // Keep the application in English/LTR mode
  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  }, [settings.general.language]);

  useEffect(() => {
    const root = document.documentElement;
    const normalizedFont = normalizeAppFontValue(settings.general.uiFont);
    const fontConfig = resolveAppFontStacks(normalizedFont);
    root.style.setProperty('--app-font-family', fontConfig.body);
    root.style.setProperty('--app-heading-font-family', fontConfig.heading);
  }, [settings.general.uiFont]);

  // This component doesn't render anything
  return null;
}
