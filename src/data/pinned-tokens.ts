import { NETWORK } from '@/data/constants'

export const livenetOrderbookTokens = ['RDEX', 'ordi', 'sats', 'BTCs']
export const testnetOrderbookTokens = ['xedr', 'okok']

export const livenetSwapTokens = ['RDEX']
export const testnetSwapTokens = ['xedr', 'dexr']

export const swapTokens =
  NETWORK === 'testnet' ? testnetSwapTokens : livenetSwapTokens
