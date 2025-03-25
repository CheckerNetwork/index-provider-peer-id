export class FilecoinRpcError extends Error {
  /**
   * @param {string} message
   * @param {string} method
   * @param {string} name
   */
  constructor(name, message, method) {
    super(message)
    this.name = name
    this.method = method
    if ('captureStackTrace' in Error) {
      // Avoid MyError itself in the stack trace
      Error.captureStackTrace(this, FilecoinRpcError)
    }
  }
}

export const INVALID_RPC_RESPONSE = 'INVALID_RPC_RESPONSE'
export const RPC_ERROR = 'RPC_ERROR'
export const NO_RESULT_IN_RESPONSE = 'NO_RESULT_IN_RESPONSE'
