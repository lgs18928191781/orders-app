import { metasvApiFetch } from '@/lib/fetch'

type TokenDetail = {
  codeHash: string
  genesis: string
}

export const GetMvcTokenDetail = async (
  address: string,
  queryParams: TokenDetail
) => {
  const { codeHash, genesis } = queryParams
  return await metasvApiFetch(
    `/contract/ft/address/${address}/balance?codeHash=${codeHash}&genesis=${genesis}`,
    {
      method: 'GET',
    }
  )
}
