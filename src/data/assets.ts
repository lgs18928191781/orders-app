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
import eorbLogo from '@/assets/eorb.jpg?url'
import newuLogo from '@/assets/newu.jpg?url'

import { IS_DEV } from '@/data/constants'

const assets = [
  {
    id: 1,
    symbol: 'btc',
    icon: btcLogo,
    decimal: 8,
  },
  {
    id: 2,
    symbol: 'RDEX',
    icon: rdexLogo,
  },
  {
    id: 3,
    symbol: 'ordi',
    icon: ordiLogo,
  },
  {
    id: 4,
    symbol: 'OXBT',
    icon: oxbtLogo,
  },
  {
    id: 5,
    symbol: 'sats',
    icon: satsLogo,
  },
  {
    id: 6,
    symbol: 'GRUM',
    icon: grumLogo,
  },
  {
    id: 7,
    symbol: 'VMPX',
    icon: vmpxLogo,
  },
  {
    id: 8,
    symbol: 'trac',
    icon: tracLogo,
  },
  {
    id: 11,
    symbol: 'btcs',
    icon: btcsLogo,
  },
  {
    id: 12,
    symbol: 'ibtc',
    icon: ibtcLogo,
  },
  {
    id: 13,
    symbol: 'bili',
    icon: biliLogo,
  },
  {
    id: 14,
    symbol: 'cats',
    icon: catsLogo,
  },
  {
    id: 15,
    symbol: 'fish',
    icon: fishLogo,
  },
  {
    id: 16,
    symbol: 'sayc',
    icon: saycLogo,
  },
  {
    id: 17,
    symbol: 'rats',
    icon: ratsLogo,
  },
  {
    id: 1.1,
    symbol: 'eorb',
    icon: eorbLogo,
  },
  {
    id: 1.2,
    symbol: 'newu',
    icon: newuLogo,
  },
]

if (IS_DEV) {
  assets.push({
    id: 18,
    symbol: 'orxc',
    icon: rdexLogo,
  })
}

export default assets
