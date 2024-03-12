import { swapApiFetch } from '@/lib/fetch'
import { sleep } from '@/lib/helpers'
import { type InscriptionUtxo } from '@/queries/swap/types'
import { useConnectionStore } from '@/stores/connection'
import { Network } from '@/stores/network'

export type SwapType = '1x' | 'x2' | '2x' | 'x1'

export const previewSwap = async ({
  token1,
  token2,
  swapType,
  sourceAmount,
}: {
  token1: string
  token2: string
  swapType: SwapType
  sourceAmount: string
}): Promise<{
  gas: string
  ratio: string
  poolRatio: string
  serviceFee: string
  sourceAmount: string
  targetAmount: string
  priceImpact: string
}> => {
  const address = useConnectionStore().getAddress

  const body = {
    address,
    token1,
    token2,
    swapType,
    sourceAmount,
  }

  const res = await swapApiFetch('preview/swap', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return res
}

export const previewAdd = async ({
  token1,
  token2,
  source,
  sourceAmount,
}: {
  token1: string
  token2: string
  source: 'token1' | 'token2'
  sourceAmount: string
}): Promise<{
  gas: string
  ratio: string
  serviceFee: string
  sourceAmount: string
  targetAmount: string
  addEquity: string
  poolEquity: string
}> => {
  const address = useConnectionStore().getAddress

  const body = {
    address,
    token1,
    token2,
    source,
    sourceAmount,
  }

  const res = await swapApiFetch('preview/add', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return res
}

export const previewRemove = async ({
  token1,
  token2,
  address,
  removeEquity,
}: {
  token1: string
  token2: string
  address: string
  removeEquity: string
}): Promise<{
  // token1: string
  // token2: string
  // token1Pool: number
  // token2Pool: number
  // poolEquity: string
  // addressEquity: string
  // token1ServiceAddress: string
  // token2ServiceAddress: string
  // token1ServicePubkey: string
  // token2ServicePubkey: string
  gas: string
  ratio: string
  serviceFee: string
  token1Amount: string
  token2Amount: string
  removeEquity: string
}> => {
  const body = {
    address,
    token1,
    token2,
    removeEquity,
  }

  const res = await swapApiFetch('preview/remove', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })

  return res
}

export const getPoolStatus = async ({
  token1,
  token2,
  address,
  network,
}: {
  token1: string
  token2: string
  address: string
  network: Network
}): Promise<{
  token1: string
  token2: string
  token1Pool: number
  token2Pool: number
  poolEquity: string

  token1ServiceAddress: string
  token2ServiceAddress: string
  token1ServicePubkey: string
  token2ServicePubkey: string
  token1PerToken2: string
  token2PerToken1: string
  token1PerToken2UsingBtcUnit: string
  token2PerToken1UsingBtcUnit: string

  addressEquityOverall: string
  addressEquityAvailable: string
  addressEquityPending: string

  poolShareAvailable: string
  poolSharePending: string
  token1AmountAvailable: string
  token2AmountAvailable: string
  token1AmountPending: string
  token2AmountPending: string
  token1AmountUsingBtcUnitAvailable: string
  token1AmountUsingBtcUnitPending: string
}> => {
  const res = await swapApiFetch(
    `pools/${token1}-${token2}?address=${address}&net=${network}`,
    {
      auth: true,
    },
  )

  return res
}

export const buildInit = async ({
  token1,
  token2,
  token1Amount,
  token2Amount,
  feeRate,
  inscriptionUtxos,
}: {
  token1: string
  token2: string
  token1Amount: string
  token2Amount: string
  feeRate: number
  inscriptionUtxos: InscriptionUtxo[]
}): Promise<{
  rawPsbt: string
  buildId: string
  feeRate: number
}> => {
  const address = useConnectionStore().getAddress
  const pubkey = useConnectionStore().getPubKey

  const body = {
    address,
    pubkey,
    token1,
    token2,
    token1Amount,
    token2Amount,
    inscriptionUtxos,
    feeRate,
  }

  const res = await swapApiFetch('build/init', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return {
    ...res,
    feeRate,
  }
}

export const buildAdd = async ({
  token1,
  token2,
  source,
  sourceAmount,
  feeRate,
  inscriptionUtxos,
}: {
  token1: string
  token2: string
  source: 'token1' | 'token2'
  sourceAmount: string
  feeRate: number
  inscriptionUtxos: InscriptionUtxo[]
}): Promise<{
  rawPsbt: string
  buildId: string
  feeRate: number
}> => {
  const address = useConnectionStore().getAddress
  const pubkey = useConnectionStore().getPubKey

  const body = {
    address,
    pubkey,
    token1,
    token2,
    source,
    sourceAmount,
    feeRate,
    inscriptionUtxos,
  }

  const res = await swapApiFetch('build/add', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return {
    ...res,
    feeRate,
  }
}

export const buildRemove = async ({
  token1,
  token2,
  removeEquity,
  feeRate,
}: {
  token1: string
  token2: string
  removeEquity: string
  feeRate: number
}): Promise<{
  rawPsbt: string
  buildId: string
  feeRate: number
}> => {
  const address = useConnectionStore().getAddress

  const body = {
    address,
    token1,
    token2,
    removeEquity,
    feeRate,
  }

  const res = await swapApiFetch('build/remove', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return {
    ...res,
    feeRate,
  }
}

export const build1xSwap = async ({
  token1,
  token2,
  sourceAmount,
  feeRate,
  inscriptionUtxos,
}: {
  token1: string
  token2: string
  sourceAmount: string
  feeRate: number
  inscriptionUtxos: InscriptionUtxo[]
}): Promise<{
  rawPsbt: string
  buildId: string
  type: '1x'
  feeRate: number
}> => {
  const address = useConnectionStore().getAddress
  const pubkey = useConnectionStore().getPubKey

  const body = {
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
    feeRate,
  }

  const res = await swapApiFetch('build/1x', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return {
    ...res,
    feeRate,
  }
}

export const buildX2Swap = async ({
  token1,
  token2,
  sourceAmount,
  feeRate,
  inscriptionUtxos,
}: {
  token1: string
  token2: string
  sourceAmount: string
  feeRate: number
  inscriptionUtxos: InscriptionUtxo[]
}): Promise<{
  rawPsbt: string
  buildId: string
  type: 'x2'
  feeRate: number
}> => {
  const address = useConnectionStore().getAddress
  const pubkey = useConnectionStore().getPubKey

  const body = {
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
    feeRate,
  }

  const res = await swapApiFetch('build/x2', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return {
    ...res,
    feeRate,
  }
}

export const build2xSwap = async ({
  token1,
  token2,
  sourceAmount,
  feeRate,
  inscriptionUtxos,
}: {
  token1: string
  token2: string
  sourceAmount: string
  feeRate: number
  inscriptionUtxos: InscriptionUtxo[]
}): Promise<{
  rawPsbt: string
  buildId: string
  type: '2x'
  feeRate: number
}> => {
  const address = useConnectionStore().getAddress
  const pubkey = useConnectionStore().getPubKey

  const body = {
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
    inscriptionUtxos,
    feeRate,
  }

  const res = await swapApiFetch('build/2x', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return {
    ...res,
    feeRate,
  }
}

export const postTask = async ({
  buildId,
  rawPsbt,
}: {
  buildId: string
  rawPsbt: string
}): Promise<{
  buildId: string
}> => {
  const address = useConnectionStore().getAddress
  const body = { buildId, rawPsbt, address }

  const res = await swapApiFetch('tasks', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  })
  return res
}
