import { getIndexProviderPeerIdFromSmartContract } from './lib/smart-contract-client.js'
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { ethers } from 'ethers'
import { MINER_TO_PEERID_CONTRACT_ADDRESS, MINER_TO_PEERID_CONTRACT_ABI } from './index.js'

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

describe('getIndexProviderPeerIdFromSmartContract', () => {
  it('returns peer ID for valid miner ID', async () => {
    // Create mock contract with predefined responses
    const minerId = 12345
    const mockContract = createMockContract({
      [minerId]: validPeerIdResponse,
    })

    const actualPeerId = await getIndexProviderPeerIdFromSmartContract(`f0${minerId}`, mockContract)

    assert.deepStrictEqual(actualPeerId, validPeerIdResponse.peerID)
  })
  it('returns correct peer id for miner f03303347', async () => {
    const peerId = await getIndexProviderPeerIdFromSmartContract('f03303347', smartContract)
    assert.deepStrictEqual(typeof peerId, 'string', 'Expected peerId to be a string')
    assert.deepStrictEqual(peerId, '12D3KooWJ91c6xQshrNe7QAXPFAaeRrHWq2UrgXGPf8UmMZMwyZ5')
  })
  it('returns empty string for miner ID with no peer ID', async () => {
    // Create mock contract with predefined responses
    const minerId = 99999
    const mockContract = createMockContract({
      [minerId]: emptyPeerIdResponse,
    })

    const actualPeerId = await getIndexProviderPeerIdFromSmartContract(`f0${minerId}`, mockContract)

    assert.deepStrictEqual(actualPeerId, '')
  })
  it('returns an error if the miner id is not a number', async () => {
    await assert.rejects(
      async () => {
        // Call your async function that should throw
        await getIndexProviderPeerIdFromSmartContract('abcdef', smartContract)
      },
      (err) => {
        // Check if the error message contains the expected substring
        assert.ok(err.cause.toString().includes('minerID must be "f0{number}"'))
        return true
      },
    )
  })

  it('returns empty string for non-existent miner ID', async () => {
    // Create mock contract with predefined responses (empty to cause error)
    const mockContract = createMockContract({})
    const minerId = 99999
    const peerId = await getIndexProviderPeerIdFromSmartContract(`f0${minerId}`, mockContract)

    assert.deepStrictEqual(peerId, '')
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

    await getIndexProviderPeerIdFromSmartContract('f0123456', mockContract)

    assert.deepStrictEqual(receivedMinerId, 123456)
  })
  // The smart contract returns an empty string if the peer ID is not set for a given miner id.
  // See: https://github.com/filecoin-project/curio/blob/533c12950ee87c0002c342ccfb4d5e058b08b180/market/ipni/spark/sol/contracts/MinerPeerIDMapping.sol#L89
  it('returns empty string if miner id does not exist in the smart contract', async () => {
    // This is a client ID not a miner ID so it will not exist in the smart contract
    // See: https://filecoin.tools/mainnet/deal/126288315
    const id = 'f03495400'
    const peerId = await getIndexProviderPeerIdFromSmartContract(id, smartContract)
    assert.deepStrictEqual(peerId, '')
  })

  it('returns error if smart contract call fails', async () => {
    const mockContract = {
      getPeerData: async () => {
        throw new Error('SMART CONTRACT ERROR')
      },
    }
    await assert.rejects(
      async () => {
        await getIndexProviderPeerIdFromSmartContract('f0123456', mockContract)
      },
      (err) => {
        assert.ok(
          err.cause.toString().includes('SMART CONTRACT ERROR'),
          'Expected error message: SMART CONTRACT ERROR, got ' + err.cause,
        )
        return true
      },
    )
  })
})
