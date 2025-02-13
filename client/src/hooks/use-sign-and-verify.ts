import { useSignTypedData } from "wagmi";
import { useToast } from "@/hooks/use-toast";
// import { useContractWrite, usePrepareContractWrite } from 'wagmi';
// import { useAccount } from "wagmi";
// import { safeAbi } from '../abi/safe.abi';

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

export function useSignAndVerifyTransaction() {
  const { signTypedDataAsync } = useSignTypedData();
  const { toast } = useToast();

  const signAndVerify = async (txToSign: TxToSign, safeAddress: string, address: string) => {
    try {
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

      console.log('address', address)
      console.log("User signature:", signature);

      // const response = await fetch(
      //   `https://safe-transaction-arbitrum.safe.global/api/v1/multisig-transactions/${txToSign.safeTxHash}/confirmations/`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       signature,
      //       owner: address,
      //     }),
      //   }
      // );

      // if (!response.ok) {
      //   throw new Error('Failed to submit signature to Safe Transaction Service');
      // }

      toast({
        title: "Transaction Signed",
        description: "Transaction has been signed and will be executed shortly.",
      });

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign transaction",
        variant: "destructive",
      });
    }
  };

  return { signAndVerify };
}
