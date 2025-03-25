describe('getIndexProviderPeerId', () => {
it('returns correct peer id for miner f03303347', async () => {
    const peerId = await getIndexProviderPeerId('f03303347')
  
    assert(typeof peerId === 'string', 'Expected peerId to be a string')
    assertEquals(peerId, '12D3KooWJ91c6xQshrNe7QAXPFAaeRrHWq2UrgXGPf8UmMZMwyZ5')
  })
  
  it('returns peer ID from smart contract as the primary source', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: validPeerIdResponse
    })
    const actualPeerId = await getIndexProviderPeerId(`f0${minerId}`, {
      smartContract: mockContract
    })
    assertEquals(actualPeerId, validPeerIdResponse.peerID)
  })
  
  // The smart contract returns an empty string if the peer ID is not set for a given miner id.
  // See: https://github.com/filecoin-project/curio/blob/533c12950ee87c0002c342ccfb4d5e058b08b180/market/ipni/spark/sol/contracts/MinerPeerIDMapping.sol#L89
  it('returns peer ID from FilecoinMinerInfo as the secondary source if smart contract peer ID is empty', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: emptyPeerIdResponse
    })
    const actualPeerId = await getIndexProviderPeerId(`f0${minerId}`, {
      smartContract: mockContract,
      rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID })
    })
    assertEquals(actualPeerId, validPeerIdResponse.peerID)
  })
  
  it('returns peer ID from FilecoinMinerInfo as the secondary source if smart contract peer ID is undefined', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: { peerID: undefined }
    })
    const actualPeerId = await getIndexProviderPeerId(`f0${minerId}`, {
      smartContract: mockContract,
      rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID })
    })
    assertEquals(actualPeerId, validPeerIdResponse.peerID)
  })
  
  it('throws error if both sources fail', async () => {
    const minerId = 3303347
    const err = await assertRejects(
      () => getIndexProviderPeerId(`f0${minerId}`, {
        smartContract: () => { throw Error('SMART CONTRACT ERROR') },
        rpcFn: () => { throw Error('MINER INFO ERROR') }
      }),
      Error
    )
    assertStringIncludes(err.message, 'Error fetching PeerID for miner f03303347.')
  })
  
  it('throws an error if only the smart contract call fails', async () => {
    const minerId = 3303347
    const err = await assertRejects(() => getIndexProviderPeerId(`f0${minerId}`, {
      smartContract: () => { throw Error('SMART CONTRACT ERROR') },
      rpcFn: () => Promise.resolve({ PeerId: validPeerIdResponse.peerID })
    }))
    assertStringIncludes(err.message, `Error fetching PeerID for miner f0${minerId}`)
  })
  
  it('throws an error if only the FilecoinMinerInfo fails', async () => {
    const minerId = 3303347
    const mockContract = createMockContract({
      [minerId]: { peerID: undefined }
    })
    const err = await assertRejects(() => getIndexProviderPeerId(`f0${minerId}`, {
      smartContract: mockContract,
      rpcFn: () => { throw Error('MINER INFO ERROR') }
    }))
    assertStringIncludes(err.message, 'Error fetching PeerID for miner f03303347.')
  })
})