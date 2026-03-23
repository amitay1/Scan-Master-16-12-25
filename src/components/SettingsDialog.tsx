import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  Globe,
  Ruler,
  FileText,
  Building2,
  Bell,
  Eye,
  Cog,
  ChevronRight,
  Check,
  RotateCcw,
  Download,
  Upload,
  Moon,
  Sun,
  Monitor,
  Save,
  Info
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { AppSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { APP_FONT_OPTIONS, AppFontOption, getAvailableAppFonts, normalizeAppFontValue } from '@/lib/appFonts';

// ============================================================================
// TYPES
// ============================================================================

type SettingsTab = 
  | 'general'
  | 'units'
  | 'defaults'
  | 'export'
  | 'company'
  | 'notifications'
  | 'viewer'
  | 'advanced';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// SETTINGS TABS CONFIGURATION
// ============================================================================

const settingsTabs: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'general', label: 'General', icon: <Globe className="w-4 h-4" />, description: 'Language, theme, and display preferences' },
  { id: 'units', label: 'Units', icon: <Ruler className="w-4 h-4" />, description: 'Measurement units and formats' },
  { id: 'defaults', label: 'Defaults', icon: <FileText className="w-4 h-4" />, description: 'Default values for new documents' },
  { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" />, description: 'PDF and document export settings' },
  { id: 'company', label: 'Company', icon: <Building2 className="w-4 h-4" />, description: 'Company information and branding' },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, description: 'Alerts and reminder settings' },
  { id: 'viewer', label: '3D Viewer', icon: <Eye className="w-4 h-4" />, description: '3D visualization preferences' },
  { id: 'advanced', label: 'Advanced', icon: <Cog className="w-4 h-4" />, description: 'Developer and experimental options' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [hasChanges, setHasChanges] = useState(false);

  const handleExportSettings = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scanmaster-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully');
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          if (importSettings(json)) {
            toast.success('Settings imported successfully');
          } else {
            toast.error('Failed to import settings - invalid format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetCategory = () => {
    resetSettings(activeTab);
    toast.success(`${settingsTabs.find(t => t.id === activeTab)?.label} settings reset to defaults`);
  };

  const handleResetAll = () => {
    resetSettings();
    toast.success('All settings reset to defaults');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[84vh] p-0 gap-0 overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,22,0.98),rgba(12,18,28,0.98))] shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(12,18,28,0.96))]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_18px_30px_rgba(37,99,235,0.35)]">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200">
                  Workstation Preferences
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                  8 sections
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-white">Settings</DialogTitle>
              <DialogDescription className="text-sm text-slate-400">
                Configure your ScanMaster preferences
              </DialogDescription>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportSettings}
                    className="rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImportSettings}
                    className="rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-5 bg-white/10 mx-2" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetAll}
                    className="rounded-2xl text-slate-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset All Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/8 bg-black/15 flex-shrink-0">
            <ScrollArea className="h-full py-3">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`mx-3 mb-1 flex w-[calc(100%-24px)] items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500/12 text-blue-300 ring-1 ring-blue-400/20 shadow-[0_14px_30px_rgba(37,99,235,0.12)]'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-blue-400' : 'text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span className="text-sm font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />
                  )}
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Header */}
            <div className="px-6 py-4 border-b border-white/8 bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {settingsTabs.find(t => t.id === activeTab)?.label}
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {settingsTabs.find(t => t.id === activeTab)?.description}
                  </p>
                </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetCategory}
                    className="rounded-2xl text-slate-300 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                </Button>
              </div>
            </div>

            {/* Tab Content */}
            <ScrollArea className="flex-1 px-6 py-5 bg-black/10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'general' && <GeneralSettings />}
                  {activeTab === 'units' && <UnitsSettings />}
                  {activeTab === 'defaults' && <DefaultsSettings />}
                  {activeTab === 'export' && <ExportSettings />}
                  {activeTab === 'company' && <CompanySettings />}
                  {activeTab === 'notifications' && <NotificationSettings />}
                  {activeTab === 'viewer' && <ViewerSettings />}
                  {activeTab === 'advanced' && <AdvancedSettings />}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8 bg-black/15">
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Settings are saved automatically
          </p>
          <Button onClick={() => onOpenChange(false)} className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-6">
            <Check className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// GENERAL SETTINGS
// ============================================================================

function GeneralSettings() {
  const { settings, updateSettings } = useSettings();
  const [availableFonts, setAvailableFonts] = useState<AppFontOption[]>(APP_FONT_OPTIONS);
  const normalizedUiFont = normalizeAppFontValue(settings.general.uiFont);

  useEffect(() => {
    let mounted = true;

    getAvailableAppFonts().then((fonts) => {
      if (mounted && fonts.length > 0) {
        setAvailableFonts(fonts);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (settings.general.uiFont !== normalizedUiFont) {
      updateSettings('general', { uiFont: normalizedUiFont });
    }
  }, [normalizedUiFont, settings.general.uiFont, updateSettings]);

  const selectedFont =
    availableFonts.find((font) => font.value === normalizedUiFont) ??
    APP_FONT_OPTIONS.find((font) => font.value === normalizedUiFont) ??
    availableFonts[0] ??
    APP_FONT_OPTIONS[0];
  const curatedFonts = availableFonts.filter((font) => font.source === 'curated');
  const systemFonts = availableFonts.filter((font) => font.source === 'system');

  return (
    <div className="space-y-6">
      {/* Theme */}
      <SettingsSection title="Appearance">
        <SettingsRow
          label="Theme"
          description="Choose your preferred color theme"
        >
          <div className="flex gap-2">
            {[
              { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
              { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
              { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
            ].map((theme) => (
              <Button
                key={theme.value}
                variant={settings.general.theme === theme.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings('general', { theme: theme.value as AppSettings['general']['theme'] })}
                className={settings.general.theme === theme.value ? 'bg-blue-600' : ''}
              >
                {theme.icon}
                <span className="ml-2">{theme.label}</span>
              </Button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow
          label="Application Font"
          description="Choose the main font used across the interface"
        >
          <div className="space-y-3">
            <Select
              value={normalizedUiFont}
              onValueChange={(value) => updateSettings('general', { uiFont: value as AppSettings['general']['uiFont'] })}
            >
              <SelectTrigger className="w-[340px] max-w-full">
                <SelectValue placeholder="Select interface font" />
              </SelectTrigger>
              <SelectContent className="max-h-[360px]">
                <SelectGroup>
                  <SelectLabel>Recommended</SelectLabel>
                  {curatedFonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
                {systemFonts.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Detected On This Computer</SelectLabel>
                      {systemFonts.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>

            <div
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              style={{ fontFamily: selectedFont.stack }}
            >
              <div className="text-sm font-semibold text-white">
                {selectedFont.label}
              </div>
              <div className="text-sm text-slate-300">
                ScanMaster Technique Card Preview 123
              </div>
              <div className="text-xs text-slate-400">
                {selectedFont.sample}
              </div>
            </div>

            <div className="text-xs text-slate-400">
              {systemFonts.length > 0
                ? `${availableFonts.length} fonts available, including ${systemFonts.length} detected from this workstation.`
                : `${availableFonts.length} fonts available in the selector.`}
            </div>
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* Language */}
      <SettingsSection title="Language & Region">
        <SettingsRow
          label="Language"
          description="Select your preferred language"
        >
          <Select
            value={settings.general.language}
            onValueChange={(value) => updateSettings('general', { language: value as AppSettings['general']['language'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="he">עברית</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Date Format"
          description="How dates are displayed"
        >
          <Select
            value={settings.general.dateFormat}
            onValueChange={(value) => updateSettings('general', { dateFormat: value as AppSettings['general']['dateFormat'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Time Format"
          description="12-hour or 24-hour clock"
        >
          <Select
            value={settings.general.timeFormat}
            onValueChange={(value) => updateSettings('general', { timeFormat: value as AppSettings['general']['timeFormat'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
              <SelectItem value="24h">24-hour</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

// ============================================================================
// UNITS SETTINGS
// ============================================================================

function UnitsSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <SettingsSection title="Measurement Units">
        <SettingsRow
          label="Length Unit"
          description="Primary unit for dimensions"
        >
          <Select
            value={settings.units.lengthUnit}
            onValueChange={(value) => updateSettings('units', { lengthUnit: value as AppSettings['units']['lengthUnit'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mm">Millimeters (mm)</SelectItem>
              <SelectItem value="inch">Inches (in)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Angle Unit"
          description="Unit for angle measurements"
        >
          <Select
            value={settings.units.angleUnit}
            onValueChange={(value) => updateSettings('units', { angleUnit: value as AppSettings['units']['angleUnit'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="degrees">Degrees (°)</SelectItem>
              <SelectItem value="radians">Radians (rad)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Temperature Unit"
          description="For material temperature references"
        >
          <Select
            value={settings.units.temperatureUnit}
            onValueChange={(value) => updateSettings('units', { temperatureUnit: value as AppSettings['units']['temperatureUnit'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="celsius">Celsius (°C)</SelectItem>
              <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Frequency Display"
          description="How ultrasonic frequency is shown"
        >
          <Select
            value={settings.units.frequencyDisplay}
            onValueChange={(value) => updateSettings('units', { frequencyDisplay: value as AppSettings['units']['frequencyDisplay'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MHz">MHz</SelectItem>
              <SelectItem value="kHz">kHz</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

// ============================================================================
// DEFAULTS SETTINGS
// ============================================================================

function DefaultsSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <SettingsSection title="Document Defaults">
        <SettingsRow
          label="Default Standard"
          description="Standard to use for new technique sheets"
        >
          <Select
            value={settings.defaults.defaultStandard}
            onValueChange={(value) => updateSettings('defaults', { defaultStandard: value as AppSettings['defaults']['defaultStandard'] })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AMS-STD-2154E">AMS-STD-2154E</SelectItem>
              <SelectItem value="ASTM-A388">ASTM-A388</SelectItem>
              <SelectItem value="BS-EN-10228-3">BS-EN-10228-3</SelectItem>
              <SelectItem value="BS-EN-10228-4">BS-EN-10228-4</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Default Material"
          description="Pre-selected material for new documents"
        >
          <Input
            value={settings.defaults.defaultMaterial}
            onChange={(e) => updateSettings('defaults', { defaultMaterial: e.target.value })}
            className="w-48"
            placeholder="e.g., Aluminum 7075-T6"
          />
        </SettingsRow>

        <SettingsRow
          label="Default Frequency (MHz)"
          description="Pre-selected probe frequency"
        >
          <Input
            value={settings.defaults.defaultFrequency}
            onChange={(e) => updateSettings('defaults', { defaultFrequency: e.target.value })}
            className="w-32"
            placeholder="5.0"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Auto-Fill Behavior">
        <SettingsRow
          label="Auto-Fill Enabled"
          description="Automatically fill related fields based on standard rules"
        >
          <Switch
            checked={settings.defaults.autoFillEnabled}
            onCheckedChange={(checked) => updateSettings('defaults', { autoFillEnabled: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Auto-Calculate"
          description="Automatically calculate values like metal travel, beam paths"
        >
          <Switch
            checked={settings.defaults.autoCalculateEnabled}
            onCheckedChange={(checked) => updateSettings('defaults', { autoCalculateEnabled: checked })}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

// ============================================================================
// EXPORT SETTINGS
// ============================================================================

function ExportSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <SettingsSection title="Export Preferences">
        <SettingsRow
          label="Default Format"
          description="Preferred export file format"
        >
          <Select
            value={settings.export.defaultExportFormat}
            onValueChange={(value) => updateSettings('export', { defaultExportFormat: value as AppSettings['export']['defaultExportFormat'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Only</SelectItem>
              <SelectItem value="docx">DOCX Only</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Page Size"
          description="Document page size"
        >
          <Select
            value={settings.export.pageSize}
            onValueChange={(value) => updateSettings('export', { pageSize: value as AppSettings['export']['pageSize'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="Letter">Letter</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="PDF Quality"
          description="Image and rendering quality"
        >
          <Select
            value={settings.export.pdfQuality}
            onValueChange={(value) => updateSettings('export', { pdfQuality: value as AppSettings['export']['pdfQuality'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft (fast)</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high">High Quality</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Content Options">
        <SettingsRow
          label="Include Cover Page"
          description="Add a professional cover page"
        >
          <Switch
            checked={settings.export.includeCoverPage}
            onCheckedChange={(checked) => updateSettings('export', { includeCoverPage: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Include Table of Contents"
          description="Generate automatic TOC"
        >
          <Switch
            checked={settings.export.includeTableOfContents}
            onCheckedChange={(checked) => updateSettings('export', { includeTableOfContents: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Include Technical Drawings"
          description="Embed part diagrams and drawings"
        >
          <Switch
            checked={settings.export.includeDrawings}
            onCheckedChange={(checked) => updateSettings('export', { includeDrawings: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Include Company Logo"
          description="Add your company logo to documents"
        >
          <Switch
            checked={settings.export.includeCompanyLogo}
            onCheckedChange={(checked) => updateSettings('export', { includeCompanyLogo: checked })}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

// ============================================================================
// COMPANY SETTINGS
// ============================================================================

function CompanySettings() {
  const { settings, updateSettings } = useSettings();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSettings('company', { companyLogo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Company Information">
        <SettingsRow
          label="Company Name"
          description="Your organization's name"
        >
          <Input
            value={settings.company.companyName}
            onChange={(e) => updateSettings('company', { companyName: e.target.value })}
            className="w-64"
            placeholder="Enter company name"
          />
        </SettingsRow>

        <SettingsRow
          label="Company Logo"
          description="Logo for documents and exports"
        >
          <div className="flex items-center gap-4">
            {settings.company.companyLogo && (
              <img
                src={settings.company.companyLogo}
                alt="Company Logo"
                className="h-10 w-auto object-contain bg-white rounded px-2 py-1"
              />
            )}
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                <Upload className="w-4 h-4" />
                Upload Logo
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        </SettingsRow>

        <SettingsRow
          label="Address"
          description="Company address for documents"
        >
          <Textarea
            value={settings.company.companyAddress}
            onChange={(e) => updateSettings('company', { companyAddress: e.target.value })}
            className="w-64 h-20"
            placeholder="Enter company address"
          />
        </SettingsRow>

        <SettingsRow
          label="Phone"
          description="Contact phone number"
        >
          <Input
            value={settings.company.companyPhone}
            onChange={(e) => updateSettings('company', { companyPhone: e.target.value })}
            className="w-48"
            placeholder="+1 (555) 000-0000"
          />
        </SettingsRow>

        <SettingsRow
          label="Email"
          description="Contact email address"
        >
          <Input
            value={settings.company.companyEmail}
            onChange={(e) => updateSettings('company', { companyEmail: e.target.value })}
            className="w-48"
            placeholder="contact@company.com"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Certifications">
        <SettingsRow
          label="NADCAP Number"
          description="NADCAP accreditation number"
        >
          <Input
            value={settings.company.nadcapNumber}
            onChange={(e) => updateSettings('company', { nadcapNumber: e.target.value })}
            className="w-48"
            placeholder="e.g., NDT-12345"
          />
        </SettingsRow>

        <SettingsRow
          label="ISO 17025 Number"
          description="ISO 17025 certification number"
        >
          <Input
            value={settings.company.iso17025Number}
            onChange={(e) => updateSettings('company', { iso17025Number: e.target.value })}
            className="w-48"
            placeholder="e.g., L12345"
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

function NotificationSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <SettingsSection title="Reminders & Alerts">
        <SettingsRow
          label="Validation Warnings"
          description="Show warnings when fields don't meet standards"
        >
          <Switch
            checked={settings.notifications.validationWarnings}
            onCheckedChange={(checked) => updateSettings('notifications', { validationWarnings: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Auto-Save Reminder"
          description="Remind to save work periodically"
        >
          <Switch
            checked={settings.notifications.autoSaveReminder}
            onCheckedChange={(checked) => updateSettings('notifications', { autoSaveReminder: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Auto-Save Interval"
          description="Minutes between save reminders"
        >
          <div className="flex items-center gap-4 w-48">
            <Slider
              value={[settings.notifications.autoSaveInterval]}
              onValueChange={([value]) => updateSettings('notifications', { autoSaveInterval: value })}
              min={1}
              max={30}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-slate-400 w-12">{settings.notifications.autoSaveInterval} min</span>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Interface">
        <SettingsRow
          label="Show Tooltips"
          description="Display helpful hints on hover"
        >
          <Switch
            checked={settings.notifications.showTooltips}
            onCheckedChange={(checked) => updateSettings('notifications', { showTooltips: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Sound Effects"
          description="Play sounds for notifications"
        >
          <Switch
            checked={settings.notifications.soundEffects}
            onCheckedChange={(checked) => updateSettings('notifications', { soundEffects: checked })}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

// ============================================================================
// VIEWER SETTINGS
// ============================================================================

function ViewerSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <SettingsSection title="3D Viewer">
        <SettingsRow
          label="Enable 3D Viewer"
          description="Show 3D part visualization panel"
        >
          <Switch
            checked={settings.viewer.viewer3DEnabled}
            onCheckedChange={(checked) => updateSettings('viewer', { viewer3DEnabled: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Default Size"
          description="Initial 3D viewer panel size"
        >
          <Select
            value={settings.viewer.viewer3DDefaultSize}
            onValueChange={(value) => updateSettings('viewer', { viewer3DDefaultSize: value as AppSettings['viewer']['viewer3DDefaultSize'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S">Small</SelectItem>
              <SelectItem value="M">Medium</SelectItem>
              <SelectItem value="L">Large</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Show Grid"
          description="Display reference grid in 3D viewer"
        >
          <Switch
            checked={settings.viewer.viewer3DShowGrid}
            onCheckedChange={(checked) => updateSettings('viewer', { viewer3DShowGrid: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Show Axes"
          description="Display X, Y, Z coordinate axes"
        >
          <Switch
            checked={settings.viewer.viewer3DShowAxes}
            onCheckedChange={(checked) => updateSettings('viewer', { viewer3DShowAxes: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Auto Rotate"
          description="Automatically rotate the 3D model"
        >
          <Switch
            checked={settings.viewer.viewer3DAutoRotate}
            onCheckedChange={(checked) => updateSettings('viewer', { viewer3DAutoRotate: checked })}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Technical Drawing">
        <SettingsRow
          label="Enable Grid"
          description="Show grid on technical drawings"
        >
          <Switch
            checked={settings.viewer.drawingGridEnabled}
            onCheckedChange={(checked) => updateSettings('viewer', { drawingGridEnabled: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Snap to Grid"
          description="Snap elements to grid when drawing"
        >
          <Switch
            checked={settings.viewer.drawingSnapToGrid}
            onCheckedChange={(checked) => updateSettings('viewer', { drawingSnapToGrid: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Grid Size (px)"
          description="Distance between grid lines"
        >
          <div className="flex items-center gap-4 w-48">
            <Slider
              value={[settings.viewer.drawingGridSize]}
              onValueChange={([value]) => updateSettings('viewer', { drawingGridSize: value })}
              min={5}
              max={50}
              step={5}
              className="flex-1"
            />
            <span className="text-sm text-slate-400 w-12">{settings.viewer.drawingGridSize}px</span>
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

// ============================================================================
// ADVANCED SETTINGS
// ============================================================================

function AdvancedSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <Info className="w-5 h-5 text-amber-400" />
        <p className="text-sm text-amber-200">
          These settings are for advanced users. Changing them may affect performance.
        </p>
      </div>

      <SettingsSection title="Developer Options">
        <SettingsRow
          label="Developer Mode"
          description="Enable developer tools and debugging"
        >
          <Switch
            checked={settings.advanced.developerMode}
            onCheckedChange={(checked) => updateSettings('advanced', { developerMode: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Debug Logging"
          description="Enable detailed console logging"
        >
          <Switch
            checked={settings.advanced.debugLogging}
            onCheckedChange={(checked) => updateSettings('advanced', { debugLogging: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Experimental Features"
          description="Enable features still in development"
        >
          <Switch
            checked={settings.advanced.experimentalFeatures}
            onCheckedChange={(checked) => updateSettings('advanced', { experimentalFeatures: checked })}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Performance">
        <SettingsRow
          label="Enable Cache"
          description="Cache data for faster loading"
        >
          <Switch
            checked={settings.advanced.cacheEnabled}
            onCheckedChange={(checked) => updateSettings('advanced', { cacheEnabled: checked })}
          />
        </SettingsRow>

        <SettingsRow
          label="Offline Mode"
          description="Enable offline data storage"
        >
          <Switch
            checked={settings.advanced.offlineMode}
            onCheckedChange={(checked) => updateSettings('advanced', { offlineMode: checked })}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Data Management">
        <SettingsRow
          label="Recent Files Limit"
          description="Maximum number of recent files to remember"
        >
          <div className="flex items-center gap-4 w-48">
            <Slider
              value={[settings.advanced.maxRecentFiles]}
              onValueChange={([value]) => updateSettings('advanced', { maxRecentFiles: value })}
              min={5}
              max={50}
              step={5}
              className="flex-1"
            />
            <span className="text-sm text-slate-400 w-8">{settings.advanced.maxRecentFiles}</span>
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 mb-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest border-b border-white/8 pb-2">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-4 rounded-[22px] bg-black/15 hover:bg-black/20 border border-white/8 transition-colors">
      <div className="flex-1 pr-6 min-w-0">
        <Label className="text-sm font-medium text-white block">{label}</Label>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="flex-shrink-0 [&_input]:rounded-2xl [&_input]:border-white/10 [&_input]:bg-slate-950/80 [&_input]:text-white [&_input]:placeholder:text-slate-500 [&_button]:rounded-2xl [&_button]:border-white/10 [&_button]:bg-slate-950/80 [&_button]:text-white [&_textarea]:rounded-2xl [&_textarea]:border-white/10 [&_textarea]:bg-slate-950/80 [&_textarea]:text-white">{children}</div>
    </div>
  );
}
