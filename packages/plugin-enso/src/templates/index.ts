export const extractTxInfoTemplate = `
You are tasked with extracting transaction information from user messages to prepare a deposit or swap transaction.

Conversation History (Review carefully):
{{recentMessages}}

User Account:
{{userAccount}}

# Instructions:

1. **Identify the User’s Request**:
   - Which strategy (by name or protocol) does the user want to deposit/swap/transfer into?
   - Which network is mentioned (e.g., arbitrum, ethereum, optimism)?
   - Which token and how much do they want to deposit? (amountIn, tokenIn)
   - Which token address do they want in return (tokenOut) if applicable?

2. **Match Strategy & Token Addresses**:
   - Use the conversation history and the "Vault/Strategy Data" to find the correct strategy address when the user references a particular name or protocol.
   - If the user specifically says “deposit ETH,” then "tokenIn" = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee".
   - If user mentions USDC, locate the corresponding address from the provided data. 
   - If multiple addresses exist for the same symbol, pick the one matching the user’s requested strategy.

3. **Determine Output Values**:
   - **fromAddress**: The user’s safe address (from {{userAccount}})
   - **network**: The chain the user requests, e.g., "arbitrum," "ethereum," or "optimism."
   - **receiver**: Default to the user’s safe address unless they explicitly provide a different receiver.
   - **amountIn**: The numeric amount (e.g., "1") extracted from user text.
   - **tokenIn**: The address of the token the user wants to deposit 
   - **tokenOut**: The address of the *strategy* or *underlying token* the user wants to receive. 
     - If depositing into a strategy, this is often the strategy or vault address.
     - If swapping, this might be the token’s address.


4. Return ONLY a JSON object in this exact format, nothing else:
{
  "fromAddress": "Users safeAddress from user account,
  "network": "extracted_network"
  "receiver": "Users safeAddress unless specified otherwise"
  "amountIn": "The amount of tokenIn the user wants to deposit/swap/sell"
  "tokenIn": "The asset address the user wants to deposit"
  "tokenOut": "the token address the user wants to receive"
}

5. **No Extra Output**:
   - Do NOT add any commentary, explanations, or disclaimers before or after the JSON object.
   - Do NOT include quotes or code blocks around your final JSON object.


6. **Examples**:
- **Example User Request**: "Prepare a deposit transaction to send 1 ETH to the Arbitrum Aave v3 USDC strategy."
  - **Desired JSON**:
    {
      "fromAddress": "safeAddress",
      "network": "arbitrum",
      "receiver": "safeAddress",
      "amountIn": "1",
      "tokenIn": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "tokenOut": "0x724dc807b04555b71ed48a6896b6F41593b8C637"
    }
  - Notice how the strategy name “Aave v3 USDC” on “Arbitrum” is matched to "0x724dc807b04555b71ed48a6896b6F41593b8C637."

---

   Remember:
- Always match the user’s exact request to the provided data.
- Never fabricate or guess addresses if not found in conversation or vault data.
- Only return the JSON object with the required fields.
`;
