# index-provider-peer-id

Functionality for fetching index provider peer IDs for a minder id on the Filecoin network.

## Usage

### Getting a Miner's PeerId

The library provides a function to retrieve a miner's PeerId by querying both the Filecoin smart
contract and FilecoinMinerInfo. It will automatically try both sources and return the first valid
result.

```js
    maxAttempts = 5,
import { getIndexProviderPeerId, MINER_TO_PEERID_CONTRACT_ADDRESS, MINER_TO_PEERID_CONTRACT_ABI } from '@filecoin-station/index-provider-peer-id';
import { ethers } from 'ethers';

// Initialize your ethers contract instance
const provider = new ethers.providers.JsonRpcProvider('https://eth.example.com');
const contractAddress = MINER_TO_PEERID_CONTRACT_ADDRESS;
const contractAbi = MINER_TO_PEERID_CONTRACT_ABI;
const contract = new ethers.Contract(contractAddress, contractAbi, provider);

// Basic usage
const minerId = 'f0142637';
const peerId = await getIndexProviderPeerId(minerId, contract);
console.log(peerId); // e.g., '12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG'

// Advanced usage with options
const peerIdWithOptions = await getIndexProviderPeerId(minerId, contract, {
  maxAttempts: 3,                             // Number of retry attempts (default: 5)
  rpcUrl: 'https://custom-filecoin-api.com',  // Custom Filecoin RPC endpoint (default: 'https://api.node.glif.io/')
  rpcAuth: 'your-auth-token',                 // Optional authorization token for RPC
  rpcFn: customRpcFunction                    // Optional custom RPC function implementation.
});
```

The function prioritizes the smart contract result. If the smart contract doesn't return a valid
PeerId, it falls back to checking FilecoinMinerInfo. If both methods fail, an error is thrown with
details about the failure.

### Parameters

- `minerId`: A Filecoin miner actor ID (e.g., `f0142637`)
- `smartContract`: An ethers.js Contract instance for the Filecoin smart contract
- `options`: (Optional) Configuration object:
  - `maxAttempts`: Number of retry attempts for RPC calls (default: 5)
  - `rpcUrl`: Filecoin RPC endpoint URL (default: 'https://api.node.glif.io/')
  - `rpcAuth`: Authorization token for RPC endpoint (if required)
  - `rpcFn`: Custom function for making RPC calls. If not provided the default rpc function with the
    provided rpcUrl and rpcAuth will be used. If not rpcURL is provided, the default rpc function
    will use 'https://api.node.glif.io/' as the default rpcURL.

### Return Value

Returns a Promise that resolves to the miner's PeerId string (e.g.,
`12D3KooWMsPmAA65yHAHgbxgh7CPkEctJHZMeM3rAvoW8CZKxtpG`).

## Constants

### Smart Contract Integration

This library interacts with the MinerPeerIDMapping smart contract on the Filecoin EVM to retrieve
peer ID data.

#### `MINER_TO_PEERID_CONTRACT_ADDRESS`

The Ethereum address of the deployed MinerPeerIDMapping contract.

#### `MINER_TO_PEERID_CONTRACT_ABI`

The ABI required to fetch peer ID and signature data for a given miner ID.

For more information:

- [Smart Contract Documentation](https://github.com/filecoin-project/curio/blob/395bc47d0f585cbc869fd4671dc05b1b2f4b18c2/market/ipni/spark/sol/README.md)
- [Technical Background](https://docs.curiostorage.org/curio-market/ipni-interplanetary-network-indexer-provider#ipni-provider-identification)
