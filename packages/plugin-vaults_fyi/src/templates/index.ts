export * from './vaults';

export const aiAgentIdentifierTemplate = `Extract AI agent identifier from the message. Focus ONLY on:
1. Twitter handles can start with "@" or not
2. Ethereum addresses (0x...)
3. Plain agent names without "@"

Rules:
- Return ONLY the identifier without any additional text
- For Twitter handles: remove "@" prefix
- For addresses: preserve full address with 0x
- If multiple matches found, return the first valid one
- If no valid identifier found, return exactly "NOT_FOUND"
- Never include explanations or additional text

Examples:
"Check @ElizaAI token" -> "ElizaAI"
"Analyze 0x1234abcd..." -> "0x1234abcd..."
"How about random text" -> "NOT_FOUND"

Response format: raw string without quotes or formatting`;
