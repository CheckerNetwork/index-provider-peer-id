import { getIndexProviderPeerIdFromSmartContract } from './lib/smart-contract-client.js'
import { getIndexProviderPeerIdFromFilecoinMinerInfo } from './lib/filecoin-rpc-client.js'
import { rpc } from './lib/rpc-client.js'
export { MINER_TO_PEERID_CONTRACT_ADDRESS, MINER_TO_PEERID_CONTRACT_ABI } from './lib/constants.js'

/**
 * @param {string} minerId A miner actor id, e.g. `f0142637`
 * @param {import('ethers').Contract} smartContract The smart contract instance
 * @param {object} options
 * @param {number} [options.maxAttempts]
 * @param {string} [options.rpcUrl]
 * @param {string} [options.rpcAuth]
 * @param {(method:string,params:unknown[])=> Promise<unknown> } [options.rpcFn] The RPC function to use
 * @returns {Promise<{ peerId: string, source: 'smartContract'|'minerInfo' }>} Miner's PeerId, e.g. `12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG` and the source of the data
 */
export async function getIndexProviderPeerId(
  minerId,
  smartContract,
  {
    maxAttempts = 5,
    rpcUrl = 'https://api.node.glif.io/',
    rpcAuth,
    rpcFn = async (method, params) => {
      return await rpc(method, params, rpcUrl, { rpcAuth })
    },
  } = {},
) {
  try {
    // Make concurrent requests to both sources: FilecoinMinerInfo and smart contract
    const [contractResult, minerInfoResult] = await Promise.all([
      getIndexProviderPeerIdFromSmartContract(minerId, smartContract),
      getIndexProviderPeerIdFromFilecoinMinerInfo(minerId, rpcFn, { maxAttempts }),
    ])
    // Check contract result first
    if (contractResult) {
      console.log('Using PeerID from the smart contract.')
      return { peerId: contractResult, source: 'smartContract' }
    }

    // Fall back to FilecoinMinerInfo result
    if (minerInfoResult) {
      console.log('Using PeerID from FilecoinMinerInfo.')
      return { peerId: minerInfoResult, source: 'minerInfo' }
    }

    // Handle the case where both failed
    throw new Error(
      `Failed to obtain Miner's Index Provider PeerID.\nSmartContract query result: ${contractResult}\nStateMinerInfo query result: ${minerInfoResult}`,
    )
  } catch (error) {
    throw Error(`Error fetching index provider PeerID for miner ${minerId}.`, {
      cause: error,
    })
  }
}
