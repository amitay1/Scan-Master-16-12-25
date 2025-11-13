import { supabase } from '@/integrations/supabase/client';
import { TechniqueSheet } from '@/types/techniqueSheet';

export interface TechniqueSheetRecord {
  id: string;
  user_id: string;
  sheet_name: string;
  standard: string | null;
  data: any; // Using any to handle Json type from Supabase
  created_at: string;
  updated_at: string;
  created_by: string | null;
  modified_by: string | null;
  status: string | null;
}

export const techniqueSheetService = {
  // Save or update a technique sheet
  async saveTechniqueSheet(
    sheetName: string,
    data: TechniqueSheet,
    sheetId?: string
  ): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const userName = profile?.full_name || user.email || 'Unknown';

      if (sheetId) {
        // Update existing sheet
        const { error } = await supabase
          .from('technique_sheets')
          .update({
            sheet_name: sheetName,
            standard: data.standardName || '',
            data: data as any,
            modified_by: userName,
          })
          .eq('id', sheetId)
          .eq('user_id', user.id);

        if (error) throw error;
        return { success: true, id: sheetId };
      } else {
        // Insert new sheet
        const { data: newSheet, error } = await supabase
          .from('technique_sheets')
          .insert({
            user_id: user.id,
            sheet_name: sheetName,
            standard: data.standardName || '',
            data: data as any,
            created_by: userName,
            modified_by: userName,
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, id: newSheet.id };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Load all technique sheets for current user
  async loadTechniqueSheets(): Promise<{ success: boolean; sheets?: TechniqueSheetRecord[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('technique_sheets')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { success: true, sheets: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Load a specific technique sheet
  async loadTechniqueSheet(sheetId: string): Promise<{ success: boolean; sheet?: TechniqueSheetRecord; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('technique_sheets')
        .select('*')
        .eq('id', sheetId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { success: true, sheet: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Delete a technique sheet
  async deleteTechniqueSheet(sheetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('technique_sheets')
        .delete()
        .eq('id', sheetId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
