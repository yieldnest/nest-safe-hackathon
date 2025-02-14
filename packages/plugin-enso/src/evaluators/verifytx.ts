import {
    composeContext,
    elizaLogger,
    Evaluator,
    generateText,
    IAgentRuntime,
    Memory,
    ModelClass,
    type State,
} from "@elizaos/core";
import { type VerificationResult } from "../index";

const verifyTxTemplate = `TASK: Verify Transaction
Analyze the swap transaction details and verify they match the strategy requirements.

{{providers}}

# INSTRUCTIONS
- Compare the transaction details from the resultMessage with the strategy data
- Verify that token amounts, addresses, and routes match the expected values
- Determine if the transaction needs to be re-fetched based on any mismatches

Message history to find the strategy data:
{{recentMessages}}

# START OF ACTUAL TASK INFORMATION
Proposed transaction details to analyze:
{{resultData}}

TASK: Analyze the transaction details and verify the following parameters are correct:
- fromAddress is the user's safe address
- receiver is the user's safe address
- tokenIn is the token address the user wants to swap or sell
- tokenOut is the token the user wants to buy or deposit into
- amountIn is the amount of tokenIn the user wants to swap or sell

Respond with a JSON object indicating verification status.

Response format should be:
{
  "isValid": boolean,
  "mismatches": string[],  // Array of fields that don't match (empty if valid)
  "requiresRefetch": boolean
}
`;

async function handler(
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: { [key: string]: unknown } = {}
): Promise<VerificationResult> {
    state = (await runtime.composeState(message, {
        resultData: options.resultData,
    })) as State;

    const context = composeContext({
        state,
        template: verifyTxTemplate,
    });

    // Request generateText to analyze transaction details
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    // Parse the verification result
    const verificationResult = JSON.parse(response);

    elizaLogger.log("Verification Result:", verificationResult);

    return verificationResult;
}

export const verifyTxEvaluator: Evaluator = {
    name: "VERIFY_TRANSACTION",
    similes: ["VERIFY_TX", "CHECK_TRANSACTION", "VALIDATE_SWAP"],
    validate: async (
        runtime: IAgentRuntime,
        message: Memory
    ): Promise<boolean> => {
        // elizaLogger.log("Verifying transaction...", message);
        return true;
    },
    description:
        "Verify that swap transaction details match the strategy requirements",
    handler,
    examples: [
        {
            context: `Strategy with user deposit info:
{
  "Strategy address": "0x724dc807b04555b71ed48a6896b6F41593b8C637",
  "user address": "safeAddress",
  "receiver address": "safeddress",
  "amount to deposit / swap": "1000000000000000000",
  "token address to sell or swap": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "token address to buy or deposit into": "0x724dc807b04555b71ed48a6896b6F41593b8C637"
}

ResultMessage:
{
  "fromAddress": "safeAddress",
  "receiver": "safeAddress",
  "amountIn": "1000000000000000000",
  "tokenIn": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "tokenOut": "0x724dc807b04555b71ed48a6896b6F41593b8C637"
}`,
            messages: [],
            outcome: `{
  "isValid": true,
  "mismatches": [],
  "requiresRefetch": false
}`,
        },
        // Add more examples as needed
    ],
};
