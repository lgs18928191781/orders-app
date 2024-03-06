import { type Ref, computed, ref } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { useRouter } from 'vue-router'

import { useTokenIcon } from '@/hooks/use-token-icon'

export function useSwapPool() {
  const pairStr = useRouteParams('pair') as Ref<string>

  const token1 = computed(() => pairStr.value.split('-')[0])
  const token2 = computed(() => pairStr.value.split('-')[1])

  const router = useRouter()
  function selectPair(pairStr: string) {
    if (!pairStr) return

    console.log('here')
    const route = router.currentRoute.value
    let nextRoutePath
    if (route.name === 'swap-pools-remove') {
      nextRoutePath = `/swap-pools/${pairStr}/remove`
    } else if (route.name === 'swap-pools-add') {
      nextRoutePath = `/swap-pools/${pairStr}/add`
    } else {
      nextRoutePath = `/swap/${pairStr}`
    }

    router.push(nextRoutePath)
  }

  const { iconUrl: token1Icon } = useTokenIcon(token1)
  const { iconUrl: token2Icon } = useTokenIcon(token2)

  return {
    pairStr,
    selectPair,
    token1,
    token2,
    token1Icon,
    token2Icon,
  }
}
