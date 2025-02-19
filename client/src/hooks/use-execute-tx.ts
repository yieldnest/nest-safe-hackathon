import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { safeAbi } from '../abi/safe.abi';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Address } from 'viem';

interface TxArgs {
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
  operation: number;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: `0x${string}`;
  refundReceiver: `0x${string}`;
  signature: `0x${string}`;
  safeAddress: `0x${string}`;
}

export function useExecuteTx() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hash, writeContract, isPending: isWritePending } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: txError
  } = useWaitForTransactionReceipt({
    hash: hash as Address,
  });

  const executeTx = async ({ txToSign, safeAddress, combinedSignature }: { 
    txToSign: TxArgs, 
    safeAddress: `0x${string}`, 
    combinedSignature: `0x${string}` 
  }): Promise<void> => {
    try {
      await writeContract({
        address: safeAddress,
        abi: safeAbi,
        functionName: 'execTransaction',
        args: [
          txToSign.to,
          txToSign.value,
          txToSign.data,
          txToSign.operation,
          txToSign.safeTxGas,
          txToSign.baseGas,
          txToSign.gasPrice,
          txToSign.gasToken,
          txToSign.refundReceiver,
          combinedSignature,
        ],
      });
    } catch (error) {
      console.error("Error executing transaction:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to execute transaction",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (isWritePending) {
      toast({
        title: "Transaction Pending",
        description: "Waiting for user confirmation...",
      });
    }

    if (isConfirming) {
      toast({
        title: "Transaction Confirming",
        description: "Waiting for transaction confirmation...",
      });
    }

    if (txError) {
      toast({
        title: "Transaction Failed",
        description: txError.message || "Transaction failed to confirm",
        variant: "destructive",
      });
    }

    if (isConfirmed) {
      toast({
        title: "Transaction Successful",
        description: "The transaction was successfully executed.",
      });
      // Revalidate the correct query key
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['safe-tokens'] });
      }, 3000);
    }
  }, [isWritePending, isConfirming, isConfirmed, txError]);

  return { 
    executeTx,
    isWritePending,
    isConfirming,
    isConfirmed,
    txError,
    hash 
  };
} 