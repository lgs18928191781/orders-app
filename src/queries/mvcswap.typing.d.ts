declare namespace MS {
  type TokenType = 'mvc20' | 'meta'
  type LPToken = {
    codeHash: string
    decimal: number
    genesisHash: string
    genesisTxid: string
    symbol: string
    tokenID: string
  }
  type Token = {
    codeHash: string
    decimal: number
    genesisHash: string
    genesisTxid: string
    symbol: string
    tokenID: string
    type?: TokenType
  }
  type Icon = {
    codehash: string
    genesis: string
    logo: string
    symbol: string
  }
  type Pair = {
    lptoken: LPToken
    poolAmount: string
    swapCodeHash: string
    swapGenesisTxid: string
    swapID: string
    test: false
    token1: Token
    token1Amount: string
    token2: Token
    token2Amount: string
    pairName?: string
  } & Partial<PairInfo>
  type PairInfo = {
    minProjFee: string
    projFeeRate: number
    swapFeeRate: number
    swapLpAmount: string
    swapToken1Amount: string
    swapToken2Amount: string
    totalLpFee24h: string
    totalVolume24h: string
    token1: Token
    token2: Token
    lptoken: LPToken
  }
  type SwapArgs = {
    mvcToAddress: string
    op: number
    projFeeRate: number
    requestIndex: string
    swapFeeRate: number
    swapLpAmount: string
    swapToken1Amount: string
    swapToken2Amount: string
    tokenToAddress: string
    txFee: number
  }
  interface Ret<T> {
    code: number
    data: T
    msg: string
  }
}
