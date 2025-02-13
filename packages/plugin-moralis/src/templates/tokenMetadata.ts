export const getTokenMetadataTemplate = `Given the most recent message only, extract the Solana token address to fetch metadata for. This is specifically for Solana blockchain only.

Format the response as a single JSON object with:
- tokenAddress: the Solana token address (a base58 string)

Example:
For "What's the FDV and total supply of SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt?":
\`\`\`json
{
  "tokenAddress": "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"
}
\`\`\`

{{recentMessages}}
Extract the Solana token address from the LAST message only and respond with a SINGLE JSON object. If asking about tokens on other chains (like Ethereum/EVM), return null for tokenAddress.`;

export const getTokenMetadataTemplateArbitrum = `Given the most recent message only, extract the Arbitrum token address to fetch metadata for. This is specifically for Arbitrum blockchain only.

{{providers}}

{{recentMessages}}

Only extract the token address from the most recent message in the conversation. Ignore any previous messages or historical requests.

Return ONLY a JSON object in the exact format below, nothing else:
{
 "tokenAddress": "0x37a645648df29205c6261289983fb04ecd70b4b3"
}

Extract the Arbitrum token address from the most recent message. They may have given you a token symbol or name that you need to find in the message history to get the correct address from. If you can't find the address, return null for tokenAddress.
Respond with a SINGLE JSON object.
`;
