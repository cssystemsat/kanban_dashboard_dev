import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useKanbanData } from './useKanbanData';

// Mock fetch
global.fetch = vi.fn();

describe('useKanbanData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty data and loading false', () => {
    const { result } = renderHook(() => useKanbanData());
    
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should parse CSV data correctly', async () => {
    const mockCSV = `A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF
,Cliente 1,CSM 1,01/01/2026,,,10,,,,,,,FALSE,,,,,,,,,,,Saúde OK,100,50,João,,,,,,,,
,Cliente 2,CSM 2,02/01/2026,,,15,,,,,,,TRUE,,,,,,,,,,,Saúde OK,200,100,Maria,,,,,,,,`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => mockCSV,
    });

    const { result } = renderHook(() => useKanbanData());
    
    await result.current.fetchData();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useKanbanData());
    
    await result.current.fetchData();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toEqual([]);
  });

  it('should calculate marco status correctly', async () => {
    const mockCSV = `A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG,AH,AI,AJ,AK,AL,AM,AN,AO
,Cliente 1,CSM 1,01/01/2026,,,10,,,,,,,FALSE,,,,,,,,,,,Saúde OK,100,50,João,,,,,,,,OK,OK,01/02/2026,,,`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => mockCSV,
    });

    const { result } = renderHook(() => useKanbanData());
    
    await result.current.fetchData();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    if (result.current.data.length > 0) {
      const client = result.current.data[0];
      expect(client.marco).toBeDefined();
      expect(['ok', 'atrasado', 'pendente']).toContain(client.marcoStatus);
    }
  });
});
