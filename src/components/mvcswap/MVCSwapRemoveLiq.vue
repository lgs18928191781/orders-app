<template>
    <div v-if="curPair">
        <div class="swap-sub-control-panel flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <h3>Remove amount</h3>
                <div class="text-xs text-zinc-400">LP Balance: <span @click="removePercentage[0] = 100"
                        class="cursor-pointer text-primary  hover:underline">{{ lpTokenBal }}</span></div>
            </div>
            <div class="text-6xl leading-normal">{{ removePercentage[0] }}%</div>

            <Slider v-model="removePercentage" :max="100" :step="1" />

            <!-- percentage buttons -->
            <div class="mt-4 grid grid-cols-4 justify-between gap-4">
                <button :key="p" class="cute-button rounded-lg py-2 text-sm text-zinc-300"
                    @click="removePercentage[0] = p" v-for="p in presets">
                    {{ p }}%
                </button>
            </div>
        </div>
        <div class="flex justify-center mt-2 mb-2">
            <ArrowDownIcon class="size-4 text-zinc-500" />
        </div>
        <div class="swap-sub-static-panel text-2xl text-zinc-300">
            <div class="flex items-center justify-between gap-4">

                <div>{{ token1Amount }}</div>

                <div class="flex items-center gap-2">
                    <!-- <img :src="token1Icon" class="size-6 rounded-full" v-if="token1Icon" /> -->
                    <MVCSwapIcon :token="curPair.token1" />
                    <div class="">{{ (curPair.token1.symbol) }}</div>
                </div>
            </div>
            <div class="flex items-center justify-between gap-4">

                <div>{{ token2Amount }}</div>

                <div class="flex items-center gap-2">
                    <!-- <img :src="token1Icon" class="size-6 rounded-full" v-if="token1Icon" /> -->
                    <MVCSwapIcon :token="curPair.token2" />
                    <div class="">{{ (curPair.token2.symbol) }}</div>
                </div>
            </div>



        </div>
        <div class="mb-2 mt-3">
            <MVCSwapSubmitBtn :conditions="conditions" @submit="handleSubmit" :submiting="submiting">
                Remove
            </MVCSwapSubmitBtn>
        </div>

    </div>
    <MVCSwapSuccess :isOpen="successVisible" @handleSuccessVisible="handleSuccessVisible" />
</template>
<script setup lang="ts">
import { useMVCSwapStore } from '@/stores/mvcswap'
import { Slider } from '@/components/ui/slider'
import { ArrowDownIcon } from 'lucide-vue-next'
import { useConnectionStore } from '@/stores/connection'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia';
import BigNumber from 'bignumber.js'
import { formatTok, LeastFee } from '@/utils/mvcswap'
import { formatSat } from '@/utils'
import { removeLiq, reqSwap } from '@/queries/mvcswap'
import { gzip } from 'node-gzip';
import { ElMessage } from 'element-plus';
const successVisible = ref(false);
const handleSuccessVisible = (visible: boolean) => {
    successVisible.value = visible
}
const submiting = ref(false);
const store = useMVCSwapStore();
const { fetchPairs, fetchBalance, fetchPairInfo } = store
const connectionStore = useConnectionStore()
const { curPair, userBalance } = storeToRefs(store);
const token1Amount = ref<number | string>(0);
const removeLPAmount = ref<number | string>(0);
const token2Amount = ref<number | string>(0);
const presets = [25, 50, 75, 100]
const removePercentage = ref([0])

const lpTokenBal = computed(() => {
    if (curPair && curPair.value) {
        if (curPair.value.lptoken.symbol === 'SPACE') {
            return userBalance.value.space || '0'
        } else {
            return userBalance.value[curPair.value.lptoken.tokenID] || '0'
        }
    }
    return '0'
})

