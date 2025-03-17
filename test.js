import { getIndexProviderPeerIdFromSmartContract } from './lib/smart-contract-client.js'
import { getIndexProviderPeerId } from './index.js'
import { describe, it } from 'node:test'
import assert from 'node:assert'

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
      if (!response) {
        throw new Error(`Miner ID ${minerId} not found in contract`)
      }
      return response
    },
  }
}

describe('getIndexProviderPeerIdFromSmartContract', () => {
  it('returns peer ID for valid miner ID', async () => {
    // Create mock contract with predefined responses
    const minerId = 12345
    const mockContract = createMockContract({
      [minerId]: validPeerIdResponse,
    })

    const actualPeerId = await getIndexProviderPeerIdFromSmartContract(`f0${minerId}`, {
      smartContract: mockContract,
    })

    assert.deepStrictEqual(actualPeerId, validPeerIdResponse.peerID)
  })
  it('returns correct peer id for miner f03303347', async () => {
    const peerId = await getIndexProviderPeerIdFromSmartContract('f03303347')
    assert.deepStrictEqual(typeof peerId, 'string', 'Expected peerId to be a string')
    assert.deepStrictEqual(peerId, '12D3KooWJ91c6xQshrNe7QAXPFAaeRrHWq2UrgXGPf8UmMZMwyZ5')
  })
  it('returns empty string for miner ID with no peer ID', async () => {
    // Create mock contract with predefined responses
    const minerId = 99999
    const mockContract = createMockContract({
      [minerId]: emptyPeerIdResponse,
    })

    const actualPeerId = await getIndexProviderPeerIdFromSmartContract(`f0${minerId}`, {
      smartContract: mockContract,
    })

    assert.deepStrictEqual(actualPeerId, '')
  })
  it('returns an error if the miner id is not a number', async () => {
    await assert.rejects(
      async () => {
        // Call your async function that should throw
        await getIndexProviderPeerIdFromSmartContract('abcdef')
      },
      (err) => {
        // Check if the error message contains the expected substring
        assert.ok(err.cause.toString().includes('minerID must be "f0{number}"'))
        return true
      },
    )
  })

  it('throws error for non-existent miner ID', async () => {
    // Create mock contract with predefined responses (empty to cause error)
    const mockContract = createMockContract({})
    await assert.rejects(
      async () =>
        await getIndexProviderPeerIdFromSmartContract('f055555', {
          smartContract: mockContract,
        }),
      (err) => {
        // Check if the error message contains the expected substring
        assert.ok(err.cause.toString().includes('Miner ID 55555 not found in contract'))
        return true
      },
    )
  })

  it('properly strips f0 prefix', async () => {
    // Create a mock that validates the minerId was correctly converted
    let receivedMinerId = null

    const mockContract = {
      getPeerData: async (minerId) => {
        receivedMinerId = minerId
        return validPeerIdResponse
      },
    }

    await getIndexProviderPeerIdFromSmartContract('f0123456', {
      smartContract: mockContract,
    })

    assert.deepStrictEqual(receivedMinerId, 123456)
  })
  // The smart contract returns an empty string if the peer ID is not set for a given miner id.
  // See: https://github.com/filecoin-project/curio/blob/533c12950ee87c0002c342ccfb4d5e058b08b180/market/ipni/spark/sol/contracts/MinerPeerIDMapping.sol#L89
  it('returns empty string if miner id does not exist in the smart contract', async () => {
    // This is a client ID not a miner ID so it will not exist in the smart contract
    // See: https://filecoin.tools/mainnet/deal/126288315
    const id = 'f03495400'
    const peerId = await getIndexProviderPeerIdFromSmartContract(id)
    assert.deepStrictEqual(peerId, '')
  })
})

describe('getIndexProviderPeerIdFromFilecoinMinerInfo', () => {})

describe('getIndexProviderPeerId', () => {
  it('returns correct peer id for miner f03303347', async () => {
    const peerId = await getIndexProviderPeerId('f03303347')

    assert(typeof peerId === 'string', 'Expected peerId to be a string')
    assert.deepStrictEqual(peerId, '12D3KooWJ91c6xQshrNe7QAXPFAaeRrHWq2UrgXGPf8UmMZMwyZ5')
  })
  it('returns peer ID from smart contract as the primary source', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: validPeerIdResponse,
    })
    const actualPeerId = await getIndexProviderPeerId(`f0${minerId}`, {
      smartContract: mockContract,
    })
    assert.deepStrictEqual(actualPeerId, validPeerIdResponse.peerID)
  })
  // The smart contract returns an empty string if the peer ID is not set for a given miner id.
  // See: https://github.com/filecoin-project/curio/blob/533c12950ee87c0002c342ccfb4d5e058b08b180/market/ipni/spark/sol/contracts/MinerPeerIDMapping.sol#L89
  it('returns peer ID from FilecoinMinerInfo as the secondary source if smart contract peer ID is empty', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: emptyPeerIdResponse,
    })
    const actualPeerId = await getIndexProviderPeerId(`f0${minerId}`, {
      smartContract: mockContract,
      rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID }),
    })
    assert.deepStrictEqual(actualPeerId, validPeerIdResponse.peerID)
  })
  it('returns peer ID from FilecoinMinerInfo as the secondary source if smart contract peer ID is undefined', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: { peerID: undefined },
    })
    const actualPeerId = await getIndexProviderPeerId(`f0${minerId}`, {
      smartContract: mockContract,
      rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID }),
    })
    assert.deepStrictEqual(actualPeerId, validPeerIdResponse.peerID)
  })
  it('throws error if both sources fail', async () => {
    const minerId = 3303347
    assert.rejects(
      async () =>
        await getIndexProviderPeerId(`f0${minerId}`, {
          smartContract: () => {
            throw Error('SMART CONTRACT ERROR')
          },
          rpcFn: () => {
            throw Error('MINER INFO ERROR')
          },
        }),
      (err) => {
        assert.ok(err.message.toString().includes(`Error fetching PeerID for miner f0${minerId}`))
        return true
      },
    )
  })

  it('throws an error if only the smart contract call fails', async () => {
    const minerId = 3303347
    assert.rejects(
      async () =>
        await getIndexProviderPeerId(`f0${minerId}`, {
          smartContract: () => {
            throw Error('SMART CONTRACT ERROR')
          },
          rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID }),
        }),
      (err) => {
        assert.ok(err.message.toString().includes(`Error fetching PeerID for miner f0${minerId}`))
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
      async () =>
        await getIndexProviderPeerId(`f0${minerId}`, {
          smartContract: mockContract,
          rpcFn: () => {
            throw Error('MINER INFO ERROR')
          },
        }),
      (err) => {
        assert.ok(err.message.toString().includes(`Error fetching PeerID for miner f0${minerId}`))
        return true
      },
    )
  })
})
