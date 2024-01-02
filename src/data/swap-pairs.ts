import btcLogo from '@/assets/btc.svg?url'
import rdexLogo from '@/assets/rdex.png?url'
import ordiLogo from '@/assets/ordi.svg?url'
import oxbtLogo from '@/assets/oxbt.png?url'
import satsLogo from '@/assets/sats.jpg?url'
import grumLogo from '@/assets/grum.png?url'
import vmpxLogo from '@/assets/vmpx.jpg?url'
import tracLogo from '@/assets/trac.png?url'
import saycLogo from '@/assets/sayc.jpg?url'
import fishLogo from '@/assets/fish.jpg?url'
import catsLogo from '@/assets/cats.jpg?url'
import btcsLogo from '@/assets/btcs.jpg?url'
import ibtcLogo from '@/assets/ibtc.jpg?url'
import biliLogo from '@/assets/bili.jpg?url'
import ratsLogo from '@/assets/rats.jpg?url'

import { useRoute } from 'vue-router'
import { InjectionKey } from 'vue'
import { IS_DEV } from '@/data/constants'

const swapPairs = [
  {
    id: 1,
    fromSymbol: 'btc',
    exactName: 'RDEX',
    toSymbol: 'rdex',
    fromIcon: btcLogo,
    toIcon: rdexLogo,
  },
  {
    id: 2,
    fromSymbol: 'btc',
    exactName: 'ordi',
    toSymbol: 'ordi',
    fromIcon: btcLogo,
    toIcon: ordiLogo,
  },
  {
    id: 4,
    fromSymbol: 'btc',
    exactName: 'sats',
    toSymbol: 'sats',
    fromIcon: btcLogo,
    toIcon: satsLogo,
    useDecimals: 16,
  },
] as {
  id: number
  fromSymbol: string
  exactName: string
  toSymbol: string
  fromIcon: string
  toIcon: string
  useDecimals?: number
}[]

if (IS_DEV) {
  swapPairs.push({
    id: 15,
    fromSymbol: 'btc',
    exactName: 'ORXC',
    toSymbol: 'orxc',
    fromIcon: btcLogo,
    toIcon: rdexLogo,
  })
}

export default swapPairs

export type TradingPair = (typeof swapPairs)[0]

export const defaultPair = swapPairs[0]

export const selectPair = (pairRaw?: string) => {
  const route = useRoute()
  const params = route.params
  const pairSymbols = (pairRaw || (params.pair as string) || 'rdex-btc').split(
    '-'
  )

  return (
    swapPairs.find(
      (pair) =>
        pair.fromSymbol === pairSymbols[0] && pair.toSymbol === pairSymbols[1]
    ) || swapPairs[0]
  )
}

export const selectedPairKey = Symbol() as InjectionKey<TradingPair>
export const selectedPoolPairKey = Symbol() as InjectionKey<TradingPair>
