import {
  FilecoinRpcError,
  INVALID_RPC_RESPONSE,
  NO_RESULT_IN_RESPONSE,
  RPC_ERROR,
} from './errors.js'

/**
 * @param {string} method
 * @param {unknown[]} params
 * @param {object} [options]
 * @param {string} [options.rpcUrl] URL of the RPC server
 * @param {string} [options.rpcAuth] Authorization token
 * @param {globalThis.fetch} [options.fetch]
 * @param {AbortSignal} [options.signal]
 */
export async function rpc(
  method,
  params,
  { rpcUrl = 'https://api.node.glif.io/', rpcAuth, fetch = globalThis.fetch, signal } = {},
) {
  /** @type {{
  'content-type': string,
  accepts: string,
  Authorization?: string
}} */
  let headers = {
    'content-type': 'application/json',
    accepts: 'application/json',
  }
  if (rpcAuth) {
    headers = {
      ...headers,
      Authorization: `Bearer ${rpcAuth}`,
    }
  }

  const req = new Request(rpcUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  })
  const res = await fetch(req, {
    signal,
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
