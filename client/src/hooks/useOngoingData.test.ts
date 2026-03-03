import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOngoingData } from './useOngoingData';

// Mock fetch
global.fetch = vi.fn();

describe('useOngoingData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty data and loading false', () => {
    const { result } = renderHook(() => useOngoingData());
    
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and parse ongoing data correctly', async () => {
    const mockCSV = `A,B,C,D,E,F,G,H,I,J,K,L,M
,Cliente 1,CSM 1,,,1000,10,,,10,,,01/01/2026,15
,Cliente 2,CSM 2,,,2000,15,,,5,,,02/01/2026,20`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => mockCSV,
    });

    const { result } = renderHook(() => useOngoingData());
    
    await result.current.fetchData();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('should sort data by diasSemContato in descending order', async () => {
    const mockCSV = `A,B,C,D,E,F,G,H,I,J,K,L,M
,Cliente 1,CSM 1,,,1000,10,,,10,,,01/01/2026,5
,Cliente 2,CSM 2,,,2000,15,,,5,,,02/01/2026,20
,Cliente 3,CSM 1,,,1500,12,,,8,,,03/01/2026,10`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => mockCSV,
    });

    const { result } = renderHook(() => useOngoingData());
    
    await result.current.fetchData();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verificar se está ordenado por diasSemContato descendente
    for (let i = 0; i < result.current.data.length - 1; i++) {
      expect(result.current.data[i].diasSemContato).toBeGreaterThanOrEqual(
        result.current.data[i + 1].diasSemContato
      );
    }
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useOngoingData());
    
    await result.current.fetchData();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toEqual([]);
  });
});
