<template>
  <div
    class="border-2 rounded-xl p-4 flex flex-col transition-shadow duration-200 hover:shadow-lg"
    :class="
      props.isHoliday
        ? 'slot-card--holiday'
        : props.slot.note
          ? 'slot-card--noted'
          : 'border-border-light bg-white'
    "
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
      <!-- BOOKED / NOTE_HOLD: both use the same yellow note card styling -->
      <template
        v-if="slot.status === 'BOOKED' || slot.status === 'NOTE_HOLD'"
      >
        <p class="m-0 leading-relaxed">
          <strong class="block mb-1">จองโดย:</strong>
          {{ slot.details }}
        </p>

        <!-- Staff note (does not remove or change the booking) -->
        <div
          v-if="slot.note"
          class="rounded-lg border border-[#FCD34D] bg-white/80 px-2.5 py-2 text-left text-[#78350F]"
        >
          <p class="m-0 mb-0.5 text-xs font-bold text-[#92400E]">
            รายละเอียด:
          </p>
          <p class="m-0 text-sm leading-relaxed whitespace-pre-line">
            {{ slot.note.note }}
          </p>
        </div>

        <button
          v-if="slot.bookingId"
          :disabled="isProcessing"
          @click="isNoteModalOpen = true"
          class="mt-2 w-full bg-white font-bold py-2 px-4 rounded-md text-sm border-2 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="
            slot.note
              ? 'text-[#92400E] border-[#F59E0B] hover:bg-[#F59E0B] hover:text-white'
              : 'text-primary-blue border-primary-blue hover:bg-primary-blue hover:text-white'
          "
        >
          <i class="fas fa-note-sticky mr-1"></i>
          {{ slot.note ? "แก้ไข" : "เพิ่มโน๊ต" }}
        </button>
      </template>

      <!-- BLOCKED -->
      <template v-else-if="slot.status === 'BLOCKED'">
        <p class="m-0 leading-relaxed">
          <strong class="block mb-1"><i class="fas fa-lock mr-1"></i> ล็อกคิว</strong>
          {{ slot.details }}
        </p>
        <button
          v-if="canUnblock && !props.isHoliday"
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
          v-if="!props.isHoliday"
          :disabled="isProcessing"
          @click="onBlock"
          class="mt-2 w-full bg-status-green text-white font-bold py-2 px-4 rounded-md text-sm cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fas fa-lock mr-1"></i>
          ล็อกคิว
        </button>
        <p v-else class="mt-2 text-sm font-medium text-medium-gray">
          วันหยุด — ไม่สามารถล็อกคิว
        </p>
      </template>
    </div>

    <BookingNoteModal
      v-if="slot.status === 'BOOKED' || slot.status === 'NOTE_HOLD'"
      :open="isNoteModalOpen"
      :booking-id="slot.bookingId ?? ''"
      :patient-name="slot.patientName || slot.details || ''"
      :patient-phone="slot.patientPhone ?? slot.note?.patient_phone ?? ''"
      :date="date"
      :time="slot.time"
      :therapist-name="therapistName"
      :note="slot.note ?? null"
      @close="isNoteModalOpen = false"
      @saved="onNoteSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { handleSlotAction } from '../composables/useSlotAction'
import { useAuthStore } from '../stores/auth'
import type { SlotInfo } from '../types'
import BookingNoteModal from './BookingNoteModal.vue'

const props = defineProps<{
  slot: SlotInfo
  therapistName: string
  date: string
  isHoliday?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const authStore = useAuthStore()
const isProcessing = ref(false)
const isNoteModalOpen = ref(false)

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
  if (props.slot.note) {
    return 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
  }
  if (props.isHoliday) {
    return 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
  }
  switch (props.slot.status) {
    case 'BOOKED':
      return 'bg-booked-bg text-booked-text border-booked-border'
    case 'NOTE_HOLD':
      return 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
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

function onNoteSaved() {
  emit('refresh')
}
</script>
