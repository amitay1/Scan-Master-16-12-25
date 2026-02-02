import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { logError, logInfo } from "@/lib/logger";
import type { StandardType } from "@/types/techniqueSheet";
import type { SavedCard } from "@/contexts/SavedCardsContext";
import { useSavedCards } from "@/hooks/useSavedCards";
import { techniqueSheetService } from "@/services/techniqueSheetService";
import type { TechniqueSheetRecord, TechniqueSheetCardData } from "@/services/techniqueSheetService";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { CurrentPartData } from "@/hooks/useTechniqueSheetState";

interface UseSheetPersistenceParams {
  user: { id: string } | null;
  standard: StandardType;
  isSplitMode: boolean;
  activePart: "A" | "B";
  reportMode: "Technique" | "Report";
  completionPercent: number;
  currentData: CurrentPartData;
  // Data builders from useTechniqueSheetState
  buildTechniqueSheetPayload: () => TechniqueSheetCardData;
  buildCardData: () => any;
  applyLoadedSheet: (record: TechniqueSheetRecord) => void;
  applyLocalCard: (data: any) => void;
  // Raw Part B state for local save metadata
  inspectionSetupB: any;
  equipmentB: any;
  calibrationB: any;
  scanParametersB: any;
  acceptanceCriteriaB: any;
  documentationB: any;
}

