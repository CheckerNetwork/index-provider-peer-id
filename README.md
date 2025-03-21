## Peer ID Lookup

Functionality for fetching index provider peer IDs for a minder id on the Filecoin network.

### Provider Initialization

Before using the functions fetching the peer IDs, you'll need to initialize an Filecoin provider and
contract instance. Here is an example using a `JsonRpcProvider` from the `ethers.js` library. You
can use other providers as well, as long as they are compatible with the `ethers.js` library.

```javascript
import { ethers } from 'ethers'
import { ABI, MINER_TO_PEERID_CONTRACT_ADDRESS } from 'index-provider-peer-id'

// Example rpc provider url for Glif node
const RPC_URL = 'https://api.node.glif.io/'

// Optional: authentication token for the RPC provider
const RPC_AUTH = '<YOUR_TOKEN>'

// Create a custom JsonRpcProvider with authorization header if auth token is provided
const fetchRequest = new ethers.FetchRequest(RPC_URL)

if (RPC_AUTH) {
  fetchRequest.setHeader('Authorization', `Bearer ${RPC_AUTH}`)
}

const provider = new ethers.JsonRpcProvider(fetchRequest)
return new ethers.Contract(MINER_TO_PEERID_CONTRACT_ADDRESS, ABI, provider)
```
