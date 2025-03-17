import { getIndexProviderPeerIdFromFilecoinMinerInfo } from './lib/lotus-client.js'
import { getIndexProviderPeerIdFromSmartContract } from './lib/smart-contract-client.js'

/**
 * @param {string} minerId A miner actor id, e.g. `f0142637`
 * @param {object} options
 * @param {number} [options.maxAttempts]
 * @param {import('ethers').Contract} [options.smartContract] - A smart contract client to use instead of the default one
 * @param {function} [options.rpcFn]
 *
 * @returns {Promise<string>} Miner's PeerId, e.g. `12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG`
 */
export async function getIndexProviderPeerId(
  minerId,
  { maxAttempts = 5, smartContract, rpcFn } = {},
) {
  try {
    // Make a concurrent request to both sources: FilecoinMinerInfo and smart contract
    const [minerInfoResult, contractResult] = await Promise.all([
      getIndexProviderPeerIdFromFilecoinMinerInfo(minerId, { maxAttempts, rpcFn }),
      getIndexProviderPeerIdFromSmartContract(minerId, { smartContract }),
    ])
    // Check contract result first
    if (contractResult) {
      console.log('Using PeerID from the smart contract.')
      return contractResult
    }

    // Fall back to FilecoinMinerInfo result
    if (minerInfoResult) {
      console.log('Using PeerID from FilecoinMinerInfo.')
      return minerInfoResult
    }

    // Handle the case where both failed
    throw new Error(
      `Failed to obtain Miner's Index Provider PeerID.\nSmartContract query result: ${contractResult}\nStateMinerInfo query result: ${minerInfoResult}`,
    )
  } catch (error) {
    throw Error(`Error fetching PeerID for miner ${minerId}.`, {
      cause: error,
    })
  }
}
