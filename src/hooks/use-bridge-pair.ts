import { type Ref, computed, ref } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { useRouter } from 'vue-router'
import bridgePairs from '@/data/bridge-pairs'

export function useBridgePair() {
  const router = useRouter()

  const selectedPairId = ref(bridgePairs[0].id)

  const selectedPair = computed(() => {
    const pair = bridgePairs.find((a) => a.id === selectedPairId.value)
    if (pair) {
      return pair
    }

    throw new Error('Pair not found')
  })

  const defaultPairStr = `${bridgePairs[0].fromSymbol}-${bridgePairs[0].toSymbol}`
  const pairStr = useRouteParams('pair', defaultPairStr) as Ref<string>
  const fromSymbol = computed(() => pairStr.value.split('-')[0])
  const toSymbol = computed(() => pairStr.value.split('-')[1])

  const selected = bridgePairs.find(
    (a) =>
      a.fromSymbol.toUpperCase() === fromSymbol.value.toUpperCase() &&
      a.toSymbol.toUpperCase() === toSymbol.value.toUpperCase()
  )
  if (selected) {
    selectedPairId.value = selected.id
  }

  function selectBridgePair(id: number) {
    selectedPairId.value = id

    // redirect
    const pair = bridgePairs.find((pair) => pair.id === id)
    if (pair) {
      const pairSymbol = `${pair.fromSymbol}-${pair.toSymbol}`
      router.push({
        path: `/bridge/${pairSymbol}`,
      })
    }
  }

  return {
    pairStr,
    selectedPairId,
    selectedPair,
    selectBridgePair,
    fromSymbol,
    toSymbol,
  }
}
