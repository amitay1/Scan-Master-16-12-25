import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  isActive: boolean;
  maxUsers: number;
  maxSheets: number;
  settings: any;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<Organization>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  getUserRole: () => string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider = ({ children }: OrganizationProviderProps) => {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Load user's organizations
  useEffect(() => {
    if (!user) {
      setCurrentOrg(null);
      setOrganizations([]);
      setLoading(false);
      return;
    }

    const loadOrganizations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user's organizations from the API
        const response = await fetch('/api/organizations', {
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load organizations');
        }

        const orgs = await response.json();
        setOrganizations(orgs);

        // Set current org from localStorage or first org
        const savedOrgId = localStorage.getItem('currentOrgId');
        const defaultOrg = orgs.find((org: Organization) => org.id === savedOrgId) || orgs[0];
        
        if (defaultOrg) {
          setCurrentOrg(defaultOrg);
          localStorage.setItem('currentOrgId', defaultOrg.id);
          
          // Get user's role in this org
          const roleResponse = await fetch(`/api/organizations/${defaultOrg.id}/role`, {
            headers: {
              'x-user-id': user.id,
            },
          });
          
          if (roleResponse.ok) {
            const { role } = await roleResponse.json();
            setUserRole(role);
          }
        }
      } catch (err) {
        console.error('Error loading organizations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load organizations');
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, [user]);

  const switchOrganization = async (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (!org) {
      throw new Error('Organization not found');
    }

    setCurrentOrg(org);
    localStorage.setItem('currentOrgId', orgId);

    // Get user's role in new org
    if (user) {
      const roleResponse = await fetch(`/api/organizations/${orgId}/role`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (roleResponse.ok) {
        const { role } = await roleResponse.json();
        setUserRole(role);
      }
    }
  };

  const createOrganization = async (name: string, slug: string): Promise<Organization> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify({ name, slug }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create organization');
    }

    const newOrg = await response.json();
    setOrganizations([...organizations, newOrg]);
    await switchOrganization(newOrg.id);
    return newOrg;
  };

  const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`/api/organizations/${orgId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update organization');
    }

    const updatedOrg = await response.json();
    
    // Update local state
    setOrganizations(orgs => 
      orgs.map(org => org.id === orgId ? updatedOrg : org)
    );
    
    if (currentOrg?.id === orgId) {
      setCurrentOrg(updatedOrg);
    }
  };

  const getUserRole = () => userRole;

  const value: OrganizationContextType = {
    currentOrg,
    organizations,
    loading,
    error,
    switchOrganization,
    createOrganization,
    updateOrganization,
    getUserRole,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};