<template>
  <div
    class="border-2 border-border-light rounded-xl p-4 flex flex-col transition-shadow duration-200 hover:shadow-lg bg-white"
  >
    <!-- Time -->
    <div class="text-2xl font-bold text-center mb-3 text-black">
      {{ slot.time }} <span class="text-base font-normal">น.</span>
    </div>

    <!-- Status Details -->
    <div
      :class="statusCardClass"
      class="flex-1 rounded-lg px-3 py-3 text-sm font-medium border text-center flex flex-col gap-2 justify-between"
    >
      <!-- BOOKED -->
      <template v-if="slot.status === 'BOOKED'">
        <p class="m-0 leading-relaxed">
          <strong class="block mb-1">จองโดย:</strong>
          {{ slot.details }}
        </p>
      </template>

      <!-- BLOCKED -->
      <template v-else-if="slot.status === 'BLOCKED'">
        <p class="m-0 leading-relaxed">
          <strong class="block mb-1">เหตุผล:</strong>
          {{ slot.details }}
        </p>
        <button
          v-if="canUnblock"
          :disabled="isProcessing"
          @click="onUnblock"
          class="mt-2 w-full bg-medium-gray text-white font-bold py-2 px-4 rounded-md text-sm cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fas fa-lock-open mr-1"></i>
          ปลดล็อก
        </button>
      </template>

      <!-- AVAILABLE -->
      <template v-else>
        <p class="m-0 leading-relaxed">
          <strong class="block mb-1">สถานะ:</strong>
          ว่าง
        </p>
        <button
          :disabled="isProcessing"
          @click="onBlock"
          class="mt-2 w-full bg-status-green text-white font-bold py-2 px-4 rounded-md text-sm cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fas fa-lock mr-1"></i>
          ล็อกคิว
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { handleSlotAction } from '../composables/useSlotAction'
import { useAuthStore } from '../stores/auth'
import type { SlotInfo } from '../types'

const props = defineProps<{
  slot: SlotInfo
  therapistName: string
  date: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const authStore = useAuthStore()
const isProcessing = ref(false)

// ── Computed ────────────────────────────────────────────────────────────────

/** Can this user unblock this slot? (manager always can; owner can unblock their own) */
const canUnblock = computed(() => {
  return (
    authStore.isManager ||
    props.slot.blockedBy === authStore.therapistName
  )
})

/** CSS classes for the status detail card */
const statusCardClass = computed(() => {
  switch (props.slot.status) {
    case 'BOOKED':
      return 'bg-booked-bg text-booked-text border-booked-border'
    case 'BLOCKED':
      return 'bg-blocked-bg text-blocked-text border-blocked-border'
    default:
      return 'bg-available-bg text-available-text border-available-border'
  }
})

// ── Actions ─────────────────────────────────────────────────────────────────

async function onBlock() {
  isProcessing.value = true
  try {
    await handleSlotAction(
      'block',
      props.slot.time,
      props.date,
      props.therapistName,
      authStore.isManager,
      authStore.therapistName ?? '',
      () => emit('refresh'),
    )
  } finally {
    isProcessing.value = false
  }
}

async function onUnblock() {
  isProcessing.value = true
  try {
    await handleSlotAction(
      'unblock',
      props.slot.time,
      props.date,
      props.therapistName,
      authStore.isManager,
      authStore.therapistName ?? '',
      () => emit('refresh'),
    )
  } finally {
    isProcessing.value = false
  }
}
</script>
