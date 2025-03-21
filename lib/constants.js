export const MINER_TO_PEERID_CONTRACT_ADDRESS = '0x14183aD016Ddc83D638425D6328009aa390339Ce' // Contract address on the Filecoin EVM
// ABI for the MinerPeerIDMapping contract (minimal ABI with just the method we need)
// Docs for smart contract: https://github.com/filecoin-project/curio/blob/395bc47d0f585cbc869fd4671dc05b1b2f4b18c2/market/ipni/spark/sol/README.md
// Reasoning for smart contract: https://docs.curiostorage.org/curio-market/ipni-interplanetary-network-indexer-provider#ipni-provider-identification
export const ABI = [
  'function getPeerData(uint64 minerID) view returns (tuple(string peerID, bytes signature))',
]
