import { useSignTypedData } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { safeAbi } from '../abi/safe.abi';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';

interface TxToSign {
  [key: string]: any;
  to: string;
  value: string;
  data: string;
  operation: number;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: string;
  refundReceiver: string;
  nonce: number;
  safeTxHash: string;
}

export function useSignAndExecute() {
  const { signTypedDataAsync } = useSignTypedData();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [txArgs, setTxArgs] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { config } = usePrepareContractWrite({
    address: txArgs?.safeAddress,
    abi: safeAbi,
    functionName: 'execTransaction',
    args: txArgs ? [
      txArgs.to,
      txArgs.value,
      txArgs.data,
      txArgs.operation,
      txArgs.safeTxGas,
      txArgs.baseGas,
      txArgs.gasPrice,
      txArgs.gasToken,
      txArgs.refundReceiver,
      txArgs.signature,
    ] : undefined,
    enabled: !!txArgs,
  });

  const { write } = useContractWrite(config);

  useEffect(() => {
    if (write) {
      write();
    }
  }, [write]);

  const signAndExecute = async (txToSign: TxToSign, safeAddress: string, nestSignature: string) => {
    try {
      setLoading(true);
      const signature = await signTypedDataAsync({
        domain: {
          chainId: 42161,
          verifyingContract: safeAddress as `0x${string}`,
        },
        types: {
          SafeTx: [
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "data", type: "bytes" },
            { name: "operation", type: "uint8" },
            { name: "safeTxGas", type: "uint256" },
            { name: "baseGas", type: "uint256" },
            { name: "gasPrice", type: "uint256" },
            { name: "gasToken", type: "address" },
            { name: "refundReceiver", type: "address" },
            { name: "nonce", type: "uint256" },
          ],
        },
        primaryType: "SafeTx",
        message: txToSign,
      });
      toast({
        title: "Transaction Signed",
        description: "Transaction has been signed and will be executed shortly.",
      });

      // Combine signatures
      const combinedSignature = '0x' + [signature, nestSignature].map((s) => s.slice(2)).join('');

      // Set transaction arguments for contract write
      setTxArgs({
        ...txToSign,
        safeAddress,
        signature: combinedSignature,
      });

      // Wait for transaction to be mined
      const publicClient = createPublicClient({
        chain: arbitrum,
        transport: http(arbitrum.rpcUrls.default.http[0]),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txToSign.safeTxHash as `0x${string}`,
      });

      if (Number(receipt.status) === 1) {
        toast({
          title: "Transaction Successful",
          description: "The transaction was successfully executed.",
        });

        // Revalidate the correct query key
        queryClient.invalidateQueries({ queryKey: 'safe-tokens' });
      }

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { signAndExecute };
}
