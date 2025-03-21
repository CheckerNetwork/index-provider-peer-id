import pRetry from 'p-retry'
import { rpc } from './rpc-client.js'
/**
 * @param {object} options
 * @param {string} rpcUrl
 * @param {string} rpcAuth
 * @param {number} [options.maxAttempts]
 * @param {function} [options.rpcFn]
 * @returns {Promise<string>} The chain head Cid
 */
export async function getChainHead(rpcUrl, rpcAuth, { maxAttempts = 5, rpcFn = rpc } = {}) {
  try {
    const res = await pRetry(() => rpcFn('Filecoin.ChainHead', [], rpcUrl, rpcAuth), {
      // The maximum amount of attempts until failure.
      retries: maxAttempts,
    })
    return res.Cids
  } catch (err) {
    throw new Error('Error fetching ChainHead.', { cause: err })
  }
}

/**
 * @param {string} minerId A miner actor id, e.g. `f0142637`
 * @param {string} rpcUrl
 * @param {string} rpcAuth
 * @param {object} options
 * @param {number} [options.maxAttempts]
 * @param {function} [options.rpcFn]
 * @returns {Promise<string>} Miner's PeerId, e.g. `12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG`
 */
export async function getIndexProviderPeerIdFromFilecoinMinerInfo(
  minerId,
  rpcUrl,
  rpcAuth,
  { maxAttempts = 5, rpcFn = rpc } = {},
) {
  const chainHead = await getChainHead(rpcUrl, rpcAuth, { maxAttempts, rpcFn })
  try {
    const res = await pRetry(
      () => rpcFn('Filecoin.StateMinerInfo', [minerId, chainHead], rpcUrl, rpcAuth),
      {
        // The maximum amount of attempts until failure.
        retries: maxAttempts,
      },
    )
    return res.PeerId
  } catch (err) {
    throw new Error(`Error fetching PeerID for miner ${minerId}.`, { cause: err })
  }
}
