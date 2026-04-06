<template>
  <div>
    <!-- Header Section -->
    <div
      class="flex flex-wrap justify-between items-center gap-4 mb-5 pb-4 border-b-2 border-border-light"
    >
      <h3 class="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary-blue flex-grow m-0">
        <i class="fa-solid fa-calendar-alt"></i>
        จัดการตารางเวลา
        <span class="text-base font-normal text-medium-gray ml-1">({{ formatThaiDate(selectedDate) }})</span>
      </h3>

      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <!-- Date Picker -->
        <input
          v-model="selectedDate"
          type="date"
          :min="today"
          :max="maxDate"
          class="px-4 py-2 border-2 border-border-light rounded-lg text-base font-sans bg-white text-black transition-all duration-200 focus:outline-none focus:border-primary-blue focus:ring-[5px] focus:ring-primary-blue/25 w-full md:w-auto min-w-[200px]"
        />

        <!-- Back Button -->
        <button
          class="px-5 py-2 bg-status-gray-dark text-white font-semibold rounded-md cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px w-full md:w-auto"
          @click="goBack"
        >
          <i class="fa-solid fa-arrow-left mr-2"></i>
          กลับเมนู
        </button>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="isLoading" message="กำลังโหลดข้อมูล..." />

    <template v-else>
      <!-- Management Grid -->
      <ManagementGrid
        :slots="dashboardData?.scheduleSlots ?? []"
        :therapist-name="therapistName"
        :date="selectedDate"
        @refresh="loadData"
      />

      <!-- Divider -->
      <hr class="my-8 border-t-2 border-border-light" />

      <!-- Appointment List -->
      <h3 class="flex items-center gap-2 text-lg md:text-xl font-bold text-primary-blue mb-2">
        <i class="fa-solid fa-list-check"></i>
        รายการนัดหมาย
        <span class="text-base font-normal text-medium-gray ml-1">({{ formatThaiDate(selectedDate) }})</span>
      </h3>

      <AppointmentListTable :appointments="dashboardData?.appointmentList ?? []" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDashboard } from '../composables/useDashboard'
import { getTodayString, getFutureDate, formatThaiDate } from '../utils/helpers'
import type { DashboardData } from '../types'
import LoadingSpinner from './LoadingSpinner.vue'
import ManagementGrid from './ManagementGrid.vue'
import AppointmentListTable from './AppointmentListTable.vue'

const authStore = useAuthStore()
const { isLoading, loadDashboardData } = useDashboard()

// ── State ────────────────────────────────────────────────────────────────────
const today = getTodayString()
const maxDate = getFutureDate(29)
const selectedDate = ref(today)
const dashboardData = ref<DashboardData | null>(null)

// ── Computed ─────────────────────────────────────────────────────────────────
const therapistName = computed(() => authStore.therapistName ?? '')

// ── Methods ──────────────────────────────────────────────────────────────────
async function loadData() {
  dashboardData.value = await loadDashboardData(therapistName.value, selectedDate.value)
}

function goBack() {
  authStore.navigateTo('therapist-menu')
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(loadData)
watch(selectedDate, loadData)
</script>
