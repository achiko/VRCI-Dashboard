import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';

export interface WhitelistEntry {
  id: string;
  address: string;
  addedBy: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhitelistInput {
  address: string;
  note?: string;
  addedBy?: string;
}

/**
 * Hook to check if an address is whitelisted
 */
export function useWhitelistCheck(address: string | null | undefined) {
  return useQuery({
    queryKey: ['whitelist', 'check', address],
    queryFn: async (): Promise<boolean> => {
      if (!address) return false;

      const res = await fetch(`/api/whitelist/check?address=${encodeURIComponent(address)}`);
      const data: ApiResponse<{ whitelisted: boolean }> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to check whitelist');
      }

      return data.data?.whitelisted ?? false;
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch all whitelisted addresses
 */
export function useWhitelist() {
  return useQuery({
    queryKey: ['whitelist'],
    queryFn: async (): Promise<WhitelistEntry[]> => {
      const res = await fetch('/api/whitelist');
      const data: ApiResponse<WhitelistEntry[]> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch whitelist');
      }

      return data.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to add a new whitelisted address
 */
export function useAddWhitelist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWhitelistInput): Promise<WhitelistEntry> => {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data: ApiResponse<WhitelistEntry> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add whitelist entry');
      }

      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
  });
}

/**
 * Hook to remove a whitelisted address
 */
export function useRemoveWhitelist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/whitelist/${id}`, {
        method: 'DELETE',
      });

      const data: ApiResponse<unknown> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove whitelist entry');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
  });
}

