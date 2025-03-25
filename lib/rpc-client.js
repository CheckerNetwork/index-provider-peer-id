import {
  FilecoinRpcError,
  INVALID_RPC_RESPONSE,
  NO_RESULT_IN_RESPONSE,
  RPC_ERROR,
} from './errors.js'

/**
 * @param {string} method
 * @param {unknown[]} params
 * @param {string} rpcUrl
 * @param {string} rpcAuth
 * @param {object} [options]
 * @param {globalThis.fetch} [options.fetch]
 */
export async function rpc(method, params, rpcUrl, rpcAuth, { fetch = globalThis.fetch } = {}) {
  const req = new Request(rpcUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accepts: 'application/json',
      authorization: `Bearer ${rpcAuth}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  })
  const res = await fetch(req, {
    signal: AbortSignal.timeout(60_000),
  })
  const body = await res.json()

  // Check for valid response structure
  if (!body || typeof body !== 'object') {
    throw new FilecoinRpcError(
      INVALID_RPC_RESPONSE,
      `Response body is not an object: ${body}`,
      method,
    )
  }

  if ('error' in body) {
    throw new FilecoinRpcError(
      RPC_ERROR,
      `Error while calling RPC method ${method}: ${JSON.stringify(body.error)}`,
      method,
    )
  }
  if (!('result' in body)) {
    throw new FilecoinRpcError(
      NO_RESULT_IN_RESPONSE,
      `Response body does not contain result: ${body}`,
      method,
    )
  }
  return body.result
}
