/**
 * Saved Cards Context
 * Manages saving, loading, and organizing technique/report cards
 */

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
} from '@/types/techniqueSheet';

// Generate UUID using native crypto API
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ============================================================================
// TYPES
// ============================================================================

export interface SavedCard {
  id: string;
  name: string;
  description?: string;
  type: 'technique' | 'report';
  standard: StandardType;
  createdAt: string;
  updatedAt: string;
  completionPercent: number;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  
  // Split mode data
  isSplitMode: boolean;
  
  // Part A data (or single part if not split)
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  
  // Part B data (only if split mode)
  inspectionSetupB?: InspectionSetupData;
  equipmentB?: EquipmentData;
  calibrationB?: CalibrationData;
  scanParametersB?: ScanParametersData;
  acceptanceCriteriaB?: AcceptanceCriteriaData;
  documentationB?: DocumentationData;
  
  // Additional metadata
  partDiagram?: string;
  lastEditedSection?: string;
}

export interface SavedCardsFilter {
  type?: 'technique' | 'report' | 'all';
  searchQuery?: string;
  tags?: string[];
  showArchived?: boolean;
  showFavoritesOnly?: boolean;
  sortBy?: 'name' | 'updatedAt' | 'createdAt' | 'completionPercent';
  sortOrder?: 'asc' | 'desc';
}

export interface SavedCardsContextType {
  // State
  cards: SavedCard[];
  isLoading: boolean;
  
  // CRUD operations
  saveCard: (card: Omit<SavedCard, 'id' | 'createdAt' | 'updatedAt'>) => SavedCard;
  updateCard: (id: string, updates: Partial<SavedCard>) => void;
  deleteCard: (id: string) => void;
  duplicateCard: (id: string, newName?: string) => SavedCard | null;
  
  // Load/Get
  getCard: (id: string) => SavedCard | undefined;
  getFilteredCards: (filter?: SavedCardsFilter) => SavedCard[];
  
  // Favorites & Archive
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
  
  // Tags
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  getAllTags: () => string[];
  
  // Import/Export
  exportCard: (id: string) => string | null;
  exportAllCards: () => string;
  importCards: (json: string) => number;
  
  // Auto-save
  autoSaveCard: (id: string | null, cardData: Omit<SavedCard, 'id' | 'createdAt' | 'updatedAt'>) => string;
  
  // Recent cards
  getRecentCards: (limit?: number) => SavedCard[];
}

// ============================================================================
// CONTEXT
// ============================================================================

export const SavedCardsContext = createContext<SavedCardsContextType | undefined>(undefined);

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEY = 'scanmaster_saved_cards';
const AUTO_SAVE_KEY = 'scanmaster_autosave';

// ============================================================================
// PROVIDER
// ============================================================================

