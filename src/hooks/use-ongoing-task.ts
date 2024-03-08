import { createGlobalState } from '@vueuse/core'
import { computed, ref } from 'vue'

export const useOngoingTask = createGlobalState(() => {
  // state
  const taskId = ref('0e2bcc04-80bc-491d-9bef-ed6c1e7598b9')

  const hasOngoing = computed(() => !!taskId.value)

  // actions
  const pushOngoing = (id: string) => {
    taskId.value = id
  }

  const clearOngoing = () => {
    taskId.value = ''
  }

  return {
    taskId,
    hasOngoing,
    pushOngoing,
    clearOngoing,
  }
})
