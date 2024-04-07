<script setup lang="ts">
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import { useConnectionStore } from '@/stores/connection'
import { useNetworkStore } from '@/stores/network'
import { storeToRefs } from 'pinia';
const connectionStore = useConnectionStore()
const networkStore = useNetworkStore()
const { connected, last } = storeToRefs(connectionStore);
const { isTestnet } = storeToRefs(networkStore);
type Condition = { condition: boolean, text: string, danger: boolean, disabled: boolean }
type Props = {
    conditions: Condition[] | undefined,
    loading?: boolean,
    className?: string
    submiting?: boolean
}
import { computed, ref, watch } from "vue";
const props = withDefaults(defineProps<Props>(), {
    conditions: undefined,
    loading: false,
    className: '',
    submiting: false
})
const danger = ref<boolean>(false)
const disabled = ref<boolean>(false)
const text = ref<string>('')
const emit = defineEmits(['submit'])
const tap = () => {
    const check = checkConditions(combineConditions.value);
    if (!check) {
        emit('submit')
    }

}
const checkConditions = (conditions: Condition[]) => {
    for (let i = 0; i < conditions.length; i++) {
        const { condition } = conditions[i];
        if (condition) {
            return conditions[i]
        }
    }
    return null
}
const combineConditions = computed(() => {
    return [

        {
            condition: !connected.value,
            text: 'Connect Wallet',
            danger: false,
            disabled: true
        },
        {
            condition: last.value.wallet !== 'metalet',
            text: 'Use Metalet',
            danger: false,
            disabled: true

        },
        {
            condition: !isTestnet.value,
            text: 'Switch To Testnet',
            danger: false,
            disabled: true
        },
        ...props.conditions||[]
    ]
})
watch([connected, last, isTestnet], () => {
    init(props)
})

const init = (props: Props) => {

    const check = checkConditions(combineConditions.value);
    if (check) {
        const { text: _text, danger: _danger, disabled: _disabled } = check;
        text.value = _text
        danger.value = _danger
        disabled.value = _disabled
    } else {
        text.value = ''
        danger.value = false
        disabled.value = false
    }
}
init(props)

watch(props, (_props) => {
    init(_props)
}, { deep: true })
</script>

<template>
    <button class="group relative z-30 inline-flex w-full cursor-pointer overflow-hidden rounded-2xl"
        :class="[disabled ? 'disabled' : '']" :disabled="submiting || disabled" @click="tap">
        <span
            class="group-disabled:bg-zinc-800! absolute inset-[-1000%] animate-[spin_2s_linear_infinite] group-enabled:bg-[conic-gradient(from_90deg_at_50%_50%,#FFA02A_0%,#dff7cc_30%,#FFA02A_100%)]"></span>
        <span
            class="m-0.5 inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-black bg-opacity-80 px-3 py-4 text-xl font-medium backdrop-blur-3xl transition-all duration-200 group-hover:bg-opacity-70 group-disabled:cursor-not-allowed group-disabled:bg-zinc-800 group-disabled:text-zinc-300/50 lg:m-px lg:bg-opacity-90"
            :class="[
            danger ? 'text-red-500' : 'text-primary group-hover:text-orange-100',

        ]">
            <Loader2Icon class="h-6 w-6 animate-spin text-zinc-500 ml-2" v-if="props.submiting" />
            <span v-if="text">
                {{ text }}
            </span>
            <span v-else>
                <slot></slot>
            </span>

        </span>
    </button>
</template>