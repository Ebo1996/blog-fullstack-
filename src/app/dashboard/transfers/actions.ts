'use server'

import { revalidatePath } from 'next/cache'
import {
  createTransfer,
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
} from '@/services/transfers'

export interface TransferActionResult {
  success: boolean
  error?: string
}

export async function createTransferAction(
  ticketId: string,
  toEmail: string,
): Promise<TransferActionResult> {
  const result = await createTransfer(ticketId, toEmail)
  if (result.success) {
    revalidatePath('/dashboard/transfers')
    revalidatePath('/dashboard/tickets')
  }
  return { success: result.success, error: result.error }
}

export async function acceptTransferAction(transferId: string): Promise<TransferActionResult> {
  const result = await acceptTransfer(transferId)
  if (result.success) {
    revalidatePath('/dashboard/transfers')
    revalidatePath('/dashboard/tickets')
  }
  return { success: result.success, error: result.error }
}

export async function rejectTransferAction(transferId: string): Promise<TransferActionResult> {
  const result = await rejectTransfer(transferId)
  if (result.success) {
    revalidatePath('/dashboard/transfers')
  }
  return { success: result.success, error: result.error }
}

export async function cancelTransferAction(transferId: string): Promise<TransferActionResult> {
  const result = await cancelTransfer(transferId)
  if (result.success) {
    revalidatePath('/dashboard/transfers')
    revalidatePath('/dashboard/tickets')
  }
  return { success: result.success, error: result.error }
}
