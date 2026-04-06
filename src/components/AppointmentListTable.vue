<template>
  <div class="mt-6">
    <table
      v-if="appointments.length > 0"
      class="appt-table w-full border-collapse mt-6"
    >
      <thead>
        <tr class="bg-primary-dark text-white">
          <th class="px-4 py-3 text-left font-bold border border-border-light w-28">เวลา</th>
          <th class="px-4 py-3 text-left font-bold border border-border-light">รายละเอียด</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in appointments"
          :key="item.time"
          :class="rowClass(item.status)"
        >
          <td class="px-4 py-3 border border-border-light align-top">
            <span class="cell-label sm:hidden">เวลา</span>
            <span class="cell-value font-semibold">{{ item.time }}</span>
          </td>
          <td class="px-4 py-3 border border-border-light align-top">
            <span class="cell-label sm:hidden">รายละเอียด</span>
            <span
              class="cell-value"
              :class="item.status === 'AVAILABLE' ? 'text-medium-gray italic font-medium' : ''"
              v-html="formatDescription(item.description)"
            ></span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Empty state -->
    <table v-else class="appt-table w-full border-collapse mt-6">
      <tbody>
        <tr>
          <td
            colspan="2"
            class="text-center text-status-gray-dark py-8 text-lg font-semibold border border-border-light"
          >
            ไม่มีตารางเวรในวันที่เลือก
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { AppointmentItem, SlotStatus } from '../types'

defineProps<{
  appointments: AppointmentItem[]
}>()

function rowClass(status: SlotStatus): string {
  if (status === 'BOOKED') return 'bg-row-booked'
  if (status === 'BLOCKED') return 'bg-row-blocked'
  return ''
}

/**
 * Converts **bold** markdown syntax to <strong> tags for display.
 */
function formatDescription(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}
</script>
