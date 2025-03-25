import { describe, it } from 'node:test'
import assert from 'node:assert'
import { rpc } from '../lib/rpc-client.js'
import {
  FilecoinRpcError,
  INVALID_RPC_RESPONSE,
  NO_RESULT_IN_RESPONSE,
  RPC_ERROR,
} from '../lib/errors.js'

export const { RPC_URL = 'https://api.node.glif.io/', RPC_AUTH } = process.env

describe('rpc client', () => {
  it('makes successful RPC calls', async () => {
    const expectedResult = { data: 'test result' }
    const mockFetch = async (req) => {
      // Verify request
      assert.strictEqual(req.method, 'POST')
      assert.strictEqual(req.headers.get('content-type'), 'application/json')

      const body = await req.json()
      assert.strictEqual(body.method, 'test.method')
      assert.deepStrictEqual(body.params, ['param1'])

      return {
        json: async () => ({ result: expectedResult }),
      }
    }

    const result = await rpc('test.method', ['param1'], RPC_URL, RPC_AUTH, { fetch: mockFetch })
    assert.deepStrictEqual(result, expectedResult)
  })

  it('throws on invalid response body', async () => {
    const mockFetch = async () => ({
      json: async () => null,
    })

    await assert.rejects(
      () => rpc('test.method', [], RPC_URL, RPC_AUTH, { fetch: mockFetch }),
      (err) => {
        assert.ok(err instanceof FilecoinRpcError)
        assert.strictEqual(err.name, INVALID_RPC_RESPONSE)
        return true
      },
    )
  })

  it('throws on RPC error response', async () => {
    const mockFetch = async () => ({
      json: async () => ({
        error: { code: -32000, message: 'Test error' },
      }),
    })

    await assert.rejects(
      () => rpc('test.method', [], RPC_URL, RPC_AUTH, { fetch: mockFetch }),
      (err) => {
        assert.ok(err instanceof FilecoinRpcError)
        assert.strictEqual(err.name, RPC_ERROR)
        return true
      },
    )
  })

  it('throws when response missing result', async () => {
    const mockFetch = async () => {
      return {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: 1,
            jsonrpc: '2.0',
          }),
      }
    }

    await assert.rejects(
      () => rpc('test.method', [], RPC_URL, RPC_AUTH, { fetch: mockFetch }),
      (err) => {
        assert.ok(
          err instanceof FilecoinRpcError,
          'Expected error to be instance of FilecoinRpcError: ' + err,
        )
        assert.strictEqual(err.name, NO_RESULT_IN_RESPONSE)
        return true
      },
    )
  })
})
