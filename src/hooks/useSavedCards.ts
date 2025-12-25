import { useContext } from 'react';
import { SavedCardsContext, SavedCardsContextType } from '@/contexts/SavedCardsContext';

export function useSavedCards(): SavedCardsContextType {
  const context = useContext(SavedCardsContext);
  if (!context) {
    throw new Error('useSavedCards must be used within a SavedCardsProvider');
  }
  return context;
}
