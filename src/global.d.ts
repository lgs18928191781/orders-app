/// <reference types="chrome" />
type BitcoinJs = typeof import('bitcoinjs-lib')
type ECPairFactory = typeof import('ecpair')
type TransferOutput = {
  genesis?: string
  codehash?: string
  type: 'token' | 'space' | string
  receivers: {
    address: string
    amount: string
  }[]
}
type TaskResponse = {
  id: number
  txid: string
  txHex: string
  routeCheckTxid?: string
  routeCheckTxHex?: string
}
type TransferResponse = {
  res: TaskResponse[]
  txids: string[]
  broadcasted: boolean
}

interface Window {
  bitcoinjs: BitcoinJs
  ecpair: ECPairFactory
  unisat: any
  unisat: {
    requestAccounts: () => Promise<string[]>
    inscribeTransfer: (tick: string) => Promise<string>
    signPsbt: (psbt: string) => Promise<string>
    pushPsbt: (psbt: string) => Promise<string>
    signPsbts: (psbts: string[], options: any[]) => Promise<string[]>
    switchNetwork: (
      network: 'livenet' | 'testnet',
    ) => Promise<'livenet' | 'testnet'>
  }
  okxwallet: {
    on: (event: string, callback: (data: any) => void) => void
    removeListener: (event: string, callback: (data: any) => void) => void
    bitcoin: {
      connect: () => Promise<{
        address: string
        publicKey: string
        compressedPublicKey: string
      }>
      on: (event: string, callback: (data: any) => void) => void
      removeListener: (event: string, callback: (data: any) => void) => void
      disconnect: () => Promise<void>
      getPublicKey: () => Promise<string>
      signMessage: (
        message: string,
        { from }: { from: string },
      ) => Promise<string>
      send: ({
        from,
        to,
        value,
        satBytes,
      }: {
        from: string
        to: string
        value: string // in btc
        satBytes?: string
      }) => Promise<string>
      signPsbt: (
        psbt: string,
        {
          from,
          type,
          autoFinalized,
        }?: {
          from?: string
          type?: any
          autoFinalized?: boolean
          toSignInputs?: any[]
        },
      ) => Promise<string>
      inscribe: ({
        type,
        from,
        tick,
      }: {
        type: 51
        from: string
        tick: string
      }) => Promise<string>
      sendPsbt: (
        txs: {
          itemId: string
          signedTx: string
          type: 52 | 22 | 59 // 22: NFT, 52: BRC20, 59: BRC20-s
        }[],
        from: string,
      ) => Promise<
        Record<
          string, // unique id
          string // txid
        >[]
      >
    }
  }
  metaidwallet: {
    verifySignature(verifyObj: {
      message: unknown
      signature: any
      encoding: string
    }): any
    getPublicKey(): any
    signMessage(arg0: {
      message: string
      encoding?: string
    }): { signature: any } | PromiseLike<{ signature: any }>
    getAddress(): any
    getMvcBalance: () => Promise<{
      address: string
      confirmed: number
      total: number
      unconfirmed: number
    }>
    switchNetwork: (network: 'livenet' | 'testnet') => Promise<{
      address: string
      network: 'mainnet' | 'testnet'
      status: string
    }>
    on: (
      eventName: string,
      handler: { mvcAddress: string; btcAddress: string } | any,
    ) => void
    removeListener: (
      eventName: string,
      handler: { mvcAddress: string; btcAddress: string } | any,
    ) => void
    getNetwork: () => Promise<{ network: 'mainnet' | 'testnet' }>
    connect: () => Promise<{
      address?: string
      pubKey?: string
      status?: string
    }>
    btc: {
      getAddress: () => Promise<string>
      getPublicKey: () => Promise<string>
      connect: () => Promise<{
        address?: string
        pubKey?: string
        status?: string
      }>
      getBalance: (chain: string) => Promise<{ total: number }>
      inscribeTransfer: (tick: string) => Promise<string>
      signMessage: (message: string) => Promise<string>
      signPsbt: ({
        psbtHex,
        options,
      }: {
        psbtHex: string
        options?: any
      }) => Promise<string>
      pushPsbt: (psbt: string) => Promise<string>
      signPsbts: (psbtHexs: string[], options?: any[]) => Promise<string[]>
    }
    token: {
      getBalance: () => Promise<any>
    }
    transfer: (params: {
      tasks: TransferOutput[]
      broadcast: boolean
    }) => Promise<TransferResponse>
  }
}
