import { computed, type Ref } from 'vue'

export function useTokenIcon(token: Ref<string>) {
  const normalizedName = computed(() => token.value.toLowerCase())
  const iconUrl = computed(
    () =>
      `https://y8u3ysgqmvgb0tsg.public.blob.vercel-storage.com/coins/${normalizedName.value}.png`,
  )

  return { iconUrl }
}
