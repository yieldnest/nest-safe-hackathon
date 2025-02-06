import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient, type Account } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const providerUrl = process.env.EVM_PROVIDER_URL

if (!providerUrl) {
    throw new Error('EVM_PROVIDER_URL environment variable is not set')
}

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(providerUrl)
}) as PublicClient

export const createViemWalletClient = (privateKey: string) => {
    // Ensure private key starts with 0x
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    
    return createWalletClient({
        account,
        chain: sepolia,
        transport: http(providerUrl)
    }) as WalletClient
}
