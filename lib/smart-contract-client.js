import { MINER_TO_PEERID_CONTRACT_ADDRESS, RPC_AUTH, RPC_URL } from './constants.js'
import assert from 'assert'
import { ethers } from 'ethers'

// ABI for the MinerPeerIDMapping contract (minimal ABI with just the method we need)
// Docs for smart contract: https://github.com/filecoin-project/curio/blob/395bc47d0f585cbc869fd4671dc05b1b2f4b18c2/market/ipni/spark/sol/README.md
// Reasoning for smart contract: https://docs.curiostorage.org/curio-market/ipni-interplanetary-network-indexer-provider#ipni-provider-identification
const abi = [
  'function getPeerData(uint64 minerID) view returns (tuple(string peerID, bytes signature))',
]

// Create a custom JsonRpcProvider with authorization header
const fetchRequest = new ethers.FetchRequest(RPC_URL)
fetchRequest.setHeader('Authorization', `Bearer ${RPC_AUTH}`)
const provider = new ethers.JsonRpcProvider(fetchRequest)

// Create contract instance
const defaultClient = new ethers.Contract(MINER_TO_PEERID_CONTRACT_ADDRESS, abi, provider)

/**
 * Query the smart contract for the peer ID mapping
 * @param {string} minerID - The miner ID (as string, will be converted to uint64)
 * @param {object} [options]
 * @param {ethers.Contract} [options.smartContract] - A smart contract client to use instead of the default one
 * @param {number} [options.maxAttempts]
 * @returns {Promise<string|null>} The peer ID from the contract or empty string if not found
 */
export async function getIndexProviderPeerIdFromSmartContract(
  minerID,
  { smartContract, maxAttempts = 5 } = {},
) {
  try {
    /** @type {ethers.Contract} */
    const contractClient = smartContract ?? defaultClient
    assert(contractClient, 'smartContract must be initialized')
    const numericID = parseInt(minerID.replace('f0', ''))
    assert(!isNaN(numericID), `minerID must be "f0{number}". Actual value: "${minerID}"`)

    // Call the contract function
    const peerData = await contractClient.getPeerData(numericID)
    return peerData.peerID?.toString() ?? null
  } catch (error) {
    throw Error(`Error fetching peer ID from contract for miner ${minerID}.`, {
      cause: error,
    })
  }
}
