import { type Ref, computed, ref } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { useRouter } from 'vue-router'

import swapPairs, { testnetSwapPairs } from '@/data/swap-pairs'
import { useNetworkStore } from '@/stores/network'

export function useSwapPoolPair() {
  const network = useNetworkStore().network
  const usingSwapPairs = network === 'testnet' ? testnetSwapPairs : swapPairs
  const router = useRouter()

  const selectedPairId = ref(-1)
  const selectedPair = computed(() => {
    return usingSwapPairs.find((a) => a.id === selectedPairId.value)
  })

  const pairStr = useRouteParams('pair') as Ref<string>

  if (!pairStr.value) {
    pairStr.value = `${usingSwapPairs[0].token1Symbol}-${usingSwapPairs[0].token2Symbol}`
  }

  const token1Symbol = computed(() => pairStr.value.split('-')[0])
  const token2Symbol = computed(() => pairStr.value.split('-')[1])

  const selected = usingSwapPairs.find(
    (a) =>
      (a.token1Symbol.toUpperCase() === token1Symbol.value.toUpperCase() &&
        a.token2Symbol.toUpperCase() === token2Symbol.value.toUpperCase()) ||
      (a.token2Symbol.toUpperCase() === token1Symbol.value.toUpperCase() &&
        a.token1Symbol.toUpperCase() === token2Symbol.value.toUpperCase()),
  )
  if (selected) {
    selectedPairId.value = selected.id
  } else {
    // reset to default
    selectedPairId.value = -1
  }

  function selectPair(id: number) {
    selectedPairId.value = id

    // redirect
    const pair = usingSwapPairs.find((pair) => pair.id === id)
    if (pair) {
      const pairSymbol = `${pair.token1Symbol}-${pair.token2Symbol}`
      const route = router.currentRoute.value
      let nextRoutePath
      if (route.name === 'swap-pools-remove') {
        nextRoutePath = `/swap-pools/${pairSymbol}/remove`
      } else if (route.name === 'swap-pools-add') {
        nextRoutePath = `/swap-pools/${pairSymbol}/add`
      } else {
        nextRoutePath = `/swap/${pairSymbol}`
      }

      router.push(nextRoutePath)
    }
  }

  return {
    pairStr,
    selectedPairId,
    selectedPair,
    selectPair,
    token1Symbol,
    token2Symbol,
  }
}
