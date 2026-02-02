// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Check, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Standard {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  category: string;
  is_free: boolean;
  price_one_time: number;
  price_monthly: number;
  price_annual: number;
  is_active: boolean;
}

export default function Standards() {
  const navigate = useNavigate();
  const [standards, setStandards] = useState<Standard[]>([]);
  const [userStandards, setUserStandards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processingStandard, setProcessingStandard] = useState<string | null>(null);

  useEffect(() => {
    loadStandards();
  }, []);

  const loadStandards = async () => {
    try {
      setLoading(true);

      // Load all standards
      const { data: standardsData, error: standardsError } = await supabase
        .from('standards')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (standardsError) throw standardsError;
      setStandards(standardsData || []);

      // Load user's standards
      const { data: userStandardsData } = await supabase.functions.invoke('get-user-standards');
      
      if (userStandardsData?.standards) {
        const userStandardIds = new Set<string>(
          userStandardsData.standards.map((access: any) => access.standard_id as string)
        );
        setUserStandards(userStandardIds);
      }
    } catch (error) {
      console.error('Error loading standards:', error);
      toast.error('Error loading standards');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (standardId: string, priceType: 'one_time' | 'monthly' | 'annual') => {
    try {
      setProcessingStandard(standardId);

      // Validate UUID format before sending to edge function
      const { validateUUID, validatePriceType } = await import('@/lib/inputValidation');
      
      const uuidValidation = validateUUID(standardId);
      if (!uuidValidation.valid) {
        toast.error(uuidValidation.error || 'Invalid standard ID');
        setProcessingStandard(null);
        return;
      }

      const priceValidation = validatePriceType(priceType);
      if (!priceValidation.valid) {
        toast.error(priceValidation.error || 'Invalid price type');
        setProcessingStandard(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-lemon-squeezy-checkout', {
        body: { standardId, priceType },
      });

      if (error) throw error;

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No payment link received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Error creating payment');
      setProcessingStandard(null);
    }
  };

  const handleSelectStandard = (standardCode: string) => {
    navigate('/', { state: { selectedStandard: standardCode } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedStandards = standards.reduce((acc, standard) => {
    if (!acc[standard.category]) {
      acc[standard.category] = [];
    }
    acc[standard.category].push(standard);
    return acc;
  }, {} as Record<string, Standard[]>);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-3xl font-bold mb-2">Standards Catalog</h1>
        <p className="text-muted-foreground">Select and purchase standards for use in the system</p>
      </div>

      {Object.entries(groupedStandards).map(([category, categoryStandards]) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryStandards.map((standard) => {
              const hasAccess = standard.is_free || userStandards.has(standard.id);
              const isProcessing = processingStandard === standard.id;

              return (
                <Card key={standard.id} className="relative">
                  {hasAccess && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="default" className="bg-success">
                        <Check className="h-3 w-3 mr-1" />
                        Open
                      </Badge>
                    </div>
                  )}
                  {!hasAccess && !standard.is_free && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    </div>
                  )}
                  {standard.is_free && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-primary/10">
                        Free
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle>{standard.code}</CardTitle>
                    <CardDescription>{standard.name}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {standard.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Version: {standard.version}
                    </p>

                    {!hasAccess && !standard.is_free && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">One-time purchase:</span>
                          <span className="font-semibold">${standard.price_one_time}</span>
                        </div>
                        {standard.price_monthly && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Monthly subscription:</span>
                            <span className="font-semibold">${standard.price_monthly}/month</span>
                          </div>
                        )}
                        {standard.price_annual && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Annual subscription:</span>
                            <span className="font-semibold">${standard.price_annual}/year</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2">
                    {hasAccess ? (
                      <Button 
                        className="w-full" 
                        onClick={() => handleSelectStandard(standard.code)}
                      >
                        Select This Standard
                      </Button>
                    ) : standard.is_free ? (
                      <Button 
                        className="w-full" 
                        onClick={() => handleSelectStandard(standard.code)}
                      >
                        Start Using
                      </Button>
                    ) : (
                      <>
                        <Button 
                          className="w-full" 
                          onClick={() => handlePurchase(standard.id, 'one_time')}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            `Purchase for $${standard.price_one_time}`
                          )}
                        </Button>
                        {standard.price_monthly && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handlePurchase(standard.id, 'monthly')}
                            disabled={isProcessing}
                          >
                            Monthly Subscription - ${standard.price_monthly}/month
                          </Button>
                        )}
                        {standard.price_annual && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handlePurchase(standard.id, 'annual')}
                            disabled={isProcessing}
                          >
                            Annual Subscription - ${standard.price_annual}/year
                          </Button>
                        )}
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
