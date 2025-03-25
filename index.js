export { MINER_TO_PEERID_CONTRACT_ADDRESS, MINER_TO_PEERID_CONTRACT_ABI } from './lib/constants.js'
/**
 * @param {string} minerId A miner actor id, e.g. `f0142637`
 * @param {object} options
 * @param {number} [options.maxAttempts]
 * @returns {Promise<string>} Miner's PeerId, e.g. `12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG`
 */
export async function getIndexProviderPeerId (minerId, { maxAttempts = 5, smartContract, rpcFn } = {}) {
  try {
  // Make a concurrent request to both sources: FilecoinMinerInfo and smart contract
    const [minerInfoResult, contractResult] = await Promise.all([
      getIndexProviderPeerIdFromFilecoinMinerInfo(minerId, { maxAttempts, rpcFn }),
      getIndexProviderPeerIdFromSmartContract(minerId, { smartContract })
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
    throw new Error(`Failed to obtain Miner's Index Provider PeerID.\nSmartContract query result: ${contractResult}\nStateMinerInfo query result: ${minerInfoResult}`)
  } catch (error) {
    console.error('Error fetching PeerID:', error)
    throw Error(`Error fetching PeerID for miner ${minerId}.`, {
      cause: error
    })
  }
}

function getIndexProviderPeerIdFromFilecoinMinerInfo(minerId, arg1) {
  throw new Error('Function not implemented.')
}
function getIndexProviderPeerIdFromSmartContract(minerId, arg1) {
  throw new Error('Function not implemented.')
}

