export const extractTxInfoTemplate = `
You are tasked with extracting transaction information from user messages.

{{recentMessages}}

User Account:
{{userAccount}}

Review the provided Conversation Messages and identify:
1. The strategy the user wants to deposit/swap/transfer into
2. The network it belongs to (e.g., arbitrum, ethereum, optimism)
3. The amount the user wants to deposit as amountIn
4. The token address the user wants to deposit as tokenIn
5. The token address the user wants to receive as tokenOut

To find the correct token address you may need to search recentMessages to find the correct token address by looking for the token symbol.
Note: If user is sending/receiving ETH, use the address 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

Return ONLY a JSON object in this exact format, nothing else:
{
  "fromAddress": "Users safeAddress from user account,
  "network": "extracted_network"
  "receiver": "Users safeAddress unless specified otherwise"
  "amountIn": "The amount the user wants to deposit"
  "tokenIn": "The asset address the user wants to deposit"
  "tokenOut": "the token address the user wants to receive"
}

If you cannot find the information, return empty strings for the values.
`;
