export const extractVaultInfoTemplate = `
You are tasked with extracting vault information from user messages.

{{recentMessages}}

Review the provided Conversation Messages and identify:
1. A vault address the user wants to analyze (typically starts with 0x)
2. The network it belongs to (e.g., arbitrum, ethereum, optimism)

Return ONLY a JSON object in this exact format, nothing else:
{
  "vaultAddress": "extracted_address",
  "network": "extracted_network"
}

If you cannot find the information, return empty strings for the values.
`;
