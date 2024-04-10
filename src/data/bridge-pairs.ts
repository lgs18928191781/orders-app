import btc from '@/assets/btc.svg?url'
// import EX from '@/assets/bridge/btc/20EX.png?url'
// import AINN from '@/assets/bridge/btc/AINN.png?url'
// import AISN from '@/assets/bridge/btc/AISN.png?url'
// import BTCs from '@/assets/bridge/btc/BTCs.png?url'
// import core from '@/assets/bridge/btc/core.png?url'
// import cows from '@/assets/bridge/btc/cows.png?url'
// import eorb from '@/assets/bridge/btc/eorb.png?url'
// import insc from '@/assets/bridge/btc/insc.png?url'
// import korm from '@/assets/bridge/btc/korm.png?url'
// import ligo from '@/assets/bridge/btc/ligo.png?url'
// import merm from '@/assets/bridge/btc/merm.png?url'
// import moon from '@/assets/bridge/btc/moon.png?url'
// import ORDG from '@/assets/bridge/btc/ORDG.png?url'
// import ordi from '@/assets/bridge/btc/ordi.png?url'
// import pepe from '@/assets/bridge/btc/pepe.png?url'
// import piin from '@/assets/bridge/btc/piin.png?url'
// import PUPS from '@/assets/bridge/btc/PUPS.png?url'
// import rats from '@/assets/bridge/btc/rats.png?url'
// import sats from '@/assets/bridge/btc/sats.png?url'
// import satx from '@/assets/bridge/btc/satx.png?url'
// import π from '@/assets/bridge/btc/π.png?url'
// import πts from '@/assets/bridge/btc/πts.png?url'

// import wbtc from '@/assets/mvc/btc.png?url'
// import wEX from '@/assets/bridge/mvc/20EX.png?url'
// import wAINN from '@/assets/bridge/mvc/AINN.png?url'
// import wAISN from '@/assets/bridge/mvc/AISN.png?url'
// import wBTCs from '@/assets/bridge/mvc/BTCs.png?url'
// import wcore from '@/assets/bridge/mvc/core.png?url'
// import wcows from '@/assets/bridge/mvc/cows.png?url'
// import weorb from '@/assets/bridge/mvc/eorb.png?url'
// import winsc from '@/assets/bridge/mvc/insc.png?url'
// import wkorm from '@/assets/bridge/mvc/korm.png?url'
// import wligo from '@/assets/bridge/mvc/ligo.png?url'
// import wmerm from '@/assets/bridge/mvc/merm.png?url'
// import wmoon from '@/assets/bridge/mvc/moon.png?url'
// import wORDG from '@/assets/bridge/mvc/ORDG.png?url'
// import wordi from '@/assets/bridge/mvc/ordi.png?url'
// import wpepe from '@/assets/bridge/mvc/pepe.png?url'
// import wpiin from '@/assets/bridge/mvc/piin.png?url'
// import wPUPS from '@/assets/bridge/mvc/PUPS.png?url'
// import wrats from '@/assets/bridge/mvc/rats.png?url'
// import wsats from '@/assets/bridge/mvc/sats.png?url'
// import wsatx from '@/assets/bridge/mvc/satx.png?url'
// import wπ from '@/assets/bridge/mvc/π.png?url'
// import wπts from '@/assets/bridge/mvc/πts.png?url'

import { InjectionKey } from 'vue'
import { useNetworkStore } from '@/stores/network'
import { ref, Ref } from 'vue'
import { type assetReqReturnType } from '@/queries/bridge-api'
import { useRoute } from 'vue-router'
const route = useRoute()

const networkStore = useNetworkStore()

const bridgePairs: Ref<assetReqReturnType[]> = networkStore.isTestnet
  ? ref([
      {
        network: 'BTC',
        targetSymbol: 'BTC',
        originSymbol: 'BTC',
        id: 1,
      },
      //
      // {
      //   id: 1,
      //   fromSymbol: 'BTC',
      //   originName: 'BTC',
      //   toSymbol: 'BTC',
      //   targetName: 'Bitcoin test9',
      //   fromIcon: btc,
      //   toIcon: btc,
      //   network: 'BTC',
      //   isNew: false,
      // },
      // {
      //   id: 2,
      //   fromSymbol: 'XEDR',
      //   originName: 'XEDR',
      //   toSymbol: 'XEDR',
      //   targetName: 'XEDR test4',
      //   fromIcon: btc,
      //   toIcon: btc,
      //   network: 'BRC20',
      //   isNew: false,
      // },
      // {
      //   id: 3,
      //   fromSymbol: 'DEXR',
      //   originName: 'DEXR',
      //   toSymbol: 'DEXR',
      //   targetName: 'DEXR test4',
      //   fromIcon: btc,
      //   toIcon: btc,
      //   network: 'BRC20',
      //   isNew: false,
      // },
    ])
  : ref([
      {
        network: 'BTC',
        targetSymbol: 'BTC',
        originSymbol: 'BTC',
        id: 1,
      },
    ])

export default bridgePairs

export type BridgePair = (typeof bridgePairs.value)[0]

export const defaultPair = bridgePairs.value[0] || {
  network: 'BTC',
  targetSymbol: 'BTC',
  originSymbol: 'BTC',
  id: 1,
}

export const selectPair = (pairRaw?: string) => {
  const pairSymbols = (pairRaw || 'BTC-TBTC').split('-')
  return (
    bridgePairs.value.find(
      (pair) =>
        pair.originSymbol === pairSymbols[0] &&
        pair.targetSymbol === pairSymbols[1],
    ) || bridgePairs.value[0]
  )
}

export const getPairs = (bridgePairList: assetReqReturnType[]) => {
  const pariList = bridgePairList.map((item, id) => {
    return {
      id: id + 1,
      ...item,
    }
  })

  bridgePairs.value = pariList
}

export const selectedPairKey = Symbol() as InjectionKey<BridgePair>
export const selectedPoolPairKey = Symbol() as InjectionKey<BridgePair>
