import { getListingUtxos } from '@/queries/orders-api'
import { getUtxos } from '@/queries/proxy'
import { useConnectionStore } from '@/stores/connection'

export async function getExcludedUtxos() {
  const address = useConnectionStore().getAddress

  return Promise.all([getUtxos(address), getListingUtxos()]).then(
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
              (l) => l.txid === utxo.txId && l.outputIndex === utxo.outputIndex
            )
        )
        .sort((a, b) => {
          return b.satoshis - a.satoshis
        })

      return allNotListingUtxos
    }
  )
}
