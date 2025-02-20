import { useSignTypedData, useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { getAddress } from "viem";
import { arbitrum } from 'viem/chains';

interface EthSafeSignature {
  signer: string;
  data: string;
  isContractSignature: boolean;
}

interface TxToSign {
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
  operation: number;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: `0x${string}`;
  refundReceiver: `0x${string}`;
  nonce: bigint;
  safeTxHash: `0x${string}`;
  signature: `0x${string}`;
  safeAddress: `0x${string}`;
}

export function useSignTx() {
  const { address: userAddress } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { toast } = useToast();

  const signTx = async (txToSign: TxToSign, safeAddress: string, nestSignature: EthSafeSignature) => {
    try {
      const signature = await signTypedDataAsync({
        domain: {
          chainId: arbitrum.id,
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
        description: "Transaction has been signed.",
      });

      if (!userAddress) {
        throw new Error('Missing user address');
      }

      const signatures = [
        { signer: userAddress, signature },
        { signer: nestSignature.signer, signature: nestSignature.data }
      ].sort((a, b) => 
        a.signer < b.signer ? -1 : 1
      );

      const combinedSignature = '0x' + signatures
        .map(sig => sig.signature.slice(2))
        .join('');

      return { txToSign, safeAddress, combinedSignature };

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign transaction",
        variant: "destructive",
      });
      return null;
    }
  };

  return { signTx };
} 