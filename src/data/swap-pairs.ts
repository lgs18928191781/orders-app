import btcLogo from '@/assets/btc.svg?url'
import rdexLogo from '@/assets/rdex.png?url'
import ordiLogo from '@/assets/ordi.svg?url'
import satsLogo from '@/assets/sats.jpg?url'
import { IS_DEV } from '@/data/constants'

const swapPairs = [
  {
    id: 1,
    exactName: 'RDEX',
    token1Symbol: 'btc',
    token2Symbol: 'rdex',
    token1Icon: btcLogo,
    token2Icon: rdexLogo,
  },
  // {
  //   id: 2,
  //   exactName: 'ordi',
  //   token1Symbol: 'btc',
  //   token2Symbol: 'ordi',
  //   token1Icon: btcLogo,
  //   token2Icon: ordiLogo,
  // },
  // {
  //   id: 4,
  //   exactName: 'sats',
  //   token1Symbol: 'btc',
  //   token2Symbol: 'sats',
  //   token1Icon: btcLogo,
  //   token2Icon: satsLogo,
  //   useDecimals: 16,
  // },
] as {
  id: number
  exactName: string
  token1Symbol: string
  token2Symbol: string
  token1Icon: string
  token2Icon: string
  useDecimals?: number
}[]

if (IS_DEV) {
  swapPairs.unshift({
    id: 15,
    exactName: 'ORXC',
    token1Symbol: 'btc',
    token2Symbol: 'orxc',
    token1Icon: btcLogo,
    token2Icon: rdexLogo,
  })
}

export const testnetSwapPairs = [
  {
    id: 1,
    exactName: 'xedr',
    token1Symbol: 'btc',
    token2Symbol: 'xedr',
    token1Icon: btcLogo,
    token2Icon: rdexLogo,
  },
  // {
  //   id: 2,
  //   exactName: 'dexr',
  //   token1Symbol: 'btc',
  //   token2Symbol: 'dexr',
  //   token1Icon: btcLogo,
  //   token2Icon: rdexLogo,
  // },
]

export default swapPairs
