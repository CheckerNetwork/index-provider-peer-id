export { MINER_TO_PEERID_CONTRACT_ADDRESS, MINER_TO_PEERID_CONTRACT_ABI } from './lib/constants.js'
/**
 * @param {string} minerId A miner actor id, e.g. `f0142637`
 * @returns {Promise<string>} Miner's PeerId, e.g. `12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG`
 */
export async function getIndexProviderPeerId(minerId) {
  return Promise.reject(new Error('Not implemented'))
}
