import { swapApiFetch } from '@/lib/fetch'
import { sleep } from '@/lib/helpers'
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
  addressEquity: string
  token1ServiceAddress: string
  token2ServiceAddress: string
  token1ServicePubkey: string
  token2ServicePubkey: string
}> => {
  const res = await swapApiFetch(
    `pools/${token1}-${token2}?address=${address}&net=${network}`
  )

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
  })

  return res
}

export const buildAdd = async ({
  token1,
  token2,
  source,
  sourceAmount,
  inscriptionIds,
}: {
  token1: string
  token2: string
  source: 'token1' | 'token2'
  sourceAmount: string
  inscriptionIds: string[]
}): Promise<{
  rawPsbt: string
  buildId: string
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
    inscriptionIds,
  }

  const res = await swapApiFetch('build/add', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res
}

export const buildRemove = async ({
  token1,
  token2,
  removeEquity,
}: {
  token1: string
  token2: string
  removeEquity: string
}): Promise<{
  rawPsbt: string
  buildId: string
}> => {
  const address = useConnectionStore().getAddress

  const body = {
    address,
    token1,
    token2,
    removeEquity,
  }

  const res = await swapApiFetch('build/remove', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res
}

export const build1xSwap = async ({
  token1,
  token2,
  sourceAmount,
}: {
  token1: string
  token2: string
  sourceAmount: string
}): Promise<{
  rawPsbt: string
  buildId: string
  type: '1x'
}> => {
  const address = useConnectionStore().getAddress
  const pubkey = useConnectionStore().getPubKey

  const body = {
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
  }

  const res = await swapApiFetch('build/1x', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res
}

export const buildX2Swap = async ({
  token1,
  token2,
  sourceAmount,
}: {
  token1: string
  token2: string
  sourceAmount: string
}): Promise<{
  rawPsbt: string
  buildId: string
  type: 'x2'
}> => {
  const address = useConnectionStore().getAddress
  const pubkey = useConnectionStore().getPubKey

  const body = {
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
  }

  const res = await swapApiFetch('build/x2', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res
}

export const build2xSwap = async ({
  token1,
  token2,
  sourceAmount,
  inscriptionIds,
}: {
  token1: string
  token2: string
  sourceAmount: string
  inscriptionIds: string[]
}): Promise<{
  rawPsbt: string
  buildId: string
  type: '2x'
}> => {
  const address = useConnectionStore().getAddress
  const pubkey = useConnectionStore().getPubKey

  const body = {
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
    inscriptionIds,
  }

  const res = await swapApiFetch('build/2x', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res
}

export const postSwap = async ({
  buildId,
  rawPsbt,
}: {
  buildId: string
  rawPsbt: string
}): Promise<{
  gas: string
  ratio: string
  poolRatio: string
  serviceFee: string
  sourceAmount: string
  targetAmount: string
}> => {
  const body = { buildId, rawPsbt }

  const res = await swapApiFetch('tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res
}

export const postAdd = async ({
  buildId,
  rawPsbt,
}: {
  buildId: string
  rawPsbt: string
}): Promise<{
  gas: string
  ratio: string
  poolRatio: string
  serviceFee: string
  sourceAmount: string
  targetAmount: string
}> => {
  const body = { buildId, rawPsbt }

  const res = await swapApiFetch('tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res
}
