/**
 * NADCAP Package Generator
 * Utilities for generating NADCAP audit documentation
 */

import type {
  NADCAPPackage,
  NADCAPChecklistItem,
  NADCAPStats,
  NADCAPCategory,
  ChecklistStatus,
  PersonnelRecord,
  EquipmentCalibrationRecord,
  ProcedureRecord,
  JobRecord,
  AuditFinding,
} from "@/types/nadcap";
import { AC7114_SECTIONS, CATEGORY_LABELS } from "@/types/nadcap";

/**
 * Create a new NADCAP package
 */
export function createNADCAPPackage(
  facilityName: string,
  preparedBy: string
): NADCAPPackage {
  // Generate checklist items from AC7114 sections
  const checklists: NADCAPChecklistItem[] = [];

  for (const section of AC7114_SECTIONS) {
    for (const item of section.items) {
      checklists.push({
        id: `chk-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
        category: section.category,
        reference: item.ref,
        requirement: item.requirement,
        status: "pending",
      });
    }
  }

  return {
    facilityName,
    preparedBy,
    preparedDate: new Date().toISOString(),
    checklists,
    personnel: [],
    equipment: [],
    procedures: [],
    jobRecords: [],
    findings: [],
    stats: calculateStats(checklists, [], [], []),
  };
}

/**
 * Calculate package statistics
 */
export function calculateStats(
  checklists: NADCAPChecklistItem[],
  personnel: PersonnelRecord[],
  equipment: EquipmentCalibrationRecord[],
  findings: AuditFinding[]
): NADCAPStats {
  const totalChecklistItems = checklists.length;
  const compliantItems = checklists.filter((c) => c.status === "compliant").length;
  const nonCompliantItems = checklists.filter((c) => c.status === "non_compliant").length;
  const pendingItems = checklists.filter((c) => c.status === "pending").length;
  const applicableItems = totalChecklistItems - checklists.filter((c) => c.status === "not_applicable").length;

  return {
    totalChecklistItems,
    compliantItems,
    nonCompliantItems,
    pendingItems,
    complianceRate: applicableItems > 0 ? Math.round((compliantItems / applicableItems) * 100) : 0,

    personnelCount: personnel.length,
    activePersonnel: personnel.filter((p) => p.status === "active").length,
    expiredCerts: personnel.filter((p) => p.status === "expired").length,

    equipmentCount: equipment.length,
    calibrationDue: equipment.filter((e) => e.status === "due_soon").length,
    calibrationOverdue: equipment.filter((e) => e.status === "overdue").length,

    openFindings: findings.filter((f) => f.status === "open" || f.status === "in_progress").length,
    closedFindings: findings.filter((f) => f.status === "closed" || f.status === "verified").length,
  };
}

/**
 * Update checklist item status
 */
export function updateChecklistStatus(
  pkg: NADCAPPackage,
  itemId: string,
  status: ChecklistStatus,
  evidence?: string,
  notes?: string
): NADCAPPackage {
  const checklists = pkg.checklists.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status,
          evidence,
          notes,
          lastReviewed: new Date().toISOString(),
        }
      : item
  );

  return {
    ...pkg,
    checklists,
    stats: calculateStats(checklists, pkg.personnel, pkg.equipment, pkg.findings),
  };
}

/**
 * Add personnel record
 */
export function addPersonnelRecord(
  pkg: NADCAPPackage,
  record: Omit<PersonnelRecord, "id">
): NADCAPPackage {
  const newRecord: PersonnelRecord = {
    ...record,
    id: `pers-${Date.now().toString(36)}`,
  };

  const personnel = [...pkg.personnel, newRecord];

  return {
    ...pkg,
    personnel,
    stats: calculateStats(pkg.checklists, personnel, pkg.equipment, pkg.findings),
  };
}

/**
 * Add equipment record
 */
export function addEquipmentRecord(
  pkg: NADCAPPackage,
  record: Omit<EquipmentCalibrationRecord, "status">
): NADCAPPackage {
  // Calculate status based on dates
  const nextCal = new Date(record.nextCalibrationDate);
  const today = new Date();
  const daysUntilDue = Math.ceil((nextCal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let status: EquipmentCalibrationRecord["status"];
  if (daysUntilDue < 0) {
    status = "overdue";
  } else if (daysUntilDue < 30) {
    status = "due_soon";
  } else {
    status = "valid";
  }

  const equipment = [...pkg.equipment, { ...record, status }];

  return {
    ...pkg,
    equipment,
    stats: calculateStats(pkg.checklists, pkg.personnel, equipment, pkg.findings),
  };
}

/**
 * Add audit finding
 */
export function addFinding(
  pkg: NADCAPPackage,
  finding: Omit<AuditFinding, "id" | "findingNumber">
): NADCAPPackage {
  const findingNumber = `F-${(pkg.findings.length + 1).toString().padStart(3, "0")}`;
  const newFinding: AuditFinding = {
    ...finding,
    id: `find-${Date.now().toString(36)}`,
    findingNumber,
  };

  const findings = [...pkg.findings, newFinding];

  return {
    ...pkg,
    findings,
    stats: calculateStats(pkg.checklists, pkg.personnel, pkg.equipment, findings),
  };
}

/**
 * Get checklist items by category
 */
export function getChecklistByCategory(
  pkg: NADCAPPackage,
  category: NADCAPCategory
): NADCAPChecklistItem[] {
  return pkg.checklists.filter((item) => item.category === category);
}

/**
 * Generate compliance summary text
 */
export function generateComplianceSummary(pkg: NADCAPPackage): string {
  const { stats } = pkg;
  let summary = `NADCAP Compliance Summary\n`;
  summary += `========================\n\n`;
  summary += `Facility: ${pkg.facilityName}\n`;
  summary += `Prepared: ${new Date(pkg.preparedDate).toLocaleDateString()}\n`;
  summary += `Prepared By: ${pkg.preparedBy}\n\n`;

  summary += `Overall Compliance: ${stats.complianceRate}%\n`;
  summary += `- Compliant Items: ${stats.compliantItems}\n`;
  summary += `- Non-Compliant Items: ${stats.nonCompliantItems}\n`;
  summary += `- Pending Review: ${stats.pendingItems}\n\n`;

  summary += `Personnel Status:\n`;
  summary += `- Total Personnel: ${stats.personnelCount}\n`;
  summary += `- Active Certifications: ${stats.activePersonnel}\n`;
  summary += `- Expired Certifications: ${stats.expiredCerts}\n\n`;

  summary += `Equipment Status:\n`;
  summary += `- Total Equipment: ${stats.equipmentCount}\n`;
  summary += `- Calibration Due Soon: ${stats.calibrationDue}\n`;
  summary += `- Calibration Overdue: ${stats.calibrationOverdue}\n\n`;

  summary += `Findings:\n`;
  summary += `- Open Findings: ${stats.openFindings}\n`;
  summary += `- Closed Findings: ${stats.closedFindings}\n`;

  return summary;
}

/**
 * Generate checklist report by category
 */
export function generateCategoryReport(
  pkg: NADCAPPackage,
  category: NADCAPCategory
): string {
  const items = getChecklistByCategory(pkg, category);
  const categoryLabel = CATEGORY_LABELS[category];

  let report = `${categoryLabel} Checklist\n`;
  report += `${"=".repeat(categoryLabel.length + 10)}\n\n`;

  for (const item of items) {
    report += `${item.reference}\n`;
    report += `Requirement: ${item.requirement}\n`;
    report += `Status: ${item.status.toUpperCase()}\n`;
    if (item.evidence) {
      report += `Evidence: ${item.evidence}\n`;
    }
    if (item.notes) {
      report += `Notes: ${item.notes}\n`;
    }
    report += `\n`;
  }

  return report;
}

/**
 * Export package to JSON
 */
export function exportPackageJSON(pkg: NADCAPPackage): string {
  return JSON.stringify(pkg, null, 2);
}

/**
 * Generate findings report
 */
export function generateFindingsReport(pkg: NADCAPPackage): string {
  let report = `Audit Findings Report\n`;
  report += `=====================\n\n`;

  if (pkg.findings.length === 0) {
    report += `No findings recorded.\n`;
    return report;
  }

  const openFindings = pkg.findings.filter((f) => f.status === "open" || f.status === "in_progress");
  const closedFindings = pkg.findings.filter((f) => f.status === "closed" || f.status === "verified");

  if (openFindings.length > 0) {
    report += `OPEN FINDINGS (${openFindings.length})\n`;
    report += `-----------------\n\n`;

    for (const f of openFindings) {
      report += `${f.findingNumber} - ${f.severity.toUpperCase()}\n`;
      report += `Category: ${CATEGORY_LABELS[f.category]}\n`;
      report += `Description: ${f.description}\n`;
      report += `Requirement: ${f.requirement}\n`;
      if (f.correctiveAction) {
        report += `Corrective Action: ${f.correctiveAction}\n`;
      }
      if (f.dueDate) {
        report += `Due Date: ${new Date(f.dueDate).toLocaleDateString()}\n`;
      }
      report += `\n`;
    }
  }

  if (closedFindings.length > 0) {
    report += `\nCLOSED FINDINGS (${closedFindings.length})\n`;
    report += `------------------\n\n`;

    for (const f of closedFindings) {
      report += `${f.findingNumber} - ${f.severity.toUpperCase()} (CLOSED)\n`;
      report += `Category: ${CATEGORY_LABELS[f.category]}\n`;
      report += `Description: ${f.description}\n`;
      if (f.closedDate) {
        report += `Closed: ${new Date(f.closedDate).toLocaleDateString()}\n`;
      }
      report += `\n`;
    }
  }

  return report;
}

/**
 * Check personnel certification expiry
 */
export function checkPersonnelExpiry(personnel: PersonnelRecord[]): {
  expiringSoon: PersonnelRecord[];
  expired: PersonnelRecord[];
} {
  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringSoon = personnel.filter((p) => {
    const expiry = new Date(p.expiryDate);
    return expiry > today && expiry <= thirtyDays;
  });

  const expired = personnel.filter((p) => {
    const expiry = new Date(p.expiryDate);
    return expiry <= today;
  });

  return { expiringSoon, expired };
}

/**
 * Check equipment calibration status
 */
export function checkEquipmentCalibration(equipment: EquipmentCalibrationRecord[]): {
  dueSoon: EquipmentCalibrationRecord[];
  overdue: EquipmentCalibrationRecord[];
} {
  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const dueSoon = equipment.filter((e) => {
    const nextCal = new Date(e.nextCalibrationDate);
    return nextCal > today && nextCal <= thirtyDays;
  });

  const overdue = equipment.filter((e) => {
    const nextCal = new Date(e.nextCalibrationDate);
    return nextCal <= today;
  });

  return { dueSoon, overdue };
}

/**
 * Generate sample package for demo
 */
export function generateSamplePackage(): NADCAPPackage {
  let pkg = createNADCAPPackage("Sample NDT Facility", "John Smith");

  // Add some personnel
  pkg = addPersonnelRecord(pkg, {
    name: "Mike Johnson",
    employeeId: "EMP001",
    level: "III",
    certificationScheme: "NAS 410",
    method: "UT",
    certDate: "2024-01-15",
    expiryDate: "2029-01-15",
    status: "active",
    trainingHours: 160,
    experienceMonths: 60,
  });

  pkg = addPersonnelRecord(pkg, {
    name: "Sarah Williams",
    employeeId: "EMP002",
    level: "II",
    certificationScheme: "NAS 410",
    method: "UT",
    certDate: "2023-06-01",
    expiryDate: "2026-06-01",
    status: "active",
    trainingHours: 80,
    experienceMonths: 24,
  });

  // Add equipment
  pkg = addEquipmentRecord(pkg, {
    equipmentId: "EQ001",
    equipmentName: "Olympus Epoch 650",
    serialNumber: "EP650-12345",
    type: "Flaw Detector",
    calibrationDate: "2025-10-15",
    nextCalibrationDate: "2026-10-15",
    calibrationStandard: "ASTM E317",
    calibratedBy: "AccuCal Services",
    traceable: true,
    results: [
      { parameter: "Linearity", nominal: "±1%", measured: "0.5%", tolerance: "±2%", pass: true },
    ],
  });

  // Update some checklist items
  pkg = updateChecklistStatus(pkg, pkg.checklists[0].id, "compliant", "WPQ-001 Rev B", "Current and approved");
  pkg = updateChecklistStatus(pkg, pkg.checklists[1].id, "compliant", "Personnel files", "All current");
  pkg = updateChecklistStatus(pkg, pkg.checklists[2].id, "pending", undefined, "Awaiting annual vision tests");

  return pkg;
}
