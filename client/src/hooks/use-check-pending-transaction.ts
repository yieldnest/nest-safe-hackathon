import { useToast } from "@/hooks/use-toast";

export function useCheckPendingTransaction() {
  const { toast } = useToast();

  const checkPendingTransaction = async (pendingTxResponse: any, swapResponse: any) => {
    try {
      const pendingTx = pendingTxResponse.transactions?.[0];
      const nestAddress = pendingTxResponse.nestAddress;

      let txToSign;

      if (pendingTx && !pendingTx.isExecuted) {
        const toMatches = pendingTx.to.toLowerCase() === swapResponse.data.tx.to.toLowerCase();
        const valueMatches = pendingTx.value === swapResponse.data.tx.value;
        const dataMatches = pendingTx.data === swapResponse.data.tx.data;

        if (toMatches && valueMatches && dataMatches) {
          const nestConfirmation = pendingTx.confirmations?.find((conf: { owner: string; signature: string }) => 
            conf.owner.toLowerCase() === nestAddress?.toLowerCase()
          );
          const userConfirmation = pendingTx.confirmations?.find((conf: { owner: string; signature: string }) => 
            conf.owner.toLowerCase() === swapResponse.userAddress?.toLowerCase()
          );

          if (nestConfirmation && !userConfirmation) {
            txToSign = {
              to: pendingTx.to,
              value: pendingTx.value,
              data: pendingTx.data || '0x',
              operation: pendingTx.operation,
              safeTxGas: pendingTx.safeTxGas,
              baseGas: pendingTx.baseGas,
              gasPrice: pendingTx.gasPrice,
              gasToken: pendingTx.gasToken,
              refundReceiver: pendingTx.refundReceiver,
              nonce: pendingTx.nonce,
              safeTxHash: pendingTx.safeTxHash
            };
          }
        }
      }

      return txToSign;
    } catch (error) {
      console.error("Error checking pending transactions:", error);
      toast({
        title: "Error",
        description: "Failed to check pending transactions",
        variant: "destructive",
      });
      return null;
    }
  };

  return { checkPendingTransaction };
} 