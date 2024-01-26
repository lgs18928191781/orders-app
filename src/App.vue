<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import * as secp256k1 from 'tiny-secp256k1'

import { useBtcJsStore } from '@/stores/btcjs'
import { useGeoStore } from '@/stores/geo'

import Toaster from '@/components/ui/toast/Toaster.vue'
import TheHeader from '@/components/header/TheHeader.vue'
import NotAvailableOverlay from '@/components/overlays/NotAvailable.vue'
import BuildingOverlay from '@/components/overlays/Building.vue'

import Decimal from 'decimal.js'

const btcJsStore = useBtcJsStore()
const geoStore = useGeoStore()

// After loaded, check if window width is less than 768px; if so, set isMobile to true
const isMobile = ref(false)


const swapTokenInfo = reactive({
  token1: 'token1',
  token2: 'token2',
})
const dimForward = ref(false)

// const token1 = ref(0)
// const token2 = computed(() => {
//   const token1Remove = new Decimal(token1.value).mul(10 ** 8).toNumber()
//   const swapToken1Amount = 12071561791
//   const swapToken2Amount = 2593956114
//   const swapFeeRate = 30
//   const projFeeRate = 12
//   const { token2AddAmount } = swapCalc.swapToken2ToToken1ByToken1(
//     token1Remove,
//     swapToken1Amount,
//     swapToken2Amount,
//     swapFeeRate,
//     projFeeRate
//   )
//   console.log('token2RemoveAmount', token2AddAmount)
//   return new Decimal(token2AddAmount).div(10 ** 6).toNumber()
// })

// const lp1 = ref(0)
// const lp2 = computed(() => {
//   const pairData = {
//     swapToken1Amount: 11888924484,
//     swapToken2Amount: 2653981922,
//     swapLpAmount: 25050191205,
//   }
//   const { swapToken1Amount, swapToken2Amount, swapLpAmount } = pairData
//   const origin_amount = formatSat(lp1.value, 8)

//   const { lpMinted, token2AddAmount } = swapCalc.countLpAddAmount(
//     origin_amount,
//     swapToken1Amount,
//     swapToken2Amount,
//     swapLpAmount
//   )

//   console.log('lpMinted', lpMinted, token2AddAmount)
//   // return {
//   //   token1RemoveAmount: formatTok(token1RemoveAmount, 8, 2),
//   //   token2RemoveAmount: formatTok(token2RemoveAmount, 6, 2),
//   // }
//   return formatTok(token2AddAmount, 6)
// })

// const tokenImspact = computed(() => {
//   const token1Info = {
//     decimal: dimForward.value ? 6 : 8,
//   }
//   const token2Info = {
//     decimal: dimForward.value ? 8 : 6,
//   }
//   const pairData = {
//     swapToken1Amount: 12071561791,
//     swapToken2Amount: 2593956114,
//   }
//   const originAddAmount = token1.value
//   const aimAddAmount = token2.value
//   const { slip1, slip2 } = swapCalc.tokenPriceImpact(
//     token1Info,
//     token2Info,
//     originAddAmount,
//     aimAddAmount,
//     pairData,
//     dimForward.value
//   )
//   console.log('token1Impact, token2Impact', slip1, slip2)
//   return {
//     slip1,
//     slip2,
//   }
// })

function changeToken() {
  if (swapTokenInfo.token1 == 'token1') {
    swapTokenInfo.token1 = 'token2'
    swapTokenInfo.token2 = 'token1'
  } else {
    swapTokenInfo.token1 = 'token1'
    swapTokenInfo.token2 = 'token2'
  }
}

onMounted(async () => {
  if (window.innerWidth < 768) {
    isMobile.value = true
  }

  // initialize btcjs
  const btcjs = window.bitcoin
  btcjs.initEccLib(secp256k1)
  btcJsStore.set(btcjs)

  // initialize related btc modules
  const ECPair = window.ecpair.ECPairFactory(secp256k1)
  btcJsStore.setECPair(ECPair)
})

const queryClient = useQueryClient()
queryClient.setDefaultOptions({
  queries: {
    staleTime: 1000 * 30, // 30 seconds
  },
})
</script>

<template>
  <Toaster />
  <BuildingOverlay />
  <NotAvailableOverlay v-if="false" />

  <template v-else>
    <TheHeader v-if="geoStore.pass" />
    <!-- <div>
      <div>
        <span>{{ swapTokenInfo.token1 }}:</span>
        <input type="text" v-model="token2" class="text-black" />
      </div>
      <div class="item-center flex text-white" @click="changeToken">
        dimForward
      </div>

      <div>
        <span>{{ swapTokenInfo.token2 }}:</span>
        <input type="text" v-model="token1" class="text-black" />
      </div>
      <div>
        <span class="text-white">token1Imspact:{{ tokenImspact.slip1 }}</span>
      </div>
      <div>
        <span class="text-white">token2Imspact:{{ tokenImspact.slip2 }}</span>
      </div>
    </div>

    <div>
      <div>pool</div>

      <div>
        <span> lpRemove::</span>
        <input type="text" v-model="lpRemove" class="text-black" />
      </div>

      <div>
        <div>
          <span>space:</span>
          <input type="text" v-model="lp1" class="text-black" />
        </div>
      </div>
      <div>
        <div>
          <span>usdt:</span>
          <input type="text" v-model="lp2" class="text-black" />
        </div>
      </div>
    </div> -->

    <router-view :key="$route.fullPath"></router-view>
  </template>
</template>

<style scoped></style>
