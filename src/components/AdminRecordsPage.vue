<template>
    <div>
        <!-- Page Header -->
        <div
            class="flex flex-wrap justify-between items-center gap-4 mb-5 pb-4 border-b-2 border-border-light"
        >
            <h3
                class="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary-blue flex-grow m-0"
            >
                <i class="fa-solid fa-book-medical"></i>
                ตรวจสอบค่าตอบแทน
                <span class="text-base font-normal text-medium-gray ml-1"
                    >({{ formatThaiDate(selectedDate) }})</span
                >
            </h3>

            <button
                class="px-5 py-2 bg-status-gray-dark text-white font-semibold rounded-md cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px w-full md:w-auto"
                @click="goBack"
            >
                <i class="fa-solid fa-arrow-left mr-2"></i>
                กลับเมนู
            </button>
        </div>

        <!-- Filters -->
        <div
            class="flex flex-wrap items-end gap-4 mb-6 p-4 bg-bg-light rounded-xl border border-border-light"
        >
            <!-- Date Picker -->
            <div class="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label class="font-semibold text-dark-gray text-sm"
                    >เลือกวันที่:</label
                >
                <input
                    v-model="selectedDate"
                    type="date"
                    :disabled="isLoadingTherapists"
                    class="px-4 py-2 border-2 border-border-light rounded-lg text-base font-sans bg-white text-black transition-all duration-200 focus:outline-none focus:border-primary-blue focus:ring-[5px] focus:ring-primary-blue/25 disabled:opacity-50"
                />
            </div>

            <!-- Therapist Filter -->
            <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label class="font-semibold text-dark-gray text-sm"
                    >เลือกพนักงาน:</label
                >
                <select
                    v-model="selectedTherapist"
                    :disabled="isLoadingTherapists"
                    class="px-4 py-2 border-2 border-border-light rounded-lg text-base font-sans bg-white text-black transition-all duration-200 focus:outline-none focus:border-primary-blue focus:ring-[5px] focus:ring-primary-blue/25 disabled:opacity-50"
                >
                    <option value="ALL">-- ดูทั้งหมด --</option>
                    <option
                        v-for="name in therapists"
                        :key="name"
                        :value="name"
                    >
                        {{ name }}
                    </option>
                </select>
            </div>
        </div>

        <!-- Loading therapists list -->
        <LoadingSpinner
            v-if="isLoadingTherapists"
            message="กำลังโหลดรายชื่อพนักงาน..."
        />

        <!-- Loading records -->
        <LoadingSpinner
            v-else-if="isLoadingRecords"
            message="กำลังโหลดข้อมูล..."
        />

        <!-- Records Table -->
        <RecordsTable v-else :records="records" :is-admin-view="true" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRecords } from "../composables/useRecords";
import { useTherapists } from "../composables/useTherapists";
import { getTodayString, formatThaiDate, getFirstName } from "../utils/helpers";
import type { PatientRecord } from "../types";
import LoadingSpinner from "./LoadingSpinner.vue";
import RecordsTable from "./RecordsTable.vue";

const authStore = useAuthStore();
const { isLoading: isLoadingTherapists, getAllTherapists } = useTherapists();
const { isLoading: isLoadingRecords, loadPatientRecords } = useRecords();

// ── State ────────────────────────────────────────────────────────────────────
const selectedDate = ref(getTodayString());
const selectedTherapist = ref<string>("ALL");
const therapists = ref<string[]>([]);
const records = ref<PatientRecord[]>([]);

// ── Methods ──────────────────────────────────────────────────────────────────

/**
 * Resolve the therapist filter value to pass to loadPatientRecords.
 * - 'ALL'  → pass 'ALL' to fetch all therapists
 * - full name → extract first name, since patient_visits.therapist stores first name
 */
function resolveTherapistFilter(value: string): string {
    if (!value || value === "ALL") return "ALL";
    return getFirstName(value);
}

async function loadData() {
    const filter = resolveTherapistFilter(selectedTherapist.value);
    records.value = await loadPatientRecords(selectedDate.value, filter);
}

function goBack() {
    authStore.navigateTo("admin-menu");
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
    therapists.value = await getAllTherapists();
    await loadData();
});

watch([selectedDate, selectedTherapist], loadData);
</script>
