<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue'

import { useModalConfirmRemoveLiquidity } from '@/hooks/use-modal-confirm-remove-liquidity'

const { isOpen, closeModal } = useModalConfirmRemoveLiquidity()
</script>

<template>
  <Teleport to="body">
    <Dialog :open="isOpen" @close="closeModal" class="bg-blue-500 text-white">
      <DialogPanel>
        <DialogTitle>Deactivate account</DialogTitle>
        <DialogDescription>
          This will permanently deactivate your account
        </DialogDescription>

        <p>
          Are you sure you want to deactivate your account? All of your data
          will be permanently removed. This action cannot be undone.
        </p>

        <button @click="closeModal">Cancel</button>
      </DialogPanel>
    </Dialog>
  </Teleport>
</template>
