import assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  // MINER_TO_PEERID_CONTRACT_ADDRESS,
  // MINER_TO_PEERID_CONTRACT_ABI,
  getIndexProviderPeerId,
} from '../index.js'
//import { ethers } from 'ethers'

export const { RPC_URL = 'https://api.node.glif.io/', RPC_AUTH } = process.env
// Create a custom JsonRpcProvider with authorization header
const fetchRequest = new ethers.FetchRequest(RPC_URL)
fetchRequest.setHeader('Authorization', `Bearer ${RPC_AUTH}`)
const defaultProvider = new ethers.JsonRpcProvider(fetchRequest)
const smartContract = new ethers.Contract(
  MINER_TO_PEERID_CONTRACT_ADDRESS,
  MINER_TO_PEERID_CONTRACT_ABI,
  defaultProvider,
)
const validPeerIdResponse = {
  peerID: '12D3KooWGQmdpbssrYHWFTwwbKmKL3i54EJC9j7RRNb47U9jUv1U',
  signature: '0x1234567890abcdef',
}

const emptyPeerIdResponse = {
  peerID: '',
  signature: '0x',
}

// Mock contract factory
function createMockContract(mockResponses) {
  return {
    getPeerData: async (minerId) => {
      const response = mockResponses[minerId]
      return response ?? { peerID: '' }
    },
  }
}

describe('getIndexProviderPeerId', () => {
  it('returns correct peer id for miner f03303347', async () => {
    const { peerId, source } = await getIndexProviderPeerId('f03303347', smartContract)
    assert(source === 'smartContract', 'Expected source to be smartContract')
    assert(typeof peerId === 'string', 'Expected peerId to be a string')
    assert.deepStrictEqual(peerId, '12D3KooWJ91c6xQshrNe7QAXPFAaeRrHWq2UrgXGPf8UmMZMwyZ5')
  })

  it('returns peer ID from smart contract as the primary source', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: validPeerIdResponse,
    })
    const { peerId: actualPeerId, source } = await getIndexProviderPeerId(
      `f0${minerId}`,
      mockContract,
    )
    assert(source === 'smartContract', 'Expected source to be smartContract')
    assert.deepStrictEqual(actualPeerId, validPeerIdResponse.peerID)
  })

  // The smart contract returns an empty string if the peer ID is not set for a given miner id.
  // See: https://github.com/filecoin-project/curio/blob/533c12950ee87c0002c342ccfb4d5e058b08b180/market/ipni/spark/sol/contracts/MinerPeerIDMapping.sol#L89
  it('returns peer ID from FilecoinMinerInfo as the secondary source if smart contract peer ID is empty', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: emptyPeerIdResponse,
    })
    const { peerId: actualPeerId } = await getIndexProviderPeerId(`f0${minerId}`, mockContract, {
      rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID }),
    })
    assert.deepStrictEqual(actualPeerId, validPeerIdResponse.peerID)
  })

  it('returns peer ID from FilecoinMinerInfo as the secondary source if smart contract peer ID is undefined', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: { peerID: undefined },
    })
    const { peerId: actualPeerId } = await getIndexProviderPeerId(`f0${minerId}`, mockContract, {
      rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID }),
    })
    assert.deepStrictEqual(actualPeerId, validPeerIdResponse.peerID)
  })

  it('throws error if both sources fail', async () => {
    const minerId = 3303347
    const smartContract = () => {
      throw Error('SMART CONTRACT ERROR')
    }
    await assert.rejects(
      async () => {
        await getIndexProviderPeerId(`f0${minerId}`, smartContract, {
          rpcFn: () => {
            throw Error('MINER INFO ERROR')
          },
        })
      },
      (err) => {
        assert.ok(err.message, `Error fetching PeerID for miner f0${minerId}.`)
        return true
      },
    )
  })

  it('throws an error if only the smart contract call fails', async () => {
    const minerId = 3303347
    const smartContract = () => {
      throw Error('SMART CONTRACT ERROR')
    }
    await assert.rejects(
      async () => {
        await getIndexProviderPeerId(`f0${minerId}`, smartContract, {
          rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID }),
        })
      },
      (err) => {
        assert.ok(err.message, `Error fetching PeerID for miner f0${minerId}`)
        return true
      },
    )
  })

  it('throws an error if only the FilecoinMinerInfo fails', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: { peerID: undefined },
    })
    await assert.rejects(
      async () => {
        await getIndexProviderPeerId(`f0${minerId}`, mockContract, {
          rpcFn: () => {
            throw Error('MINER INFO ERROR')
          },
        })
      },
      (err) => {
        assert.ok(err.message, 'Error fetching PeerID for miner f03303347.')
        return true
      },
    )
  })

  it('aborts the request when signal is triggered', async () => {
    const minerId = '123456'

    // Create an AbortController
    const controller = new AbortController()
    const { signal } = controller

    const mockContract = {
      getPeerData: async () => {
        return { peerID: '' }
      },
    }

    // Abort after a short delay
    setTimeout(() => {
      controller.abort()
    }, 100)

    // Start the request
    await assert.rejects(
      async () =>
        await getIndexProviderPeerId(minerId, mockContract, {
          signal,
        }),
      (err) => {
        assert.ok(
          err.cause.cause.toString().includes('This operation was aborted'),
          `Expected error message: This operation was aborted, got ${err.cause}`,
        )
        return true
      },
    )
  })
})
