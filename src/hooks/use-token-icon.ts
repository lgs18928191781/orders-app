import { computed, ref, watchEffect, type Ref, toValue } from 'vue'

export function useTokenIcon(token: Ref<string | undefined>) {
  let iconUrl = ref('')

  const use = () => {
    const rawToken = toValue(token)
    if (!rawToken) {
      return
    }

    const normalizedName = computed(() => rawToken.toLowerCase())
    iconUrl.value = `https://y8u3ysgqmvgb0tsg.public.blob.vercel-storage.com/coins/${normalizedName.value}.png`
  }

  watchEffect(() => {
    use()
  })

  return { iconUrl }
}
