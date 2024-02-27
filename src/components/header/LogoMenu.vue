<script lang="ts" setup>
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Switch,
  SwitchGroup,
  SwitchLabel,
} from '@headlessui/vue'
import { useStorage } from '@vueuse/core'

import { VERSION } from '@/data/constants'
import { useFiat } from '@/hooks/use-fiat'

import logo from '@/assets/logo-new.png?url'
import pureLogo from '@/assets/rdex.png?url'

const useBtcUnit = useStorage('use-btc-unit', true)
const { isShowingFiat } = useFiat()
</script>

<template>
  <Menu class="relative" as="div">
    <div class="flex items-center">
      <MenuButton class="flex items-center gap-0.5 outline-none">
        <img class="h-8 cursor-pointer lg:hidden" :src="pureLogo" alt="Logo" />
        <img
          class="hidden h-9 cursor-pointer lg:block"
          :src="logo"
          alt="Logo"
        />
      </MenuButton>
    </div>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <MenuItems class="absolute left-0 z-50 mt-1 flex w-screen max-w-min">
        <div
          class="w-56 shrink divide-y divide-zinc-700 overflow-hidden rounded-xl bg-zinc-800 text-sm font-semibold leading-6 text-zinc-300 shadow-lg shadow-primary/20 ring-1 ring-zinc-900/5"
        >
          <MenuItem>
            <router-link to="/" class="block p-4 transition hover:text-primary">
              Home
            </router-link>
          </MenuItem>

          <MenuItem :disabled="true">
            <div class="flex items-center justify-between p-4 font-normal">
              <span class="text-zinc-500">Liquidity Mode</span>
              <span>PSBT</span>
            </div>
          </MenuItem>

          <MenuItem :disabled="true">
            <SwitchGroup
              as="div"
              class="flex items-center justify-between p-4 font-normal"
            >
              <SwitchLabel class="text-zinc-500">Unit</SwitchLabel>
              <Switch v-model="useBtcUnit" class="flex border-none">
                <span :class="[useBtcUnit ? 'text-primary' : 'text-zinc-500']">
                  BTC
                </span>
                <span class="px-2">/</span>
                <span :class="[useBtcUnit ? 'text-zinc-500' : 'text-primary']">
                  satoshis
                </span>
              </Switch>
            </SwitchGroup>
          </MenuItem>

          <MenuItem :disabled="true">
            <SwitchGroup
              as="div"
              class="flex items-center justify-between p-4 font-normal"
            >
              <SwitchLabel class="text-zinc-500">Show $ Price</SwitchLabel>
              <Switch
                v-model="isShowingFiat"
                :class="isShowingFiat ? 'bg-primary' : 'bg-black'"
                class="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
              >
                <span
                  aria-hidden="true"
                  :class="isShowingFiat ? 'translate-x-6' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
                ></span>
              </Switch>
            </SwitchGroup>
          </MenuItem>

          <MenuItem>
            <router-link
              to="/recover"
              class="block p-4 transition hover:text-primary"
            >
              Recover
            </router-link>
          </MenuItem>

          <MenuItem>
            <router-link
              to="/changelog"
              class="block p-4 transition hover:text-primary"
            >
              Changelog
            </router-link>
          </MenuItem>

          <MenuItem :disabled="true">
            <div class="flex items-center justify-between p-4 font-normal">
              <span class="text-zinc-500">Version</span>
              <span>{{ VERSION }}</span>
            </div>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
