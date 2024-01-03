import { type Ref, computed, ref } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { useRouter } from 'vue-router'

import swapPairs from '@/data/swap-pairs'

export function useSwapPoolPair() {
  const router = useRouter()

  const selectedPairId = ref(swapPairs[0].id)
  const selectedPair = computed(() => {
    return swapPairs.find((a) => a.id === selectedPairId.value)
  })

  const pairStr = useRouteParams('pair') as Ref<string>
  const fromSymbol = computed(() => pairStr.value.split('-')[0])
  const toSymbol = computed(() => pairStr.value.split('-')[1])

  const selected = swapPairs.find(
    (a) =>
      (a.token1Symbol.toUpperCase() === fromSymbol.value.toUpperCase() &&
        a.token2Symbol.toUpperCase() === toSymbol.value.toUpperCase()) ||
      (a.token2Symbol.toUpperCase() === fromSymbol.value.toUpperCase() &&
        a.token1Symbol.toUpperCase() === toSymbol.value.toUpperCase())
  )
  if (selected) {
    selectedPairId.value = selected.id
  }
  // let order: 'asc' | 'desc' = 'asc'
  // if (
  //   selected &&
  //   selected.token1Symbol.toUpperCase() === fromSymbol.value.toUpperCase()
  // ) {
  //   order = 'asc'
  // } else {
  //   order = 'desc'
  // }

  // derive fromIcon and toIcon
  // const fromIcon = computed(() => {
  //   if (selectedPair.value) {
  //     if (order === 'asc') {
  //       return selectedPair.value.token1Icon
  //     } else {
  //       return selectedPair.value.token2Icon
  //     }
  //   }

  //   return null
  // })
  // const toIcon = computed(() => {
  //   if (selectedPair.value) {
  //     if (order === 'asc') {
  //       return selectedPair.value.token2Icon
  //     } else {
  //       return selectedPair.value.token1Icon
  //     }
  //   }

  //   return null
  // })

  function selectPair(id: number) {
    selectedPairId.value = id

    // redirect
    const pair = swapPairs.find((pair) => pair.id === id)
    if (pair) {
      const pairSymbol = `${pair.token1Symbol}-${pair.token2Symbol}`
      router.push({
        path: `/swap-pools/${pairSymbol}/add`,
      })
    }
  }

  return {
    pairStr,
    selectedPairId,
    selectedPair,
    selectPair,
    fromSymbol,
    toSymbol,
    // fromIcon,
    // toIcon,
  }
}
