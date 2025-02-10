export const searchProtocolTemplate = `Given the most recent message only, extract the protocol name that we need to fetch stats for.

Only extract information from the last message in the conversation. Ignore any previous messages or historical requests.

Format the response as a single JSON object with this field:
- protocolName: the protocol name (a string without any special characters and spaces)

Example response:
For "What is Uniswap?":
\`\`\`json
{
  "protocolName": "Uniswap"
}
\`\`\`

{{recentMessages}}
Extract the protocol name from the LAST message only and respond with a SINGLE JSON object. If the message is asking for pairs on other chains (like Ethereum/EVM), return null for protocolName.`;
