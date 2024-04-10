import { queryOptions, useQuery } from '@tanstack/vue-query'
import { ComputedRef, computed } from 'vue'

import { getListingUtxos } from '@/queries/orders-api'
import { getUtxos } from '@/queries/proxy'
import { address } from 'bitcoinjs-lib'

export const getExcludedBalance = async ({ address }: { address: string }) => {
  return Promise.all([getUtxos(address), getListingUtxos(address)]).then(
    ([allUtxos, listing]) => {
      const listingUtxos = listing.map((l) => {
        const [txid, vout] = l.dummyId.split(':')
        return {
          txid,
          outputIndex: Number(vout),
        }
      })

      const allNotListingUtxos = allUtxos
        .filter(
          (utxo) =>
            !listingUtxos.some(
              (l) => l.txid === utxo.txId && l.outputIndex === utxo.outputIndex,
            ),
        )
        .sort((a, b) => {
          return b.satoshis - a.satoshis
        })
      // const biggestUtxos = allNotListingUtxos.slice(0, USE_UTXO_COUNT_LIMIT)
      const biggestUtxos = allNotListingUtxos // we don't limit the number of utxos anymore

      return biggestUtxos.reduce((acc, utxo) => {
        return acc + utxo.satoshis
      }, 0)
    },
  )
}
export const getExcludedBalanceQuery = (
  filters: { address: string },
  enabled: ComputedRef<boolean> = computed(() => true),
) => {
  return queryOptions({
    queryKey: ['excludedBalance', filters],
    queryFn: () => getExcludedBalance(filters),
    enabled,
  })
}
