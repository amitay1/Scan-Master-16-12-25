import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Rocket,
  Key,
  Settings,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  Globe,
  Ruler,
  Building,
  FileText,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLicense } from '@/contexts/LicenseContext';
import type { FirstRunData } from '@/hooks/useFirstRun';

interface FirstRunWizardProps {
  open: boolean;
  onComplete: (data: FirstRunData) => void;
  onSkip: () => void;
}

type WizardStep = 'welcome' | 'license' | 'configuration' | 'tutorial' | 'complete';

const STEPS: WizardStep[] = ['welcome', 'license', 'configuration', 'tutorial', 'complete'];

const stepInfo: Record<WizardStep, { title: string; icon: React.ReactNode }> = {
  welcome: { title: 'Welcome', icon: <Rocket className="h-5 w-5" /> },
  license: { title: 'License', icon: <Key className="h-5 w-5" /> },
  configuration: { title: 'Setup', icon: <Settings className="h-5 w-5" /> },
  tutorial: { title: 'Tutorial', icon: <BookOpen className="h-5 w-5" /> },
  complete: { title: 'Complete', icon: <CheckCircle2 className="h-5 w-5" /> },
};

export function FirstRunWizard({ open, onComplete, onSkip }: FirstRunWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [wizardData, setWizardData] = useState<FirstRunData>({
    selectedLanguage: 'en',
    selectedUnits: 'metric',
    defaultStandard: 'AMS-STD-2154E',
    organizationName: '',
    skippedTutorial: false,
    licenseActivated: false,
  });

  const { activateLicense, license, isElectron } = useLicense();

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const updateWizardData = useCallback((data: Partial<FirstRunData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentStepIndex]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setLicenseError('Please enter a license key');
      return;
    }

    setIsActivating(true);
    setLicenseError('');

    try {
      const result = await activateLicense(licenseKey);
      if (result.success) {
        updateWizardData({ licenseActivated: true });
        goNext();
      } else {
        setLicenseError(result.error || 'Invalid license key');
      }
    } catch (error) {
      setLicenseError('Failed to activate license');
    } finally {
      setIsActivating(false);
    }
  };

  const handleComplete = () => {
    onComplete(wizardData);
  };

  // Step Components
  const WelcomeStep = () => (
    <div className="text-center py-8">
      <div className="inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
        <Stethoscope className="h-16 w-16 text-blue-600" />
      </div>
      <h2 className="text-3xl font-bold mb-3">Welcome to Scan-Master</h2>
      <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
        Professional NDT inspection planning and documentation system
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left mb-8">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <span className="text-sm">Technique Sheets</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <span className="text-sm">Inspection Reports</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <span className="text-sm">3D Visualization</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <span className="text-sm">PDF Export</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <span className="text-sm">Multiple Standards</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <span className="text-sm">CAD Integration</span>
        </div>
      </div>
      <Button size="lg" onClick={goNext}>
        Get Started
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  const LicenseStep = () => (
    <div className="py-6">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <Key className="h-10 w-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Activate Your License</h2>
        <p className="text-muted-foreground">
          Enter your license key to unlock all features
        </p>
      </div>

      {!isElectron ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            License activation is only available in the desktop application.
            You can continue in trial mode for now.
          </p>
        </div>
      ) : license?.activated ? (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
          <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            License activated: {license.factoryName || license.factoryId}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="license-key">License Key</Label>
            <Input
              id="license-key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="font-mono"
            />
            {licenseError && (
              <p className="text-sm text-red-500 mt-1">{licenseError}</p>
            )}
          </div>
          <Button
            onClick={handleActivateLicense}
            disabled={isActivating}
            className="w-full"
          >
            {isActivating ? 'Activating...' : 'Activate License'}
          </Button>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button variant="outline" onClick={goNext}>
          {license?.activated || !isElectron ? 'Continue' : 'Skip for Now'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const ConfigurationStep = () => (
    <div className="py-6">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <Settings className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Configure Your Preferences</h2>
        <p className="text-muted-foreground">
          Set up your default settings
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4" />
              Language
            </Label>
            <Select
              value={wizardData.selectedLanguage}
              onValueChange={(value) => updateWizardData({ selectedLanguage: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="he">Hebrew</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4" />
              Units
            </Label>
            <Select
              value={wizardData.selectedUnits}
              onValueChange={(value: 'metric' | 'imperial') => updateWizardData({ selectedUnits: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (mm)</SelectItem>
                <SelectItem value="imperial">Imperial (inch)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4" />
            Default Standard
          </Label>
          <Select
            value={wizardData.defaultStandard}
            onValueChange={(value) => updateWizardData({ defaultStandard: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AMS-STD-2154E">AMS-STD-2154E (Aerospace)</SelectItem>
              <SelectItem value="ASTM-A388">ASTM A388 (Steel Forgings)</SelectItem>
              <SelectItem value="BS-EN-10228-3">BS EN 10228-3 (European)</SelectItem>
              <SelectItem value="MIL-STD-2154">MIL-STD-2154 (Military)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Building className="h-4 w-4" />
            Organization Name (Optional)
          </Label>
          <Input
            value={wizardData.organizationName}
            onChange={(e) => updateWizardData({ organizationName: e.target.value })}
            placeholder="Your company or organization"
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={goNext}>
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const TutorialStep = () => (
    <div className="py-6">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
          <BookOpen className="h-10 w-10 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Quick Start Guide</h2>
        <p className="text-muted-foreground">
          Learn the basics of Scan-Master
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <h3 className="font-semibold mb-1">1. Create a Technique Sheet</h3>
          <p className="text-sm text-muted-foreground">
            Start by filling in the Setup tab with part information, material, and dimensions.
          </p>
        </div>

        <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <h3 className="font-semibold mb-1">2. Configure Equipment</h3>
          <p className="text-sm text-muted-foreground">
            Set up your transducer, frequency, and scanning parameters.
          </p>
        </div>

        <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <h3 className="font-semibold mb-1">3. Define Acceptance Criteria</h3>
          <p className="text-sm text-muted-foreground">
            Select the acceptance class based on your inspection standard.
          </p>
        </div>

        <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <h3 className="font-semibold mb-1">4. Export Your Work</h3>
          <p className="text-sm text-muted-foreground">
            Generate professional PDF reports with technical drawings.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <Button variant="outline" asChild>
          <a href="https://docs.scanmaster.com" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Full Documentation
          </a>
        </Button>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={goNext}>
          Finish Setup
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const CompleteStep = () => (
    <div className="text-center py-8">
      <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold mb-3">You're All Set!</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
        Your Scan-Master is ready to use. Start creating your first technique sheet.
      </p>

      <div className="bg-muted/50 p-4 rounded-lg max-w-sm mx-auto mb-8">
        <h4 className="font-medium mb-2">Your Configuration:</h4>
        <div className="text-sm text-muted-foreground space-y-1 text-left">
          <p><span className="text-foreground">Language:</span> {wizardData.selectedLanguage === 'en' ? 'English' : wizardData.selectedLanguage}</p>
          <p><span className="text-foreground">Units:</span> {wizardData.selectedUnits === 'metric' ? 'Metric (mm)' : 'Imperial (inch)'}</p>
          <p><span className="text-foreground">Default Standard:</span> {wizardData.defaultStandard}</p>
          {wizardData.organizationName && (
            <p><span className="text-foreground">Organization:</span> {wizardData.organizationName}</p>
          )}
        </div>
      </div>

      <Button size="lg" onClick={handleComplete}>
        Start Using Scan-Master
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'license':
        return <LicenseStep />;
      case 'configuration':
        return <ConfigurationStep />;
      case 'tutorial':
        return <TutorialStep />;
      case 'complete':
        return <CompleteStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Progress Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <button
                  onClick={() => index <= currentStepIndex && goToStep(step)}
                  className={cn(
                    'flex items-center gap-1.5 text-sm transition-colors',
                    index <= currentStepIndex
                      ? 'text-primary cursor-pointer'
                      : 'text-muted-foreground cursor-not-allowed'
                  )}
                  disabled={index > currentStepIndex}
                >
                  <div className={cn(
                    'p-1.5 rounded-full transition-colors',
                    index < currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStepIndex
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                  )}>
                    {stepInfo[step].icon}
                  </div>
                  <span className="hidden sm:inline">{stepInfo[step].title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors',
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step Content */}
        <div className="p-6">
          {renderStep()}
        </div>

        {/* Skip Button */}
        {currentStep !== 'complete' && (
          <div className="p-4 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Skip Setup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FirstRunWizard;
