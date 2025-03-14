import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getIndexProviderPeerId } from './index.js'

describe('getIndexProviderPeerId', () => {
  it('should get the peer id for a given miner id', () => {
    assert.rejects(getIndexProviderPeerId('f0142637'))
  })
})