const conditions = computed(() => {
    if (!curPair.value) return []
    return [{
        condition: !Boolean(Number(removeLPAmount.value)),
        text: 'Enter an amount',
        danger: false,
        disabled: true

    },
    ]
})
const calc = (newVal: number[]) => {
    if (!curPair.value) return
    const { swapToken1Amount = '', swapToken2Amount = '', swapLpAmount = '', lptoken, token1, token2 } = curPair.value;
    const lpBal = userBalance.value[lptoken.tokenID];
    if (!lpBal) {
        token1Amount.value = 0
        token2Amount.value = 0;
        return
    }
    const [percent] = newVal;
    const removeLP = BigNumber(lpBal).multipliedBy(percent).div(100).toString();
    console.log(removeLP, !removeLP)
    if (!removeLP) {
        token1Amount.value = 0
        token2Amount.value = 0;
        return
    }

    let rate = BigNumber(formatTok(removeLP, lptoken.decimal)).div(
        swapLpAmount,
    );
    if (rate.isGreaterThan(1)) rate = BigNumber(1);
    const removeToken1 = formatSat(
        BigNumber(swapToken1Amount).multipliedBy(rate).toString(),
        token1.decimal,
    );
    const removeToken2 = formatSat(
        BigNumber(swapToken2Amount).multipliedBy(rate).toString(),
        token2.decimal,
    );
    token1Amount.value = removeToken1
    token2Amount.value = removeToken2;
    removeLPAmount.value = removeLP;
}
watch(removePercentage, (newVal) => {
    calc(newVal)
}, { deep: true })

watch(
    curPair,
    (newVlue, oldValue) => {
        if (newVlue) {
            calc(removePercentage.value)
            if (oldValue && newVlue.swapID !== oldValue.swapID) {
                token1Amount.value = 0;
                token2Amount.value = 0;
                removeLPAmount.value = 0
                removePercentage.value = [0]


            }

        }

    },
    { deep: true }
)

const handleSubmit = async () => {
    const removeLP = removeLPAmount.value;
    if (!curPair.value || !removeLP) return;
    try {


        submiting.value = true
        const { lptoken } = curPair.value;
        const pairName = curPair.value.pairName || ''
        const address = await connectionStore.adapter.getMvcAddress()
        const res = await reqSwap({
            symbol: pairName,
            address,
            op: 2,
            source: 'mvcswap.com'
        })
        if (res.code) {
            throw new Error(res.msg || 'canceled')
        }
        const { tokenToAddress, requestIndex, mvcToAddress, txFee } = res.data;
        const isLackBalance = LeastFee(txFee, userBalance.value.space);
        if (isLackBalance.code) {
            throw new Error(isLackBalance.msg);
        }
        const _removeLP = formatTok(removeLP, lptoken.decimal);
        const tx_res = await window.metaidwallet.transfer({
            broadcast: false,
            tasks: [
                {
                    type: 'space',
                    receivers: [{ address: mvcToAddress, amount: String(txFee) }],
                },
                {
                    type: 'token',
                    codehash: lptoken.codeHash,
                    genesis: lptoken.tokenID,
                    receivers: [{ address: tokenToAddress, amount: _removeLP.toString() }],
                }
            ],
        });
        if (tx_res.status === 'canceled') throw new Error(tx_res.status)
        if (!tx_res) {
            throw new Error('Transaction failed')
        }
        if (tx_res.msg) {
            throw new Error(tx_res.msg)
        }
        const retData = tx_res.res;
        if (!retData[0] || !retData[0].txHex || !retData[1] || !retData[1].txHex) {
            throw new Error('Transaction failed')
        }
        let liq_data = {
            symbol: pairName,
            requestIndex: requestIndex,
            mvcRawTx: retData[0].txHex,
            mvcOutputIndex: 0,
            lpTokenRawTx: retData[1].txHex,
            lpTokenOutputIndex: 0,
            amountCheckRawTx: retData[1].routeCheckTxHex,
        };

        const data = await gzip(JSON.stringify(liq_data));
        const ret = await removeLiq({ data });
        if (ret.code) throw new Error(ret.msg)
        await Promise.all([
            fetchPairs(),
            fetchBalance(),
            fetchPairInfo()
        ])
        removePercentage.value = [0]
        token1Amount.value = 0;
        token2Amount.value = 0;
        removeLPAmount.value = 0
        handleSuccessVisible(true)
    } catch (err) {
        console.log(err)
        ElMessage.error(err.message)
    }
    submiting.value = false
}


</script>