import { swapApiFetch } from '@/lib/fetch'
import { useConnectionStore } from '@/stores/connection'

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
  console.log({ preview: res })
  return res
}

export const postSwap = async ({
  token1,
  token2,
  type,
  sourceAmount,
}: {
  token1: string
  token2: string
  type: SwapType
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
    type,
    sourceAmount,
  }

  const res = await swapApiFetch('tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  console.log({ res })
  return res
}
