import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useLicense } from '@/contexts/LicenseContext';

export const LicenseActivationScreen = () => {
  const { activateLicense, license } = useLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await activateLicense(licenseKey);

      if (result.success) {
        setSuccess(true);
        setError(null);
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(result.error || 'License activation failed');
        setSuccess(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleActivate();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Key className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Activate Scan Master</CardTitle>
          <CardDescription className="text-center">
            Enter your license key to activate the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license-key">License Key</Label>
            <Input
              id="license-key"
              placeholder="SM-FAC-XXXXXX-XXXXXXXX-XXXXXXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading || success}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Enter the license key provided by Scan Master
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                License activated successfully! Reloading...
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Don't have a license key?</strong>
              <br />
              Contact Scan Master sales: sales@scanmaster.com
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleActivate}
            disabled={loading || success || !licenseKey.trim()}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {success ? 'Activated!' : 'Activate License'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export const LicenseInfo = () => {
  const { license, getStandards } = useLicense();

  if (!license || !license.valid) {
    return null;
  }

  const standards = getStandards().filter(s => s.isPurchased);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>License Information</CardTitle>
        <CardDescription>Your Scan Master license details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Factory ID</Label>
            <p className="text-sm font-mono">{license.factoryId}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Factory Name</Label>
            <p className="text-sm">{license.factoryName}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">License Type</Label>
            <p className="text-sm">
              {license.isLifetime ? (
                <span className="text-green-600 font-semibold">Lifetime</span>
              ) : (
                <span>Expires: {license.expiryDate}</span>
              )}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Activated</Label>
            <p className="text-sm">
              {license.activatedAt ? new Date(license.activatedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Purchased Standards</Label>
          <div className="flex flex-wrap gap-2">
            {standards.map((std) => (
              <div
                key={std.code}
                className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium"
              >
                {std.shortCode}: {std.name}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
