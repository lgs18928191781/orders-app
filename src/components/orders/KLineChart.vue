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
    // labels: 1 to 30
    labels: [...Array(limit.value).keys()].map((i) => String(i + 1)),
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
  borderColor: '#8b5cf6',
  pointStyle: false,
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
    y: {
      beginAtZero: true,
    },
  },
})
</script>

<template>
  <div class="">
    <TabGroup class="py-2" as="div">
      <TabList class="p-1 bg-black inline-flex rounded-md gap-2">
        <Tab class="text-zinc-500 px-4 py-1 rounded text-sm"> 30D </Tab>

        <Tab class="text-zinc-500 px-4 py-1 rounded text-sm"> ALL </Tab>
      </TabList>
    </TabGroup>

    <div
      class="bg-black rounded-lg aspect-video flex items-center justify-center p-2"
    >
      <Line id="my-chart-id" :data="klineStats" :options="klineOptions" />
    </div>
  </div>
</template>

<style scoped></style>
