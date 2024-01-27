import { swapApiFetch } from '@/lib/fetch'
import { useConnectionStore } from '@/stores/connection'

export const previewSwap = async ({
  token1,
  token2,
  token1Amount,
  token2Amount,
}: {
  token1: string
  token2: string
  token1Amount?: string
  token2Amount?: string
}): Promise<{
  gas: string
  priceImpact: string
  ratio: string
  serviceFee: string
  token1Amount: string
  token2Amount: string
}> => {
  if (!token1Amount && !token2Amount) {
    throw new Error('token1Amount or token2Amount must be provided')
  }

  const address = useConnectionStore().getAddress

  const body = {
    address,
    token1,
    token2,
    token1Amount,
    token2Amount,
  }

  const res = await swapApiFetch('preview/swap', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  console.log('previewSwap', res)
  return res
}
