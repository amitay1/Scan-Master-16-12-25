import { describe, expect, it } from 'vitest';
import {
  getActiveScanDetails,
  getActiveScanDirections,
  hasConfiguredScanDetailContent,
} from '@/utils/scanDetailsSelection';

describe('scanDetailsSelection', () => {
  it('prefers explicitly enabled scan details', () => {
    const rows = [
      {
        scanningDirection: 'A',
        waveMode: 'LW',
        frequency: '',
        make: '',
        probe: '',
        remarkDetails: '',
        enabled: true,
      },
      {
        scanningDirection: 'B',
        waveMode: 'SW',
        frequency: '',
        make: 'GE',
        probe: 'X',
        remarkDetails: '',
        enabled: false,
      },
    ];

    expect(getActiveScanDirections(rows)).toEqual(['A']);
  });

  it('falls back to configured rows when enabled flags are missing or false', () => {
    const rows = [
      {
        scanningDirection: 'A',
        waveMode: 'LW',
        frequency: '',
        make: '',
        probe: '',
        remarkDetails: '',
        enabled: false,
      },
      {
        scanningDirection: 'B',
        waveMode: 'SW',
        frequency: '',
        make: 'GE',
        probe: 'Probe-1',
        remarkDetails: '',
        enabled: false,
      },
      {
        scanningDirection: 'C',
        waveMode: 'SW',
        frequency: '',
        make: '',
        probe: '',
        remarkDetails: '',
        enabled: false,
        gate1: { position: 0, start: 0.5, stop: 1.2 },
      },
    ];

    expect(getActiveScanDirections(rows)).toEqual(['B', 'C']);
    expect(getActiveScanDetails(rows)).toHaveLength(2);
  });

  it('does not treat bare default rows as configured', () => {
    const defaultLikeRow = {
      scanningDirection: 'A',
      waveMode: 'LW 0°',
      frequency: '5',
      make: '',
      probe: '',
      remarkDetails: '',
      enabled: false,
      angle: 0,
      entrySurface: 'top' as const,
    };

    expect(hasConfiguredScanDetailContent(defaultLikeRow)).toBe(false);
    expect(getActiveScanDetails([defaultLikeRow])).toEqual([]);
  });
});
