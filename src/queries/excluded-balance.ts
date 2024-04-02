import { useQuery } from '@tanstack/vue-query'
import { ComputedRef } from 'vue'

import { getListingUtxos } from '@/queries/orders-api'
import { getUtxos } from '@/queries/proxy'

export const useExcludedBalanceQuery = (
  address: ComputedRef<string | undefined>,
  enabled: ComputedRef<boolean>,
) => {
  const queryFn = async () => {
    return Promise.all([getUtxos(address.value!), getListingUtxos()]).then(
      ([allUtxos, listing]) => {
        const listingUtxos = listing.map((l) => {
          const [txid, vout] = l.dummyId.split(':')
          return {
            txid,
            outputIndex: Number(vout),
          }
        })

        // choose 3 biggest utxos that are not in the listing
        const allNotListingUtxos = allUtxos
          .filter(
            (utxo) =>
              !listingUtxos.some(
                (l) =>
                  l.txid === utxo.txId && l.outputIndex === utxo.outputIndex,
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

  return useQuery({
    queryKey: ['excludedBalance', { address: address.value }],
    queryFn,
    enabled,
  })
}
