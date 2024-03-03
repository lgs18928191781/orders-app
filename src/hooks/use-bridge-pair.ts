// import { type Ref, computed, ref } from 'vue'

// import tradingPairs from '@/data/trading-pairs'

// export function useBridgePair() {
//   const router = useRouter()

//   const selectedPairId = ref(tradingPairs[0].id)
//   const selectedPair = computed(() => {
//     const pair = tradingPairs.find((a) => a.id === selectedPairId.value)
//     if (pair) {
//       return pair
//     }

//     throw new Error('Pair not found')
//   })

//   const defaultPairStr = `${tradingPairs[0].fromSymbol}-${tradingPairs[0].toSymbol}`
//   const pairStr = useRouteParams('pair', defaultPairStr) as Ref<string>
//   const fromSymbol = computed(() => pairStr.value.split('-')[0])
//   const toSymbol = computed(() => pairStr.value.split('-')[1])

//   const selected = tradingPairs.find(
//     (a) =>
//       a.fromSymbol.toUpperCase() === fromSymbol.value.toUpperCase() &&
//       a.toSymbol.toUpperCase() === toSymbol.value.toUpperCase()
//   )
//   if (selected) {
//     selectedPairId.value = selected.id
//   }

//   function selectPair(id: number) {
//     selectedPairId.value = id

//     // redirect
//     const pair = tradingPairs.find((pair) => pair.id === id)
//     if (pair) {
//       const pairSymbol = `${pair.fromSymbol}-${pair.toSymbol}`
//       router.push({
//         path: `/orders/${pairSymbol}`,
//       })
//     }
//   }

//   return {
//     pairStr,
//     selectedPairId,
//     selectedPair,
//     selectPair,
//     fromSymbol,
//     toSymbol,
//   }
// }