export function useSheetPersistence({
  user,
  standard,
  isSplitMode,
  activePart,
  reportMode,
  completionPercent,
  currentData,
  buildTechniqueSheetPayload,
  buildCardData,
  applyLoadedSheet,
  applyLocalCard,
  inspectionSetupB,
  equipmentB,
  calibrationB,
  scanParametersB,
  acceptanceCriteriaB,
  documentationB,
}: UseSheetPersistenceParams) {
  const { saveCard, updateCard, getCard } = useSavedCards();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [savedSheets, setSavedSheets] = useState<TechniqueSheetRecord[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavedCardsDialogOpen, setIsSavedCardsDialogOpen] = useState(false);
  const [sheetNameInput, setSheetNameInput] = useState("");
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [currentSheetName, setCurrentSheetName] = useState("");
  const [currentLocalCardId, setCurrentLocalCardId] = useState<string | null>(null);

  const [isSavingSheet, setIsSavingSheet] = useState(false);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [loadingSheetId, setLoadingSheetId] = useState<string | null>(null);
  const [deletingSheetId, setDeletingSheetId] = useState<string | null>(null);

  // ── Organization loading ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadOrganizations = async () => {
      try {
        const organizations = await techniqueSheetService.fetchOrganizations(user.id);
        if (cancelled) return;
        if (organizations.length > 0) {
          setOrganizationId(organizations[0].id);
        } else {
          setOrganizationId(null);
          console.log("No organizations available - auto-save to database is disabled.");
        }
      } catch (error) {
        if (!cancelled) {
          logError("Failed to load organizations", error);
          toast.error("Unable to load workspace information. Saving is temporarily unavailable.");
        }
      }
    };
    loadOrganizations();
    return () => { cancelled = true; };
  }, [user]);

  // ── Refresh saved sheets ──────────────────────────────────────────────
  const refreshSavedSheets = useCallback(async () => {
    if (!user || !organizationId) return;
    setIsLoadingSheets(true);
    try {
      const sheets = await techniqueSheetService.loadTechniqueSheets(user.id, organizationId);
      const sorted = [...sheets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setSavedSheets(sorted);
    } catch (error) {
      logError("Failed to load saved technique cards", error);
      toast.error("Unable to load saved cards.");
    } finally {
      setIsLoadingSheets(false);
    }
  }, [user, organizationId]);

  // ── Load when dialog opens ─────────────────────────────────────────────
  useEffect(() => {
    if (!isSavedCardsDialogOpen || !user || !organizationId) return;
    refreshSavedSheets();
  }, [isSavedCardsDialogOpen, user, organizationId, refreshSavedSheets]);

  // ── Handle opening saved cards dialog ──────────────────────────────────
  const handleOpenSavedCards = useCallback(() => {
    if (!user) {
      toast.error("You must be signed in to manage saved cards.");
      return;
    }
    if (!organizationId) {
      toast.error("Workspace is not ready yet. Please try again in a moment.");
      return;
    }
    setIsSavedCardsDialogOpen(true);
  }, [user, organizationId]);

  // ── Load a sheet from DB ──────────────────────────────────────────────
  const handleLoadSheet = useCallback(async (sheetId: string) => {
    if (!user || !organizationId) return;
    setLoadingSheetId(sheetId);
    try {
      const sheet = await techniqueSheetService.loadTechniqueSheet({
        sheetId,
        userId: user.id,
        orgId: organizationId,
      });
      applyLoadedSheet(sheet);
      setCurrentSheetId(sheet.id);
      setCurrentSheetName(sheet.sheetName);
      setSheetNameInput(sheet.sheetName);
      setIsSavedCardsDialogOpen(false);
      toast.success(`Loaded card "${sheet.sheetName}"`);
    } catch (error) {
      logError("Failed to load technique card", error);
      toast.error("Unable to load the selected card.");
    } finally {
      setLoadingSheetId(null);
    }
  }, [user, organizationId, applyLoadedSheet]);

  // ── Delete a sheet from DB ─────────────────────────────────────────────
  const handleDeleteSheet = useCallback(async (sheetId: string) => {
    if (!user || !organizationId) return;
    if (!confirm("Delete this saved card? This action cannot be undone.")) return;
    setDeletingSheetId(sheetId);
    try {
      await techniqueSheetService.deleteTechniqueSheet(sheetId, user.id, organizationId);
      if (currentSheetId === sheetId) {
        setCurrentSheetId(null);
        setCurrentSheetName("");
      }
      await refreshSavedSheets();
      toast.success("Card deleted.");
    } catch (error) {
      logError("Failed to delete technique card", error);
      toast.error("Unable to delete the selected card.");
    } finally {
      setDeletingSheetId(null);
    }
  }, [user, organizationId, currentSheetId, refreshSavedSheets]);

  // ── Perform DB save ────────────────────────────────────────────────────
  const performSave = useCallback(async (name: string, sheetId?: string) => {
    if (!user || !organizationId) {
      toast.error("You must be signed in to save.");
      return;
    }
    setIsSavingSheet(true);
    try {
      const payload = buildTechniqueSheetPayload();
      const saved = await techniqueSheetService.saveTechniqueSheet({
        sheetId,
        sheetName: name.trim(),
        standard,
        data: payload,
        userId: user.id,
        orgId: organizationId,
      });
      setCurrentSheetId(saved.id);
      setCurrentSheetName(saved.sheetName);
      setSheetNameInput(saved.sheetName);
      setIsSaveDialogOpen(false);
      await refreshSavedSheets();
      toast.success(sheetId ? "Technique card updated." : "Technique card saved.");
    } catch (error) {
      logError("Failed to save technique card", error);
      toast.error("Unable to save the technique card.");
    } finally {
      setIsSavingSheet(false);
    }
  }, [user, organizationId, standard, buildTechniqueSheetPayload, refreshSavedSheets]);

  // ── Local save (localStorage via SavedCards context) ───────────────────
  const performLocalSave = useCallback((name: string) => {
    const cardData = buildCardData();
    const savedCard = saveCard({
      name,
      description: `${currentData.inspectionSetup.partName || ""} - ${standard}`,
      type: reportMode === "Report" ? "report" : "technique",
      standard,
      completionPercent,
      tags: [],
      isFavorite: false,
      isArchived: false,
      isSplitMode,
      inspectionSetup: currentData.inspectionSetup,
      equipment: currentData.equipment,
      calibration: currentData.calibration,
      scanParameters: currentData.scanParameters,
      acceptanceCriteria: currentData.acceptanceCriteria,
      documentation: currentData.documentation,
      inspectionSetupB: isSplitMode ? inspectionSetupB : undefined,
      equipmentB: isSplitMode ? equipmentB : undefined,
      calibrationB: isSplitMode ? calibrationB : undefined,
      scanParametersB: isSplitMode ? scanParametersB : undefined,
      acceptanceCriteriaB: isSplitMode ? acceptanceCriteriaB : undefined,
      documentationB: isSplitMode ? documentationB : undefined,
      data: cardData,
    } as any);
    setCurrentLocalCardId(savedCard.id);
    setCurrentSheetName(name);
    toast.success(`Card "${name}" saved successfully!`);
    setIsSaveDialogOpen(false);
  }, [
    buildCardData, saveCard, currentData, standard, reportMode, completionPercent,
    isSplitMode, inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB,
  ]);

  // ── Save dialog confirm ────────────────────────────────────────────────
  const handleSaveDialogConfirm = useCallback(() => {
    const trimmedName = sheetNameInput.trim();
    if (!trimmedName) {
      toast.error("Please enter a name for the card.");
      return;
    }
    performLocalSave(trimmedName);
  }, [sheetNameInput, performLocalSave]);

  // ── handleSave (Ctrl+S / toolbar) ─────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (isSavingSheet) return;
    const cardData = buildCardData();

    if (currentLocalCardId) {
      const existingCard = getCard(currentLocalCardId);
      if (existingCard) {
        updateCard(currentLocalCardId, {
          data: cardData,
          completionPercent,
          standard,
        } as any);
        toast.success(`Card "${existingCard.name}" updated successfully!`);
        return;
      }
    }

    const suggestedName =
      currentData.inspectionSetup.partName ||
      currentData.inspectionSetup.partNumber ||
      `Technique Card ${new Date().toLocaleDateString("he-IL")}`;
    setSheetNameInput(suggestedName);
    setIsSaveDialogOpen(true);
  }, [isSavingSheet, buildCardData, currentLocalCardId, getCard, updateCard, completionPercent, standard, currentData]);

  // ── Handle loading local card ──────────────────────────────────────────
  const handleLoadLocalCard = useCallback((card: SavedCard) => {
    const data = (card as any).data;
    if (!data) {
      toast.error("Saved card is missing data.");
      return;
    }
    setCurrentLocalCardId(card.id);
    setCurrentSheetName(card.name);
    applyLocalCard(data);
    toast.success(`Loaded card: ${card.name}`);
  }, [applyLocalCard]);

  // ── Auto-save hook ─────────────────────────────────────────────────────
  const autoSaveData = useMemo(() => buildTechniqueSheetPayload(), [buildTechniqueSheetPayload]);

  const { status: autoSaveStatus, lastSaved, forceSave } = useAutoSave({
    data: autoSaveData,
    onSave: async (data) => {
      if (!user || !organizationId) {
        throw new Error("Not signed in or no organization");
      }
      const now = new Date();
      const autoName = currentSheetName || `Draft - ${standard} - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      const saved = await techniqueSheetService.saveTechniqueSheet({
        sheetId: currentSheetId || undefined,
        sheetName: autoName,
        standard,
        data,
        userId: user.id,
        orgId: organizationId,
      });
      if (!currentSheetId) {
        setCurrentSheetId(saved.id);
        setCurrentSheetName(saved.sheetName);
        setSheetNameInput(saved.sheetName);
      }
    },
    delay: 3000,
    enabled: false,
  });

  return {
    // Dialog state
    isSaveDialogOpen, setIsSaveDialogOpen,
    isSavedCardsDialogOpen, setIsSavedCardsDialogOpen,
    sheetNameInput, setSheetNameInput,
    currentSheetId, setCurrentSheetId,
    currentSheetName, setCurrentSheetName,
    currentLocalCardId, setCurrentLocalCardId,
    // Loading state
    isSavingSheet,
    isLoadingSheets,
    loadingSheetId,
    deletingSheetId,
    savedSheets,
    // Actions
    handleSave,
    handleOpenSavedCards,
    handleLoadSheet,
    handleDeleteSheet,
    handleSaveDialogConfirm,
    handleLoadLocalCard,
    performSave,
    performLocalSave,
    refreshSavedSheets,
    // Auto-save
    autoSaveStatus,
    lastSaved,
    forceSave,
  };
}
