<template>
    <div>
        <TabGroup>
            <TabList class="flex items-center gap-6 ml-1" v-slot="{ selectedIndex }">
                <Tab v-for="(item, index) in tabs" :key="item.value" class="rounded py-2 text-left outline-none" :class="selectedIndex === index
                ? 'text-primary underline decoration-2 underline-offset-4'
                : 'text-zinc-500 hover:text-zinc-300'
                ">{{ item.label }}</Tab>
            </TabList>
            <TabPanels>
                <TabPanel v-for="item in tabs" :key="item.value">
                    <div v-if="item.value === 'Add'">
                        <MVCSwapAddLiq />
                    </div>
                    <div v-else>
                        <MVCSwapRemoveLiq />
                    </div>
                </TabPanel>
            </TabPanels>
        </TabGroup>
    </div>
</template>
<script setup lang="ts">
import { Ref, computed, ref, watch } from 'vue'
import {
    TabGroup,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
} from '@headlessui/vue'
import MVCSwapAddLiq from './MVCSwapAddLiq.vue';
const selectedIndex = ref<number>(0)
const tabs = ref([
    {
        value: 'Add',
        label: 'Add',
    },
    {
        value: 'Remove',
        label: 'Remove',
    },

])
</script>