import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
} from "@/types/techniqueSheet";
import type { ScanDetailsData } from "@/types/scanDetails";
import type { InspectionReportData } from "@/types/inspectionReport";

const API_BASE = "/api/technique-sheets";

interface RequestOptions {
  path: string;
  method?: string;
  body?: unknown;
  userId: string;
  orgId?: string;
}

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  // Some environments mislabel JSON; attempt parse if it looks like JSON.
  const looksLikeJson = /^\s*[[{]/.test(rawText);
  const shouldTryJson = contentType.includes("application/json") || looksLikeJson;

  if (shouldTryJson) {
    try {
      // Empty JSON bodies are valid in some APIs; treat as undefined.
      if (!rawText.trim()) return undefined as T;
      return JSON.parse(rawText) as T;
    } catch {
      // Fall through to a descriptive error.
    }
  }

  const preview = rawText.trim().slice(0, 300);
  throw new Error(
    `Expected JSON response but got ${contentType || "unknown content-type"}. Body starts with: ${preview}`
  );
}

async function request<T>({ path, method = "GET", body, userId, orgId }: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    "x-user-id": userId,
  };

  if (orgId) {
    headers["x-org-id"] = orgId;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = await readJsonOrThrow<any>(response);
      if (typeof errorBody?.error === "string") {
        errorMessage = errorBody.error;
      }
      // Log details if available
      if (errorBody?.details) {
        console.error('Validation errors:', errorBody.details);
        // Include first error detail in message if available
        if (Array.isArray(errorBody.details) && errorBody.details.length > 0) {
          const firstError = errorBody.details[0];
          errorMessage += `: ${firstError.path?.join('.')} - ${firstError.message}`;
        }
      }
    } catch (error) {
      // Ignore parse errors - fallback to default message
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return readJsonOrThrow<T>(response);
}

export interface TechniqueSheetPartData {
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  scanDetails: ScanDetailsData;
}

export interface TechniqueSheetCardData {
  standard: StandardType;
  activeTab: string;
  reportMode: "Technique" | "Report";
  isSplitMode: boolean;
  activePart: "A" | "B";
  partA: TechniqueSheetPartData;
  partB: TechniqueSheetPartData;
  inspectionReport: InspectionReportData;
}

export interface TechniqueSheetRecord {
  id: string;
  userId: string;
  orgId: string | null;
  sheetName: string;
  standard: string | null;
  data: TechniqueSheetCardData;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  userRole?: string;
}

export interface SaveTechniqueSheetInput {
  sheetId?: string;
  sheetName: string;
  standard: StandardType;
  data: TechniqueSheetCardData;
  status?: string;
  userId: string;
  orgId: string;
}

export interface LoadTechniqueSheetParams {
  sheetId: string;
  userId: string;
  orgId: string;
}

const ensureOrgId = (orgId?: string): string => {
  if (!orgId) {
    throw new Error("Organization ID is required for this operation");
  }
  return orgId;
};

export const techniqueSheetService = {
  async fetchOrganizations(userId: string): Promise<OrganizationSummary[]> {
    return request<OrganizationSummary[]>({
      path: "/api/organizations",
      userId,
    });
  },

  async loadTechniqueSheets(userId: string, orgId: string): Promise<TechniqueSheetRecord[]> {
    return request<TechniqueSheetRecord[]>({
      path: API_BASE,
      userId,
      orgId: ensureOrgId(orgId),
    });
  },

  async loadTechniqueSheet({ sheetId, userId, orgId }: LoadTechniqueSheetParams): Promise<TechniqueSheetRecord> {
    return request<TechniqueSheetRecord>({
      path: `${API_BASE}/${sheetId}`,
      userId,
      orgId: ensureOrgId(orgId),
    });
  },

  async deleteTechniqueSheet(sheetId: string, userId: string, orgId: string): Promise<void> {
    await request<void>({
      path: `${API_BASE}/${sheetId}`,
      method: "DELETE",
      userId,
      orgId: ensureOrgId(orgId),
    });
  },

  async saveTechniqueSheet({ sheetId, sheetName, standard, data, status = "draft", userId, orgId }: SaveTechniqueSheetInput): Promise<TechniqueSheetRecord> {
    const payload = {
      sheetName,
      standard,
      data,
      status,
    };

    if (sheetId) {
      return request<TechniqueSheetRecord>({
        path: `${API_BASE}/${sheetId}`,
        method: "PATCH",
        body: payload,
        userId,
        orgId: ensureOrgId(orgId),
      });
    }

    return request<TechniqueSheetRecord>({
      path: API_BASE,
      method: "POST",
      body: payload,
      userId,
      orgId: ensureOrgId(orgId),
    });
  },
};
