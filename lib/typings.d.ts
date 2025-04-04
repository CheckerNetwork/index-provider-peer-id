export interface MinerPeerIdSmartContract {
  getPeerData(minerId: number): Promise<{ peerID: string; signature: string }>
}
