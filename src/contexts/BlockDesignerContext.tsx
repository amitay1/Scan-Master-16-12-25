/**
 * Block Designer Context
 * State management for the custom calibration block designer
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import {
  BlockDesignerState,
  BlockDesignerActions,
  CustomBlockShape,
  BlockMaterial,
  DesignerHole,
  DesignerNotch,
  ViewMode,
  InteractionMode,
  ShapePreset,
  DEFAULT_BLOCK_SHAPE,
  SHAPE_PRESETS,
  generateHoleId,
  generateNotchId,
} from '@/types/blockDesigner.types';

// ==================== ACTION TYPES ====================

type BlockDesignerAction =
  | { type: 'SET_BLOCK_SHAPE'; payload: Partial<CustomBlockShape> }
  | { type: 'SET_BLOCK_MATERIAL'; payload: BlockMaterial }
  | { type: 'RESET_SHAPE' }
  | { type: 'LOAD_PRESET'; payload: ShapePreset }
  | { type: 'ADD_HOLE'; payload: Omit<DesignerHole, 'id'> }
  | { type: 'UPDATE_HOLE'; payload: { id: string; updates: Partial<DesignerHole> } }
  | { type: 'DELETE_HOLE'; payload: string }
  | { type: 'SELECT_HOLE'; payload: string | null }
  | { type: 'MOVE_HOLE'; payload: { id: string; position: { x: number; y: number; z: number } } }
  | { type: 'CLEAR_ALL_HOLES' }
  | { type: 'ADD_NOTCH'; payload: Omit<DesignerNotch, 'id'> }
  | { type: 'UPDATE_NOTCH'; payload: { id: string; updates: Partial<DesignerNotch> } }
  | { type: 'DELETE_NOTCH'; payload: string }
  | { type: 'SELECT_NOTCH'; payload: string | null }
  | { type: 'CLEAR_ALL_NOTCHES' }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_INTERACTION_MODE'; payload: InteractionMode }
  | { type: 'SET_PLACEMENT_MODE'; payload: 'fbh' | 'sdh' | 'notch' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_TO_HISTORY' };

// ==================== INITIAL STATE ====================

const initialState: BlockDesignerState = {
  blockShape: DEFAULT_BLOCK_SHAPE,
  blockMaterial: 'steel',
  holes: [],
  notches: [],
  selectedHoleId: null,
  selectedNotchId: null,
  viewMode: 'split',
  interactionMode: 'select',
  placementMode: 'fbh',
  undoStack: [],
  redoStack: [],
};

// ==================== REDUCER ====================

function blockDesignerReducer(
  state: BlockDesignerState,
  action: BlockDesignerAction
): BlockDesignerState {
  switch (action.type) {
    case 'SET_BLOCK_SHAPE':
      return {
        ...state,
        blockShape: { ...state.blockShape, ...action.payload },
      };

    case 'SET_BLOCK_MATERIAL':
      return {
        ...state,
        blockMaterial: action.payload,
      };

    case 'RESET_SHAPE':
      return {
        ...state,
        blockShape: DEFAULT_BLOCK_SHAPE,
        holes: [],
        notches: [],
        selectedHoleId: null,
        selectedNotchId: null,
      };

    case 'LOAD_PRESET': {
      const preset = SHAPE_PRESETS[action.payload];
      if (!preset) return state;
      return {
        ...state,
        blockShape: { ...preset.shape },
        holes: [],
        notches: [],
        selectedHoleId: null,
        selectedNotchId: null,
      };
    }

    case 'ADD_HOLE': {
      const newHole: DesignerHole = {
        ...action.payload,
        id: generateHoleId(),
      };
      return {
        ...state,
        holes: [...state.holes, newHole],
        selectedHoleId: newHole.id,
      };
    }

    case 'UPDATE_HOLE':
      return {
        ...state,
        holes: state.holes.map((hole) =>
          hole.id === action.payload.id ? { ...hole, ...action.payload.updates } : hole
        ),
      };

    case 'DELETE_HOLE':
      return {
        ...state,
        holes: state.holes.filter((hole) => hole.id !== action.payload),
        selectedHoleId: state.selectedHoleId === action.payload ? null : state.selectedHoleId,
      };

    case 'SELECT_HOLE':
      return {
        ...state,
        selectedHoleId: action.payload,
      };

    case 'MOVE_HOLE':
      return {
        ...state,
        holes: state.holes.map((hole) =>
          hole.id === action.payload.id ? { ...hole, position: action.payload.position } : hole
        ),
      };

    case 'CLEAR_ALL_HOLES':
      return {
        ...state,
        holes: [],
        selectedHoleId: null,
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
      };

    case 'SET_INTERACTION_MODE':
      return {
        ...state,
        interactionMode: action.payload,
      };

    case 'SET_PLACEMENT_MODE':
      return {
        ...state,
        placementMode: action.payload,
      };

    // Notch actions
    case 'ADD_NOTCH': {
      const newNotch: DesignerNotch = {
        ...action.payload,
        id: generateNotchId(),
      };
      return {
        ...state,
        notches: [...state.notches, newNotch],
        selectedNotchId: newNotch.id,
      };
    }

    case 'UPDATE_NOTCH':
      return {
        ...state,
        notches: state.notches.map((notch) =>
          notch.id === action.payload.id ? { ...notch, ...action.payload.updates } : notch
        ),
      };

    case 'DELETE_NOTCH':
      return {
        ...state,
        notches: state.notches.filter((notch) => notch.id !== action.payload),
        selectedNotchId: state.selectedNotchId === action.payload ? null : state.selectedNotchId,
      };

    case 'SELECT_NOTCH':
      return {
        ...state,
        selectedNotchId: action.payload,
        selectedHoleId: null, // Deselect hole when selecting notch
      };

    case 'CLEAR_ALL_NOTCHES':
      return {
        ...state,
        notches: [],
        selectedNotchId: null,
      };

    case 'SAVE_TO_HISTORY': {
      // Create a snapshot without the history stacks to avoid infinite nesting
      const snapshot: BlockDesignerState = {
        ...state,
        undoStack: [],
        redoStack: [],
      };
      return {
        ...state,
        undoStack: [...state.undoStack.slice(-19), snapshot], // Keep last 20 states
        redoStack: [],
      };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const previousState = state.undoStack[state.undoStack.length - 1];
      const currentSnapshot: BlockDesignerState = {
        ...state,
        undoStack: [],
        redoStack: [],
      };
      return {
        ...previousState,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, currentSnapshot],
      };
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const nextState = state.redoStack[state.redoStack.length - 1];
      const currentSnapshot: BlockDesignerState = {
        ...state,
        undoStack: [],
        redoStack: [],
      };
      return {
        ...nextState,
        undoStack: [...state.undoStack, currentSnapshot],
        redoStack: state.redoStack.slice(0, -1),
      };
    }

    default:
      return state;
  }
}

// ==================== CONTEXT ====================

interface BlockDesignerContextValue extends BlockDesignerState, BlockDesignerActions {}

const BlockDesignerContext = createContext<BlockDesignerContextValue | null>(null);

// ==================== PROVIDER ====================

export function BlockDesignerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(blockDesignerReducer, initialState);

  // Helper to save state before modifying
  const saveHistory = useCallback(() => {
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, []);

  // Shape actions
  const setBlockShape = useCallback(
    (shape: Partial<CustomBlockShape>) => {
      saveHistory();
      dispatch({ type: 'SET_BLOCK_SHAPE', payload: shape });
    },
    [saveHistory]
  );

  const setBlockMaterial = useCallback(
    (material: BlockMaterial) => {
      dispatch({ type: 'SET_BLOCK_MATERIAL', payload: material });
    },
    []
  );

  const resetShape = useCallback(() => {
    saveHistory();
    dispatch({ type: 'RESET_SHAPE' });
  }, [saveHistory]);

  const loadPreset = useCallback(
    (preset: ShapePreset) => {
      saveHistory();
      dispatch({ type: 'LOAD_PRESET', payload: preset });
    },
    [saveHistory]
  );

  // Hole actions
  const addHole = useCallback(
    (hole: Omit<DesignerHole, 'id'>) => {
      saveHistory();
      dispatch({ type: 'ADD_HOLE', payload: hole });
    },
    [saveHistory]
  );

  const updateHole = useCallback(
    (id: string, updates: Partial<DesignerHole>) => {
      saveHistory();
      dispatch({ type: 'UPDATE_HOLE', payload: { id, updates } });
    },
    [saveHistory]
  );

  const deleteHole = useCallback(
    (id: string) => {
      saveHistory();
      dispatch({ type: 'DELETE_HOLE', payload: id });
    },
    [saveHistory]
  );

  const selectHole = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_HOLE', payload: id });
  }, []);

  const moveHole = useCallback(
    (id: string, position: { x: number; y: number; z: number }) => {
      dispatch({ type: 'MOVE_HOLE', payload: { id, position } });
    },
    []
  );

  const clearAllHoles = useCallback(() => {
    saveHistory();
    dispatch({ type: 'CLEAR_ALL_HOLES' });
  }, [saveHistory]);

  // Notch actions
  const addNotch = useCallback(
    (notch: Omit<DesignerNotch, 'id'>) => {
      saveHistory();
      dispatch({ type: 'ADD_NOTCH', payload: notch });
    },
    [saveHistory]
  );

  const updateNotch = useCallback(
    (id: string, updates: Partial<DesignerNotch>) => {
      saveHistory();
      dispatch({ type: 'UPDATE_NOTCH', payload: { id, updates } });
    },
    [saveHistory]
  );

  const deleteNotch = useCallback(
    (id: string) => {
      saveHistory();
      dispatch({ type: 'DELETE_NOTCH', payload: id });
    },
    [saveHistory]
  );

  const selectNotch = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_NOTCH', payload: id });
  }, []);

  const clearAllNotches = useCallback(() => {
    saveHistory();
    dispatch({ type: 'CLEAR_ALL_NOTCHES' });
  }, [saveHistory]);

  // View actions
  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const setInteractionMode = useCallback((mode: InteractionMode) => {
    dispatch({ type: 'SET_INTERACTION_MODE', payload: mode });
  }, []);

  const setPlacementMode = useCallback((mode: 'fbh' | 'sdh' | 'notch') => {
    dispatch({ type: 'SET_PLACEMENT_MODE', payload: mode });
  }, []);

  // History actions
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const value = useMemo<BlockDesignerContextValue>(
    () => ({
      // State
      ...state,
      // Actions
      setBlockShape,
      setBlockMaterial,
      resetShape,
      loadPreset,
      addHole,
      updateHole,
      deleteHole,
      selectHole,
      moveHole,
      clearAllHoles,
      addNotch,
      updateNotch,
      deleteNotch,
      selectNotch,
      clearAllNotches,
      setViewMode,
      setInteractionMode,
      setPlacementMode,
      undo,
      redo,
      canUndo: state.undoStack.length > 0,
      canRedo: state.redoStack.length > 0,
    }),
    [
      state,
      setBlockShape,
      setBlockMaterial,
      resetShape,
      loadPreset,
      addHole,
      updateHole,
      deleteHole,
      selectHole,
      moveHole,
      clearAllHoles,
      addNotch,
      updateNotch,
      deleteNotch,
      selectNotch,
      clearAllNotches,
      setViewMode,
      setInteractionMode,
      setPlacementMode,
      undo,
      redo,
    ]
  );

  return <BlockDesignerContext.Provider value={value}>{children}</BlockDesignerContext.Provider>;
}

// ==================== HOOK ====================

export function useBlockDesigner(): BlockDesignerContextValue {
  const context = useContext(BlockDesignerContext);
  if (!context) {
    throw new Error('useBlockDesigner must be used within a BlockDesignerProvider');
  }
  return context;
}
