<template>
    <div>
        <!-- Header Section -->
        <div
            class="flex flex-wrap justify-between items-center gap-4 mb-5 pb-4 border-b-2 border-border-light"
        >
            <h3
                class="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary-blue flex-grow m-0"
            >
                <i class="fa-solid fa-file-medical"></i>
                ตรวจสอบค่าตอบแทน
                <span class="text-base font-normal text-medium-gray ml-1"
                    >({{ formatThaiDate(selectedDate) }})</span
                >
            </h3>

            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <!-- Date Picker -->
                <input
                    v-model="selectedDate"
                    type="date"
                    class="px-4 py-2 border-2 border-border-light rounded-lg text-base font-sans bg-white text-black transition-all duration-200 focus:outline-none focus:border-primary-blue focus:ring-[5px] focus:ring-primary-blue/25 w-full md:w-auto min-w-[200px]"
                />

                <!-- Back Button (restored full Tailwind classes) -->
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

        <!-- Records Table -->
        <RecordsTable v-else :records="records" :is-admin-view="false" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRecords } from "../composables/useRecords";
import { getTodayString, formatThaiDate, getFirstName } from "../utils/helpers";
import type { PatientRecord } from "../types";
import LoadingSpinner from "./LoadingSpinner.vue";
import RecordsTable from "./RecordsTable.vue";

const authStore = useAuthStore();
const { isLoading, loadPatientRecords } = useRecords();

// ── State ────────────────────────────────────────────────────────────────────
const selectedDate = ref(getTodayString());
const records = ref<PatientRecord[]>([]);

// ── Computed ─────────────────────────────────────────────────────────────────
/**
 * patient_visits filters by therapist first name in this app.
 * Extract the first word from the therapist's full name stored in store/session.
 */
const therapistFirstName = computed(() =>
    getFirstName(authStore.therapistName ?? ""),
);

// ── Methods ──────────────────────────────────────────────────────────────────
async function loadData() {
    try {
        const res = await loadPatientRecords(
            selectedDate.value,
            therapistFirstName.value,
        );
        // normalize result to array
        records.value = Array.isArray(res) ? res : [];
    } catch (err) {
        records.value = [];
        // allow global error handlers in useRecords or leave for dev tools
        // console.error(err);
    }
}

function goBack() {
    authStore.navigateTo("therapist-menu");
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(loadData);
watch(selectedDate, loadData);
</script>

<style scoped>
/* Keep minimal local styles — primary styling uses Tailwind utility classes already. */
</style>
