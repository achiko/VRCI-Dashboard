import { z } from 'zod';

/**
 * Zod schemas for API validation
 */

export const contractCallSchema = z.object({
  method: z.string().min(1, 'Method name is required'),
  args: z.array(z.unknown()).optional().default([]),
  address: z.string().optional(),
});

export const contractTxSchema = z.object({
  method: z.string().min(1, 'Method name is required'),
  args: z.array(z.unknown()).optional().default([]),
  signer: z.string().optional(),
  value: z.string().optional(),
});

export const walletCreateSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  chainId: z.string().optional(),
});

export const logCreateSchema = z.object({
  walletId: z.string().min(1, 'Wallet ID is required'),
  contract: z.string().min(1, 'Contract name is required'),
  method: z.string().min(1, 'Method name is required'),
  txHash: z.string().optional(),
  status: z.enum(['pending', 'success', 'failed']),
  data: z.record(z.string(), z.unknown()).optional(),
});

