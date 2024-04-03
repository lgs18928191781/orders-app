<template>
    <img :src="icon" class="size-6 rounded-full" v-if="icon && icon.length > 2" />
    <span class="size-6 rounded-full bg-black text-white text-sm flex items-center justify-center" v-else>
        {{ icon }}
    </span>
</template>
<script setup lang="ts">
import { useMVCSwapStore } from '@/stores/mvcswap'
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
const store = useMVCSwapStore();
const icon = ref<string>('')
const { icons } = storeToRefs(store);
const props = withDefaults(defineProps<{ token: MS.Token }>(), {
    token: undefined
})
const init = (props:{ token: MS.Token }) => {
    if (!props.token) {
        icon.value = '';
        return
    }
    const find = icons.value.find(item => item.symbol.toUpperCase() === props.token.symbol.toUpperCase());

    if (find) {
        icon.value = `https://icons.mvcswap.com/resources/${find.logo}`
    } else {
        
        icon.value = props.token.symbol[0].toUpperCase()
    }
}
init(props)
watch(props, (_props) => {
    init(_props)
}, { deep: true })
</script>