import assert from 'assert'
/**
 * Query the smart contract for the peer ID mapping
 * @param {string} minerID - The miner ID (as string, will be converted to uint64)
 * @param {import('./typings.js').MinerPeerIdSmartContract} smartContract - The smart contract instance
 * @returns {Promise<string|null>} The peer ID from the contract or empty string if not found
 */
export async function getIndexProviderPeerIdFromSmartContract(minerID, smartContract) {
  try {
    // Convert minerID string (like 'f01234') to numeric ID
    const numericID = Number(minerID.replace('f0', ''))
    assert(!isNaN(numericID), `minerID must be "f0{number}". Actual value: "${minerID}"`)

    // Call the contract function
    const peerData = await smartContract.getPeerData(numericID)
    // TODO: Check if peerData.signature is valid
    return peerData.peerID
  } catch (error) {
    throw Error(`Error fetching peer ID from contract for miner ${minerID}.`, {
      cause: error,
    })
  }
}
