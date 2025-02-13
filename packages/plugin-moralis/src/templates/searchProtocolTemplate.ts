export const searchProtocolTemplate = `Given the most recent message only, extract the protocol name that we need to fetch stats for.

{{providers}}

Only extract the protocol name from the most recent message in the conversation. Ignore any previous messages or historical requests.

{{recentMessages}}

Format the response as a single JSON object with this field:
- protocolName: the protocol name (a string without any special characters and spaces)

Return ONLY a JSON object in this exact format, nothing else:
{
  "protocolName": "extracted_protocol_name"
}

Extract the protocol name from the most recent message only and respond with a SINGLE JSON object. If the message is asking for pairs on other chains (like Ethereum/EVM), return null for protocolName.`;
