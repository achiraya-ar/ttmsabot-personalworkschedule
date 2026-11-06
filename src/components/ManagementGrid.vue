<template>
  <div>
    <!-- Empty State -->
    <div
      v-if="!slots || slots.length === 0"
      class="text-center py-12 text-medium-gray font-medium text-lg border-2 border-dashed border-border-light rounded-xl"
    >
      <i class="fa-solid fa-calendar-xmark text-3xl mb-3 block text-light-gray"></i>
      ไม่มีตารางเวรในวันที่เลือก
    </div>

    <!-- Slot Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <SlotCard
        v-for="slot in slots"
        :key="slot.time"
        :slot="slot"
        :therapist-name="therapistName"
        :date="date"
        :is-holiday="isHoliday ?? false"
        @refresh="emit('refresh')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SlotCard from './SlotCard.vue'
import type { SlotInfo } from '../types'

defineProps<{
  slots: SlotInfo[]
  therapistName: string
  date: string
  isHoliday?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()
</script>
