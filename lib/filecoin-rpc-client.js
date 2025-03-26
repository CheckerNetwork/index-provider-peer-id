import pRetry from 'p-retry'
/**
 * @param {object} options
 * @param {function} rpcFn The RPC function to use
 * @param {number} [options.maxAttempts]
 * @returns {Promise<string>} The chain head Cid
 */
export async function getChainHead(rpcFn, { maxAttempts = 5 } = {}) {
  try {
    const res = await pRetry(() => rpcFn('Filecoin.ChainHead', []), {
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
 * @param {function} rpcFn The RPC function to use
 * @param {object} options
 * @param {number} [options.maxAttempts]
 * @returns {Promise<string>} Miner's PeerId, e.g. `12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG`
 */
export async function getIndexProviderPeerIdFromFilecoinMinerInfo(
  minerId,
  rpcFn,
  { maxAttempts = 5 } = {},
) {
  const chainHead = await getChainHead(rpcFn, { maxAttempts })
  try {
    const res = await pRetry(() => rpcFn('Filecoin.StateMinerInfo', [minerId, chainHead]), {
      // The maximum amount of attempts until failure.
      retries: maxAttempts,
    })
    return res.PeerId
  } catch (err) {
    throw new Error(`Error fetching PeerID for miner ${minerId}.`, { cause: err })
  }
}
