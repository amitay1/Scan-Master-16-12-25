import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logError } from '@/lib/logger';

interface UserStandard {
  id: string;
  access_type: string;
  purchase_date: string;
  expiry_date: string | null;
  is_active: boolean;
  standards: {
    code: string;
    name: string;
    description: string;
    version: string;
    category: string;
  };
}

export default function MyStandards() {
  const navigate = useNavigate();
  const [standards, setStandards] = useState<UserStandard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyStandards();
  }, []);

  const loadMyStandards = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('get-user-standards');

      if (error) throw error;

      setStandards(data.standards || []);
    } catch (error) {
      logError('Error loading my standards', error);
      toast.error('Error loading your standards');
    } finally {
      setLoading(false);
    }
  };

  const getAccessTypeBadge = (accessType: string) => {
    const types = {
      free: { label: 'Free', variant: 'outline' as const },
      purchased: { label: 'Purchased', variant: 'default' as const },
      trial: { label: 'Trial Period', variant: 'secondary' as const },
      subscription: { label: 'Subscription', variant: 'default' as const },
    };

    const type = types[accessType as keyof typeof types] || { label: accessType, variant: 'outline' as const };
    return <Badge variant={type.variant}>{type.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (standards.length === 0) {
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
          <h1 className="text-3xl font-bold mb-2">My Standards</h1>
          <p className="text-muted-foreground">Here you will see all the standards you purchased</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Standards Purchased Yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Go to the standards catalog to purchase additional standards
            </p>
            <Button onClick={() => window.location.href = '/standards'}>
              Go to Catalog
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold mb-2">My Standards</h1>
        <p className="text-muted-foreground">
          You have access to {standards.length} {standards.length === 1 ? 'standard' : 'standards'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {standards.map((standard) => (
          <Card key={standard.id}>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle>{standard.standards.code}</CardTitle>
                {getAccessTypeBadge(standard.access_type)}
              </div>
              <CardDescription>{standard.standards.name}</CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {standard.standards.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Purchased:</span>
                  <span>
                    {format(new Date(standard.purchase_date), 'dd/MM/yyyy')}
                  </span>
                </div>

                {standard.expiry_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Valid until:</span>
                    <span>
                      {format(new Date(standard.expiry_date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}

                {!standard.expiry_date && standard.access_type === 'purchased' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-success font-medium">Lifetime Access</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Category: {standard.standards.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  Version: {standard.standards.version}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
