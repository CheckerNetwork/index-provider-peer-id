import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  getChainHead,
  getIndexProviderPeerIdFromFilecoinMinerInfo,
} from '../lib/filecoin-rpc-client.js'
import { rpc } from '../lib/rpc-client.js'

const { RPC_URL = 'https://api.node.glif.io/', RPC_AUTH } = process.env

describe('getChainHead', () => {
  it('should return chain head CIDs when RPC call succeeds', async () => {
    // Mock successful RPC response
    const mockCids = ['bafy2bzaceCNGWGhMF2fk2UrLbgBWnTfVaYEVRz6LwRVp4F4RPSoCJX2cNZ']
    const mockRpcFn = async (method, params) => {
      assert.strictEqual(method, 'Filecoin.ChainHead')
      assert.deepStrictEqual(params, [])
      return { Cids: mockCids }
    }

    const result = await getChainHead(mockRpcFn)
    assert.deepStrictEqual(result, mockCids)
  })

  it('should retry on failure and eventually succeed', async () => {
    let callCount = 0
    const mockRpcFn = async (method) => {
      assert.strictEqual(method, 'Filecoin.ChainHead')
      callCount++

      if (callCount < 3) {
        throw new Error('Temporary RPC error')
      }

      return { Cids: ['bafy2bzaceCID'] }
    }

    const result = await getChainHead(mockRpcFn, { maxAttempts: 5 })
    assert.deepStrictEqual(result, ['bafy2bzaceCID'])
    assert.strictEqual(callCount, 3, 'Function should have been called 3 times')
  })

  it('should throw an error when max retries are exceeded', async () => {
    const mockRpcFn = async () => {
      throw new Error('Persistent RPC error')
    }

    await assert.rejects(
      async () => {
        await getChainHead(mockRpcFn, { maxAttempts: 3 })
      },
      {
        message: 'Error fetching ChainHead.',
      },
    )
  })

  it('should include the original error as the cause', async () => {
    const originalError = new Error('Specific ChainHead error')
    const mockRpcFn = async () => {
      throw originalError
    }

    await assert.rejects(
      async () => {
        await getChainHead(mockRpcFn, { maxAttempts: 1 })
      },
      (err) => {
        assert.strictEqual(err.message, 'Error fetching ChainHead.')
        assert.strictEqual(err.cause, originalError)
        return true
      },
    )
  })
  it('correctly fetches real chain head', async () => {
    const result = await getChainHead(async (method, params) => {
      return await rpc(method, params, RPC_URL, { rpcAuth: RPC_AUTH })
    })
    assert.ok(Array.isArray(result))
    assert.ok(result.length > 0)
    assert.ok(result[0]['/'].startsWith('bafy'))
  })
})

describe('getIndexProviderPeerIdFromFilecoinMinerInfo', () => {
  it('should return peer ID when all RPC calls succeed', async () => {
    const mockChainHead = ['bafy2bzaceCID']
    const mockPeerId = '12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG'

    // Creates a mock RPC function that handles both ChainHead and StateMinerInfo calls
    const mockRpcFn = async (method, params) => {
      if (method === 'Filecoin.ChainHead') {
        return { Cids: mockChainHead }
      } else if (method === 'Filecoin.StateMinerInfo') {
        assert.strictEqual(params[0], 'f0142637')
        assert.deepStrictEqual(params[1], mockChainHead)
        return { PeerId: mockPeerId }
      }
      throw new Error(`Unexpected method: ${method}`)
    }

    const result = await getIndexProviderPeerIdFromFilecoinMinerInfo('f0142637', mockRpcFn)
    assert.strictEqual(result, mockPeerId)
  })

  it('should retry StateMinerInfo call on failure', async () => {
    const mockChainHead = ['bafy2bzaceCID']
    let stateMinerInfoCallCount = 0

    const mockRpcFn = async (method, params) => {
      if (method === 'Filecoin.ChainHead') {
        return { Cids: mockChainHead }
      } else if (method === 'Filecoin.StateMinerInfo') {
        stateMinerInfoCallCount++

        if (stateMinerInfoCallCount < 3) {
          throw new Error('Temporary StateMinerInfo error')
        }

        return { PeerId: '12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG' }
      }
    }

    const result = await getIndexProviderPeerIdFromFilecoinMinerInfo('f0142637', mockRpcFn, {
      maxAttempts: 5,
    })

    assert.strictEqual(result, '12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG')
    assert.strictEqual(stateMinerInfoCallCount, 3, 'StateMinerInfo should have been called 3 times')
  })

  it('should throw when ChainHead call fails', async () => {
    const mockRpcFn = async (method) => {
      if (method === 'Filecoin.ChainHead') {
        throw new Error('ChainHead error')
      }
    }

    await assert.rejects(
      async () => {
        await getIndexProviderPeerIdFromFilecoinMinerInfo('f0142637', mockRpcFn, {
          maxAttempts: 2,
        })
      },
      {
        message: 'Error fetching ChainHead.',
      },
    )
  })

  it('should throw error when StateMinerInfo fails after retries', async () => {
    const mockChainHead = ['bafy2bzaceCID']

    const mockRpcFn = async (method) => {
      if (method === 'Filecoin.ChainHead') {
        return { Cids: mockChainHead }
      } else if (method === 'Filecoin.StateMinerInfo') {
        throw new Error('Persistent StateMinerInfo error')
      }
    }

    await assert.rejects(
      async () => {
        await getIndexProviderPeerIdFromFilecoinMinerInfo('f0142637', mockRpcFn, {
          maxAttempts: 2,
        })
      },
      {
        message: 'Error fetching PeerID for miner f0142637.',
      },
    )
  })

  it('should include proper error message and cause for StateMinerInfo failures', async () => {
    const mockChainHead = ['bafy2bzaceCID']
    const originalError = new Error('Specific StateMinerInfo error')

    const mockRpcFn = async (method) => {
      if (method === 'Filecoin.ChainHead') {
        return { Cids: mockChainHead }
      } else if (method === 'Filecoin.StateMinerInfo') {
        throw originalError
      }
    }

    await assert.rejects(
      async () => {
        await getIndexProviderPeerIdFromFilecoinMinerInfo('f0142637', mockRpcFn, {
          maxAttempts: 1,
        })
      },
      (err) => {
        assert.strictEqual(err.message, 'Error fetching PeerID for miner f0142637.')
        assert.strictEqual(err.cause, originalError)
        return true
      },
    )
  })

  it('should correctly fetch read peer ID for miner f03303347', async () => {
    const peerId = await getIndexProviderPeerIdFromFilecoinMinerInfo(
      'f03303347',
      async (method, params) => {
        return await rpc(method, params, RPC_URL, { rpcAuth: RPC_AUTH })
      },
    )
    assert.deepStrictEqual(typeof peerId, 'string', 'Expected peerId to be a string')
    assert.deepStrictEqual(peerId, '12D3KooWCtiN7tAjeLKL4mashteXdH4htUrzWu8bWN9kDU3qbKjQ')
  })

  it('returns an error if the miner id cannot be found', async () => {
    await assert.rejects(
      async () => {
        await getIndexProviderPeerIdFromFilecoinMinerInfo(
          'f033033473425342342',
          async (method, params) => {
            return await rpc(method, params, RPC_URL, { rpcAuth: RPC_AUTH })
          },
        )
      },
      (err) => {
        assert.ok(err.cause.toString().includes('failed to load miner actor: actor not found'))
        return true
      },
    )
  })
})
