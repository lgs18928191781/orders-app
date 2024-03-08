import { computed, type Ref } from 'vue'

export function useTokenIcon(token: Ref<string>) {
  if (!token.value) {
    return { iconUrl: computed(() => '') }
  }

  const normalizedName = computed(() => token.value.toLowerCase())
  const iconUrl = computed(
    () =>
      `https://y8u3ysgqmvgb0tsg.public.blob.vercel-storage.com/coins/${normalizedName.value}.png`,
  )

  return { iconUrl }
}
