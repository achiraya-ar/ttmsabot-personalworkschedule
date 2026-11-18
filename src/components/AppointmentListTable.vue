<template>
  <div class="mt-6">
    <table
      v-if="appointments.length > 0"
      class="appt-table w-full border-collapse mt-6"
    >
      <thead>
        <tr
          :class="
            props.isHoliday
              ? 'bg-[#FDE68A] text-[#78350F]'
              : 'bg-primary-dark text-white'
          "
        >
          <th class="px-4 py-3 text-left font-bold border border-border-light w-28">เวลา</th>
          <th class="px-4 py-3 text-left font-bold border border-border-light">รายละเอียด</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in appointments"
          :key="item.time"
          :class="rowClass(item.status, !!item.note)"
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
            <span
              v-if="item.note"
              class="cell-value mt-2 block rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-2.5 py-2 text-sm text-[#78350F]"
            >
              <span class="block text-xs font-bold text-[#92400E]">รายละเอียด:</span>
              <span class="block whitespace-pre-line">{{ item.note.note }}</span>
            </span>
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

const props = withDefaults(
  defineProps<{
    appointments: AppointmentItem[]
    isHoliday?: boolean
  }>(),
  {
    isHoliday: false,
  },
)

function rowClass(status: SlotStatus, hasNote: boolean): string {
  if (props.isHoliday) return 'bg-[#FEF3C7] text-[#78350F]'
  if (hasNote) return 'bg-[#FEF9C3]'
  if (status === 'BOOKED') return 'bg-row-booked'
  if (status === 'NOTE_HOLD') return 'bg-[#FEF9C3]'
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
