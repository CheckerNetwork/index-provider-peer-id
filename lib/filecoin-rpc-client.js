import { retry } from '../vendor/deno-deps.js'
import { RPC_URL, RPC_AUTH } from './constants.js'
import { getIndexProviderPeerIdFromSmartContract } from './smart-contract-client.js'

/**
 * @param {object} options
 * @param {number} [options.maxAttempts]
 * @param {function} [options.rpcFn]
 * @returns {Promise<string>} The chain head Cid
 */
async function getChainHead ({ maxAttempts = 5, rpcFn } = {}) {
  try {
    const res = await retry(() => (rpcFn ?? rpc)('Filecoin.ChainHead'), {
      // The maximum amount of attempts until failure.
      maxAttempts,
      // The initial and minimum amount of milliseconds between attempts.
      minTimeout: 5_000,
      // How much to backoff after each retry.
      multiplier: 1.5
    })
    return res.Cids
  } catch (err) {
    if (err.name === 'RetryError' && err.cause) {
      // eslint-disable-next-line no-ex-assign
      err = err.cause
    }
    err.message = `Cannot obtain chain head: ${err.message}`
    throw err
  }
}

/**
 * @param {string} minerId A miner actor id, e.g. `f0142637`
 * @param {object} options
 * @param {number} [options.maxAttempts]
 * @param {function} [options.rpcFn]
 * @returns {Promise<string>} Miner's PeerId, e.g. `12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG`
 */
export async function getIndexProviderPeerIdFromFilecoinMinerInfo (minerId, { maxAttempts = 5, rpcFn } = {}) {
  const chainHead = await getChainHead({ maxAttempts, rpcFn })
  try {
    const res = await retry(() => (rpcFn ?? rpc)('Filecoin.StateMinerInfo', minerId, chainHead), {
      // The maximum amount of attempts until failure.
      maxAttempts,
      // The initial and minimum amount of milliseconds between attempts.
      minTimeout: 5_000,
      // How much to backoff after each retry.
      multiplier: 1.5
    })
    return res.PeerId
  } catch (err) {
    if (err.name === 'RetryError' && err.cause) {
      // eslint-disable-next-line no-ex-assign
      err = err.cause
    }
    err.message = `Cannot obtain miner info for ${minerId}: ${err.message}`
    throw err
  }
}