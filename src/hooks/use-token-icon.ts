import { computed, ref, watchEffect, type Ref, toValue } from 'vue'

export function useTokenIcon(
  token: Ref<string | undefined>,
  wrapt: Ref<boolean> = ref(false),
) {
  let iconUrl = ref('')

  const use = () => {
    const rawToken = toValue(token)
    const isWrapt = toValue(wrapt)
    if (!rawToken) {
      return
    }

    const normalizedName = computed(() => rawToken.toLowerCase())
    const folder = isWrapt ? 'wrapt-coins' : 'coins'
    iconUrl.value = `https://y8u3ysgqmvgb0tsg.public.blob.vercel-storage.com/${folder}/${normalizedName.value}.png`
  }

  watchEffect(() => {
    use()
  })

  return { iconUrl }
}
