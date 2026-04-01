import type { GateSettings, ScanDetail } from '@/types/scanDetails';

function hasText(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNumber(value?: number | null): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasGateValues(gate?: GateSettings): boolean {
  if (!gate) return false;

  return Object.values(gate).some((value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== undefined && value !== null;
  });
}

export function hasConfiguredScanDetailContent(detail?: ScanDetail): boolean {
  if (!detail) return false;

  if (detail.enabled) return true;

  if (
    hasText(detail.make) ||
    hasText(detail.probe) ||
    hasText(detail.remarkDetails) ||
    hasText(detail.partNumber) ||
    hasText(detail.serialNumber) ||
    hasText(detail.bandwidth) ||
    hasText(detail.focusSize) ||
    hasText(detail.sss) ||
    hasText(detail.activeElement) ||
    hasText(detail.technique) ||
    hasText(detail.utParameter) ||
    hasText(detail.pulsarParams) ||
    hasText(detail.scanningFile) ||
    hasText(detail.indexMode) ||
    hasText(detail.filter) ||
    hasText(detail.reject)
  ) {
    return true;
  }

  if (
    hasNumber(detail.waterPath) ||
    hasNumber(detail.activeElementDiameter) ||
    hasNumber(detail.velocity) ||
    hasNumber(detail.nearField) ||
    hasNumber(detail.rangeMm) ||
    hasNumber(detail.utRange) ||
    hasNumber(detail.utDelay) ||
    hasNumber(detail.prf) ||
    hasNumber(detail.db) ||
    hasNumber(detail.attenuation) ||
    hasNumber(detail.backWallEcho)
  ) {
    return true;
  }

  if (detail.tcgMode !== undefined) {
    return true;
  }

  return (
    hasGateValues(detail.gate1) ||
    hasGateValues(detail.gate2) ||
    hasGateValues(detail.gate3) ||
    hasGateValues(detail.gate4)
  );
}

export function getActiveScanDetails(scanDetails?: ScanDetail[]): ScanDetail[] {
  const details = scanDetails ?? [];
  const explicitlyEnabled = details.filter((detail) => detail.enabled);

  if (explicitlyEnabled.length > 0) {
    return explicitlyEnabled;
  }

  return details.filter(hasConfiguredScanDetailContent);
}

export function getActiveScanDirections(scanDetails?: ScanDetail[]): string[] {
  return getActiveScanDetails(scanDetails).map((detail) => detail.scanningDirection);
}