export function SavedCardsProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cards from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCards(parsed);
      }
    } catch (error) {
      console.error('Failed to load saved cards:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cards to localStorage when they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      } catch (error) {
        console.error('Failed to save cards:', error);
      }
    }
  }, [cards, isLoading]);

  // Save a new card
  const saveCard = useCallback((cardData: Omit<SavedCard, 'id' | 'createdAt' | 'updatedAt'>): SavedCard => {
    const now = new Date().toISOString();
    const newCard: SavedCard = {
      ...cardData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    
    setCards(prev => [newCard, ...prev]);
    return newCard;
  }, []);

  // Update existing card
  const updateCard = useCallback((id: string, updates: Partial<SavedCard>) => {
    setCards(prev => prev.map(card => 
      card.id === id 
        ? { ...card, ...updates, updatedAt: new Date().toISOString() }
        : card
    ));
  }, []);

  // Delete a card
  const deleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  }, []);

  // Duplicate a card
  const duplicateCard = useCallback((id: string, newName?: string): SavedCard | null => {
    const original = cards.find(c => c.id === id);
    if (!original) return null;
    
    const now = new Date().toISOString();
    const duplicated: SavedCard = {
      ...original,
      id: generateId(),
      name: newName || `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
    };
    
    setCards(prev => [duplicated, ...prev]);
    return duplicated;
  }, [cards]);

  // Get single card
  const getCard = useCallback((id: string): SavedCard | undefined => {
    return cards.find(c => c.id === id);
  }, [cards]);

  // Get filtered cards
  const getFilteredCards = useCallback((filter?: SavedCardsFilter): SavedCard[] => {
    let result = [...cards];
    
    if (filter) {
      // Filter by type
      if (filter.type && filter.type !== 'all') {
        result = result.filter(c => c.type === filter.type);
      }
      
      // Filter by search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        result = result.filter(c => 
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.tags.some(t => t.toLowerCase().includes(query))
        );
      }
      
      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        result = result.filter(c => 
          filter.tags!.some(t => c.tags.includes(t))
        );
      }
      
      // Filter archived
      if (!filter.showArchived) {
        result = result.filter(c => !c.isArchived);
      }
      
      // Filter favorites
      if (filter.showFavoritesOnly) {
        result = result.filter(c => c.isFavorite);
      }
      
      // Sort
      const sortBy = filter.sortBy || 'updatedAt';
      const sortOrder = filter.sortOrder || 'desc';
      
      result.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'updatedAt':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
          case 'completionPercent':
            comparison = a.completionPercent - b.completionPercent;
            break;
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    return result;
  }, [cards]);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setCards(prev => prev.map(card =>
      card.id === id ? { ...card, isFavorite: !card.isFavorite } : card
    ));
  }, []);

  // Toggle archive
  const toggleArchive = useCallback((id: string) => {
    setCards(prev => prev.map(card =>
      card.id === id ? { ...card, isArchived: !card.isArchived } : card
    ));
  }, []);

  // Add tag
  const addTag = useCallback((id: string, tag: string) => {
    setCards(prev => prev.map(card =>
      card.id === id && !card.tags.includes(tag)
        ? { ...card, tags: [...card.tags, tag], updatedAt: new Date().toISOString() }
        : card
    ));
  }, []);

  // Remove tag
  const removeTag = useCallback((id: string, tag: string) => {
    setCards(prev => prev.map(card =>
      card.id === id
        ? { ...card, tags: card.tags.filter(t => t !== tag), updatedAt: new Date().toISOString() }
        : card
    ));
  }, []);

  // Get all unique tags
  const getAllTags = useCallback((): string[] => {
    const allTags = cards.flatMap(c => c.tags);
    return [...new Set(allTags)].sort();
  }, [cards]);

  // Export single card
  const exportCard = useCallback((id: string): string | null => {
    const card = cards.find(c => c.id === id);
    if (!card) return null;
    return JSON.stringify(card, null, 2);
  }, [cards]);

  // Export all cards
  const exportAllCards = useCallback((): string => {
    return JSON.stringify(cards, null, 2);
  }, [cards]);

  // Import cards - supports both local SavedCard format and server TechniqueSheetRecord format
  const importCards = useCallback((json: string): number => {
    try {
      const imported = JSON.parse(json);
      const cardsToImport = Array.isArray(imported) ? imported : [imported];
      const now = new Date().toISOString();

      const newCards: SavedCard[] = [];

      for (const item of cardsToImport) {
        if (typeof item !== 'object' || item === null) continue;

        // Check if it's already a SavedCard format (local export)
        if ('name' in item && 'type' in item && 'inspectionSetup' in item) {
          newCards.push({
            ...item,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
          });
        }
        // Check if it's a TechniqueSheetRecord format (server export)
        else if ('sheetName' in item && 'data' in item && typeof item.data === 'object') {
          const data = item.data;
          newCards.push({
            id: generateId(),
            name: item.sheetName || 'Imported Card',
            description: '',
            type: data.reportMode === 'Report' ? 'report' : 'technique',
            standard: (item.standard || data.standard || 'AMS-STD-2154E') as StandardType,
            createdAt: now,
            updatedAt: now,
            completionPercent: 0,
            tags: [],
            isFavorite: false,
            isArchived: false,
            isSplitMode: data.isSplitMode || false,
            inspectionSetup: data.partA?.inspectionSetup || {},
            equipment: data.partA?.equipment || {},
            calibration: data.partA?.calibration || {},
            scanParameters: data.partA?.scanParameters || {},
            acceptanceCriteria: data.partA?.acceptanceCriteria || {},
            documentation: data.partA?.documentation || {},
            inspectionSetupB: data.partB?.inspectionSetup,
            equipmentB: data.partB?.equipment,
            calibrationB: data.partB?.calibration,
            scanParametersB: data.partB?.scanParameters,
            acceptanceCriteriaB: data.partB?.acceptanceCriteria,
            documentationB: data.partB?.documentation,
          } as SavedCard);
        }
      }

      if (newCards.length === 0) {
        console.warn('No valid cards found in import. Expected format: SavedCard or TechniqueSheetRecord');
        return 0;
      }

      setCards(prev => [...newCards, ...prev]);
      return newCards.length;
    } catch (error) {
      console.error('Failed to import cards:', error);
      return 0;
    }
  }, []);

  // Auto-save (creates or updates based on existing ID)
  const autoSaveCard = useCallback((id: string | null, cardData: Omit<SavedCard, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const now = new Date().toISOString();
    
    if (id) {
      // Update existing card
      const existing = cards.find(c => c.id === id);
      if (existing) {
        updateCard(id, cardData);
        return id;
      }
    }
    
    // Create new card
    const newCard = saveCard(cardData);
    return newCard.id;
  }, [cards, saveCard, updateCard]);

  // Get recent cards
  const getRecentCards = useCallback((limit: number = 5): SavedCard[] => {
    return [...cards]
      .filter(c => !c.isArchived)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [cards]);

  return (
    <SavedCardsContext.Provider
      value={{
        cards,
        isLoading,
        saveCard,
        updateCard,
        deleteCard,
        duplicateCard,
        getCard,
        getFilteredCards,
        toggleFavorite,
        toggleArchive,
        addTag,
        removeTag,
        getAllTags,
        exportCard,
        exportAllCards,
        importCards,
        autoSaveCard,
        getRecentCards,
      }}
    >
      {children}
    </SavedCardsContext.Provider>
  );
}
