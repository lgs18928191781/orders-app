<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { MenuIcon, XIcon } from 'lucide-vue-next'

import logo from '@/assets/logo-new.png?url'
import { ChevronUpIcon } from 'lucide-vue-next'
import { ChevronsUpIcon } from 'lucide-vue-next'
import { VERSION } from '@/data/constants'

const open = ref(false)
</script>

<template>
  <button class="px-2 lg:hidden">
    <MenuIcon class="h-6 w-6 text-zinc-300" @click="open = true" />
  </button>

  <Teleport to="body">
    <TransitionRoot as="template" :show="open">
      <Dialog as="div" class="relative z-[99] lg:hidden" @close="open = false">
        <TransitionChild
          as="template"
          enter="ease-in-out duration-500"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in-out duration-500"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
          ></div>
        </TransitionChild>

        <div class="fixed inset-0 overflow-hidden">
          <div class="absolute inset-0 overflow-hidden">
            <div
              class="pointer-events-none fixed inset-0 top-0 flex max-w-full"
            >
              <TransitionChild
                as="template"
                enter="transform transition ease-in-out duration-300"
                enter-from="-translate-y-full"
                enter-to="translate-y-0"
                leave="transform transition ease-in-out duration-300"
                leave-from="translate-y-0"
                leave-to="-translate-y-full"
              >
                <DialogPanel
                  class="pointer-events-auto relative w-screen max-w-md"
                >
                  <div
                    class="flex h-full flex-col overflow-y-scroll bg-zinc-800 py-6 shadow-xl"
                  >
                    <div class="px-4 sm:px-6">
                      <DialogTitle class="flex items-center justify-between">
                        <div class="flex items-end gap-1">
                          <img
                            class="h-8 cursor-pointer lg:h-9"
                            :src="logo"
                            alt="Logo"
                          />

                          <span class="mb-1 text-xs text-zinc-300">
                            v{{ VERSION }}
                          </span>
                        </div>

                        <button
                          type="button"
                          class="relative rounded-md text-zinc-300 hover:text-white focus:outline-none"
                          @click="open = false"
                        >
                          <span class="sr-only">Close panel</span>
                          <ChevronsUpIcon class="h-6 w-6" aria-hidden="true" />
                        </button>
                      </DialogTitle>
                    </div>
                    <div class="relative mt-6 flex-1 px-4 sm:px-6">
                      <MobileAppHeaderMenuNav @close="open = false" />
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </Teleport>
</template>
