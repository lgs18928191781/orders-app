<script setup lang="ts">
import { Ref, computed, ref } from 'vue'
import { TabGroup, TabList, Tab } from '@headlessui/vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useQuery } from '@tanstack/vue-query'

import { getKLineStats, type KLineInterval } from '@/queries/orders-v2'
import { useTradingPair } from '@/hooks/use-trading-pair'
import { prettyDate, prettySymbol } from '@/lib/formatters'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const interval: Ref<KLineInterval> = ref('1d')
const limit = ref(30)
function changeStatsLimit(index: number) {
  limit.value = index === 0 ? 30 : 90
}

const { fromSymbol } = useTradingPair()
const { data: rawStats } = useQuery({
  queryKey: ['kline', { tick: fromSymbol, interval, limit }],
  queryFn: () =>
    getKLineStats({
      tick: fromSymbol.value,
      interval: interval.value,
      limit: limit.value,
    }),
  placeholderData: [],
  cacheTime: 1000 * 60 * 60, // 1 hour
})

const klineStats = computed(() => {
  if (!rawStats.value)
    return {
      labels: [],
      datasets: [
        {
          label: 'Price',
          data: [],
        },
      ],
    }

  return {
    labels: rawStats.value.map((stat) => prettyDate(stat.timestamp)),
    datasets: [
      {
        label: 'Price',
        data: rawStats.value.map((stat) => Number(stat.close)),
      },
    ],
  }
})

const klineOptions = ref({
  responsive: true,
  borderColor: '#a78bfa',

  pointStyle: false,
  aspectRatio: 1,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
      text: 'K Line Chart',
    },
  },
  scales: {
    x: {
      grid: {
        color: '#27272a',
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#27272a',
      },
    },
  },
})
</script>

<template>
  <div class="">
    <div class="flex items-center justify-between pb-4">
      <h3 class="font-bold text-base text-zinc-300">
        {{ prettySymbol(fromSymbol) }} Prices
      </h3>

      <TabGroup class="" as="div" @change="changeStatsLimit">
        <TabList class="p-1 bg-black inline-flex rounded-md gap-2">
          <Tab as="template" v-slot="{ selected }">
            <button
              :class="[
                ' px-4 py-1 rounded text-sm',
                selected ? 'bg-zinc-800 text-primary' : 'text-zinc-500',
              ]"
            >
              30D
            </button>
          </Tab>

          <Tab as="template" v-slot="{ selected }">
            <button
              :class="[
                ' px-4 py-1 rounded text-sm',
                selected ? 'bg-zinc-800 text-primary' : 'text-zinc-500',
              ]"
            >
              90D
            </button>
          </Tab>
        </TabList>
      </TabGroup>
    </div>

    <div
      class="bg-black rounded-md aspect-square flex items-center justify-center p-2"
    >
      <Line id="my-chart-id" :data="klineStats" :options="klineOptions" />
    </div>
  </div>
</template>

<style scoped></style>
