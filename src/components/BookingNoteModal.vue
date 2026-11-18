<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-[100] flex items-end justify-center bg-[#0B1F3A]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      @click.self="!isSaving && emit('close')"
    >
      <div
        class="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-note-title"
      >
        <!-- Header -->
        <div
          class="flex items-start justify-between gap-4 border-b border-border-light px-5 py-4 sm:px-6"
        >
          <div>
            <p
              class="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-blue"
            >
              โน้ตการเปลี่ยนแปลง
            </p>
            <h2
              id="booking-note-title"
              class="mt-1 text-xl font-bold text-dark-gray"
            >
              {{ props.patientName || 'รายการจอง' }}
            </h2>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-medium-gray transition hover:bg-bg-light hover:text-primary-blue disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSaving"
            aria-label="ปิดหน้าต่างโน้ต"
            @click="emit('close')"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="overflow-y-auto px-5 py-4 sm:px-6">
          <!-- Booking summary -->
          <div
            class="grid gap-2 rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm text-dark-gray sm:grid-cols-3"
          >
            <div>
              <p class="text-xs text-medium-gray">วันที่</p>
              <p class="font-semibold">{{ formatThaiDate(props.date) }}</p>
            </div>
            <div>
              <p class="text-xs text-medium-gray">เวลา</p>
              <p class="font-semibold">{{ props.time }} น.</p>
            </div>
            <div>
              <p class="text-xs text-medium-gray">พนักงาน</p>
              <p class="font-semibold">{{ props.therapistName }}</p>
            </div>
          </div>

          <!-- Last edit info -->
          <div
            v-if="props.note"
            class="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-status-yellow/15 px-3 py-2 text-xs text-[#8a5a00]"
          >
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>โน๊ตล่าสุดโดย</span>
            <strong>{{ props.note.updated_by || 'ไม่ระบุชื่อ' }}</strong>
            <span v-if="props.note.updated_at">
              เมื่อ {{ formatThaiDateTime(props.note.updated_at) }}
            </span>
          </div>

          <!-- Editor -->
          <label
            for="booking-note-input"
            class="mt-4 mb-2 block text-sm font-semibold text-dark-gray"
          >
            รายละเอียด:
            <span class="text-status-red">*</span>
          </label>
          <textarea
            id="booking-note-input"
            v-model="noteText"
            rows="4"
            maxlength="500"
            :disabled="isSaving"
            class="w-full resize-y rounded-xl border-2 border-border-light bg-[#F8FBFF] px-4 py-3 text-base text-black outline-none transition placeholder:text-medium-gray focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/15 disabled:opacity-60"
            @input="errorMessage = ''"
          ></textarea>
          <div class="mt-1 flex items-start justify-between gap-3">
            <p class="m-0 text-xs leading-5 text-medium-gray">
              <i class="fa-solid fa-circle-info mr-1 text-primary-blue"></i>
              การบันทึกโน๊ตจะไม่ลบหรือเปลี่ยนสิทธิ์การจองของผู้ป่วย
              และโน๊ตนี้จะแสดงในหน้า ttmsabot-workschedule ด้วย
              หากคนไข้ยกเลิกการจองภายหลัง คิวนี้จะยังไม่เปิดให้จองจนกว่าจะลบโน๊ต
            </p>
            <span class="shrink-0 text-xs text-medium-gray">
              {{ noteText.length }}/500
            </span>
          </div>

          <div
            v-if="errorMessage"
            class="mt-3 flex items-start gap-2.5 rounded-xl border border-[#F5C2C7] bg-[#FFF5F5] px-4 py-3 text-sm leading-6 text-[#B42318]"
            role="alert"
          >
            <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="flex flex-col-reverse items-stretch gap-2 border-t border-border-light bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:items-center sm:px-6"
        >
          <button
            v-if="props.note"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F5C2C7] bg-white px-4 py-2.5 text-sm font-semibold text-status-red transition hover:bg-[#FFF5F5] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSaving"
            @click="handleDelete"
          >
            <i class="fa-solid fa-note-sticky"></i>
            ลบโน๊ต
          </button>

          <div class="ml-auto flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-border-light bg-white px-4 py-2.5 text-sm font-semibold text-medium-gray transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isSaving"
              @click="emit('close')"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-blue px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,123,255,0.24)] transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary-blue/20 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!canSave"
              @click="handleSave"
            >
              <i v-if="isSaving" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else class="fa-solid fa-floppy-disk"></i>
              {{ isSaving ? 'กำลังบันทึก...' : 'บันทึกโน๊ต' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import { deleteBookingNote, saveBookingNote } from '../composables/useBookingNotes'
import { formatThaiDate, formatThaiDateTime } from '../utils/helpers'
import type { BookingNote } from '../types'

const props = defineProps<{
  open: boolean
  bookingId: string
  patientName: string
  patientPhone?: string | null
  date: string
  time: string
  therapistName: string
  note: BookingNote | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const noteText = ref('')
const isSaving = ref(false)
const errorMessage = ref('')

const canSave = computed(
  () => noteText.value.trim().length > 0 && !isSaving.value,
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    noteText.value = props.note?.note ?? ''
    errorMessage.value = ''
    isSaving.value = false
  },
  { immediate: true },
)

async function handleSave() {
  if (!canSave.value) return

  if (!props.bookingId) {
    errorMessage.value =
      'ไม่พบรหัสการจองสำหรับรายการนี้ จึงยังไม่สามารถบันทึกโน๊ตได้'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  const { error } = await saveBookingNote({
    bookingId: props.bookingId,
    date: props.date,
    time: props.time,
    therapistName: props.therapistName,
    note: noteText.value,
    updatedBy: getCurrentUserName(),
    patientName: props.patientName,
    patientPhone: props.patientPhone,
  })

  isSaving.value = false

  if (error) {
    errorMessage.value = `บันทึกโน๊ตไม่สำเร็จ: ${error.message}`
    return
  }

  await Swal.fire({
    icon: 'success',
    title: 'บันทึกโน๊ตแล้ว',
    text: 'โน๊ตนี้จะแสดงในหน้า ttmsabot-workschedule ด้วย',
    timer: 1600,
    showConfirmButton: false,
  })

  emit('saved')
  emit('close')
}

async function handleDelete() {
  if (!props.bookingId) return

  const result = await Swal.fire({
    title: 'ลบโน๊ตนี้?',
    html: `โน๊ตของ <strong>${props.patientName}</strong><br>เวลา <strong>${props.time}</strong> น. วันที่ <strong>${formatThaiDate(props.date)}</strong><br><br>เมื่อลบโน๊ตนี้แล้ว หากคิวนี้ไม่มีการจองเหลืออยู่ ระบบจะเปิดให้จองคิวนี้ได้ตามปกติ`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบโน๊ต',
    cancelButtonText: 'ปิด',
    reverseButtons: true,
    confirmButtonColor: '#dc3545',
  })

  if (!result.isConfirmed) return

  isSaving.value = true
  errorMessage.value = ''

  const { error } = await deleteBookingNote(props.bookingId)
  isSaving.value = false

  if (error) {
    errorMessage.value = `ลบโน๊ตไม่สำเร็จ: ${error.message}`
    return
  }

  await Swal.fire({
    icon: 'success',
    title: 'ลบโน๊ตแล้ว',
    timer: 1200,
    showConfirmButton: false,
  })

  emit('saved')
  emit('close')
}

function getCurrentUserName(): string {
  return sessionStorage.getItem('therapistName') ?? ''
}
</script>
