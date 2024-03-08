import { createGlobalState } from '@vueuse/core'
import { computed, ref } from 'vue'

export const useOngoingTask = createGlobalState(() => {
  // state
  const taskId = ref('')

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
