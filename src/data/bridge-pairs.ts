import btcLogo from '@/assets/btc.svg?url'
import { InjectionKey } from 'vue'

const bridgePairs = [
  {
    id: 1,
    fromSymbol: 'BTC',
    originName: 'BTC',
    toSymbol: 'TBTC',
    targetName: 'Test Bitcoin',
    fromIcon: btcLogo,
    toIcon: btcLogo,
    network: 'BTC',
    isNew: false,
  },
  {
    id: 2,
    fromSymbol: 'XEDR',
    originName: 'XEDR',
    toSymbol: 'XEDR',
    targetName: 'Test XEDR',
    fromIcon: btcLogo,
    toIcon: btcLogo,
    network: 'BRC20',
    isNew: false,
  },
] as {
  id: number
  fromSymbol: string
  originName: string
  toSymbol: string
  targetName: string
  fromIcon: string
  toIcon: string
  network: string
  isNew?: boolean
}[]

export default bridgePairs

export type BridgePair = (typeof bridgePairs)[0]

export const defaultPair = bridgePairs[0]

export const selectPair = (pairRaw?: string) => {
  const pairSymbols = (pairRaw || 'BTC-TBTC').split('-')
  return (
    bridgePairs.find(
      (pair) =>
        pair.fromSymbol === pairSymbols[0] && pair.toSymbol === pairSymbols[1]
    ) || bridgePairs[0]
  )
}

export const selectedPairKey = Symbol() as InjectionKey<BridgePair>
export const selectedPoolPairKey = Symbol() as InjectionKey<BridgePair>
