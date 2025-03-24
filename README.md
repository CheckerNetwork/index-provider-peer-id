# index-provider-peer-id

Functionality for fetching index provider peer IDs for a minder id on the Filecoin network.

## Constants

### Smart Contract Integration

This library interacts with the MinerPeerIDMapping smart contract on the Filecoin EVM to retrieve
peer ID data.

#### `MINER_TO_PEERID_CONTRACT_ADDRESS`

The Ethereum address of the deployed MinerPeerIDMapping contract.

#### Contract ABI

The ABI required to fetch peer ID and signature data
for a given miner ID.

For more information:

- [Smart Contract Documentation](https://github.com/filecoin-project/curio/blob/395bc47d0f585cbc869fd4671dc05b1b2f4b18c2/market/ipni/spark/sol/README.md)
- [Technical Background](https://docs.curiostorage.org/curio-market/ipni-interplanetary-network-indexer-provider#ipni-provider-identification)
