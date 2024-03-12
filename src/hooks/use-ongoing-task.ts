import { createGlobalState, useStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

export const useOngoingTask = createGlobalState(() => {
  // state
  const buildId = useStorage('ongoing-task-build-id', '')

  const hasOngoing = computed(() => !!buildId.value)

  // actions
  const pushOngoing = (id: string) => {
    buildId.value = id
  }

  const clearOngoing = () => {
    buildId.value = ''
  }

  return {
    buildId,
    hasOngoing,
    pushOngoing,
    clearOngoing,
  }
})
