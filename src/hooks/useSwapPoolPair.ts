import { computed, ref } from 'vue'

const selectedPairId = ref(swapPairs[0].id)
const selectedPair = computed(() => {
  return swapPairs.find((a) => a.id === selectedPairId.value)
})

const pairStr = useRouteParams('pair') as Ref<string>
const [from, to] = pairStr.value.split('-')
const selected = swapPairs.find(
  (a) =>
    a.fromSymbol.toUpperCase() === from.toUpperCase() &&
    a.toSymbol.toUpperCase() === to.toUpperCase()
)
if (selected) {
  selectedPairId.value = selected.id
}
