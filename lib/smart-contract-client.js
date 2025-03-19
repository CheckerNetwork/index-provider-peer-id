import { MINER_TO_PEERID_CONTRACT_ADDRESS } from './constants.js'
import assert from 'assert'
import { ethers } from 'ethers'

// ABI for the MinerPeerIDMapping contract (minimal ABI with just the method we need)
// Docs for smart contract: https://github.com/filecoin-project/curio/blob/395bc47d0f585cbc869fd4671dc05b1b2f4b18c2/market/ipni/spark/sol/README.md
// Reasoning for smart contract: https://docs.curiostorage.org/curio-market/ipni-interplanetary-network-indexer-provider#ipni-provider-identification
const abi = [
  'function getPeerData(uint64 minerID) view returns (tuple(string peerID, bytes signature))',
]

export function initializeSmartContract(rpcUrl, rpcAuth) {
  // Create a custom JsonRpcProvider with authorization header
  const fetchRequest = new ethers.FetchRequest(rpcUrl)
  fetchRequest.setHeader('Authorization', `Bearer ${rpcAuth}`)
  const provider = new ethers.JsonRpcProvider(fetchRequest)

  // Create contract instance
  return new ethers.Contract(MINER_TO_PEERID_CONTRACT_ADDRESS, abi, provider)
}

/**
 * Query the smart contract for the peer ID mapping
 * @param {string} minerID - The miner ID (as string, will be converted to uint64)
 * @param {ethers.Contract} smartContract - The smart contract instance
 * @returns {Promise<string|null>} The peer ID from the contract or empty string if not found
 */
export async function getIndexProviderPeerIdFromSmartContract(minerID, smartContract) {
  try {
    // Convert minerID string (like 'f01234') to numeric ID
    const numericID = Number(minerID.replace('f0', ''))
    assert(!isNaN(numericID), `minerID must be "f0{number}". Actual value: "${minerID}"`)

    // Call the contract function
    const peerData = await smartContract.getPeerData(numericID)
    // TODO: Check if peerData.signature is valid
    return peerData.peerID
  } catch (error) {
    throw Error(`Error fetching peer ID from contract for miner ${minerID}.`, {
      cause: error,
    })
  }
}
