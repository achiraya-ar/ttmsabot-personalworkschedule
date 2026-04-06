<template>
    <div>
        <!-- Page Header -->
        <div
            class="flex flex-wrap justify-between items-center gap-4 mb-5 pb-4 border-b-2 border-border-light"
        >
            <h3
                class="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary-blue grow m-0"
            >
                <i class="fa-solid fa-users-gear"></i>
                <span v-if="selectedTherapist">
                    จัดการคิวของ: {{ selectedTherapist }}
                    <span class="text-base font-normal text-medium-gray ml-1"
                        >({{ formatThaiDate(selectedDate) }})</span
                    >
                </span>
                <span v-else>จัดการคิวพนักงานทั้งหมด</span>
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
            <div class="flex flex-col gap-1 flex-1 min-w-45">
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

            <!-- Therapist Selector -->
            <div class="flex flex-col gap-1 flex-1 min-w-50">
                <label class="font-semibold text-dark-gray text-sm"
                    >เลือกพนักงาน:</label
                >
                <select
                    v-model="selectedTherapist"
                    :disabled="isLoadingTherapists || therapists.length === 0"
                    class="px-4 py-2 border-2 border-border-light rounded-lg text-base font-sans bg-white text-black transition-all duration-200 focus:outline-none focus:border-primary-blue focus:ring-[5px] focus:ring-primary-blue/25 disabled:opacity-50"
                >
                    <option v-if="therapists.length === 0" value="">
                        -- ไม่พบข้อมูลพนักงาน --
                    </option>
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

        <!-- Loading therapists -->
        <LoadingSpinner
            v-if="isLoadingTherapists"
            message="กำลังโหลดรายชื่อพนักงาน..."
        />

        <!-- No therapists found -->
        <div
            v-else-if="!isLoadingTherapists && therapists.length === 0"
            class="text-center py-12 text-medium-gray font-medium text-lg border-2 border-dashed border-border-light rounded-xl"
        >
            <i
                class="fa-solid fa-users-slash text-3xl mb-3 block text-light-gray"
            ></i>
            ไม่พบข้อมูลพนักงานในระบบ
        </div>

        <!-- Dashboard Content -->
        <template v-else-if="selectedTherapist">
            <!-- Loading dashboard data -->
            <LoadingSpinner
                v-if="isLoadingDashboard"
                :message="`กำลังโหลดข้อมูลของ ${selectedTherapist}...`"
            />

            <template v-else>
                <!-- Management Grid -->
                <ManagementGrid
                    :slots="dashboardData?.scheduleSlots ?? []"
                    :therapist-name="selectedTherapist"
                    :date="selectedDate"
                    @refresh="loadDashboard"
                />

                <!-- Divider -->
                <hr class="my-8 border-t-2 border-border-light" />

                <!-- Appointment List -->
                <h3
                    class="flex items-center gap-2 text-lg md:text-xl font-bold text-primary-blue mb-2"
                >
                    <i class="fa-solid fa-list-check"></i>
                    รายการนัดหมาย
                    <span class="text-base font-normal text-medium-gray ml-1"
                        >({{ formatThaiDate(selectedDate) }})</span
                    >
                </h3>

                <AppointmentListTable
                    :appointments="dashboardData?.appointmentList ?? []"
                />
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useDashboard } from "../composables/useDashboard";
import { useTherapists } from "../composables/useTherapists";
import { getTodayString, formatThaiDate } from "../utils/helpers";
import type { DashboardData } from "../types";
import LoadingSpinner from "./LoadingSpinner.vue";
import ManagementGrid from "./ManagementGrid.vue";
import AppointmentListTable from "./AppointmentListTable.vue";

const authStore = useAuthStore();
const { isLoading: isLoadingTherapists, getAllTherapists } = useTherapists();
const { isLoading: isLoadingDashboard, loadDashboardData } = useDashboard();

// ── State ────────────────────────────────────────────────────────────────────
const selectedDate = ref(getTodayString());
const selectedTherapist = ref("");
const therapists = ref<string[]>([]);
const dashboardData = ref<DashboardData | null>(null);

// ── Methods ──────────────────────────────────────────────────────────────────
async function loadDashboard() {
    if (!selectedTherapist.value) return;
    dashboardData.value = await loadDashboardData(
        selectedTherapist.value,
        selectedDate.value,
    );
}

function goBack() {
    authStore.navigateTo("admin-menu");
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
    therapists.value = await getAllTherapists();
    if (therapists.value.length > 0) {
        selectedTherapist.value = therapists.value[0]!;
        await loadDashboard();
    }
});

// Reload when date or therapist changes
watch([selectedDate, selectedTherapist], loadDashboard);
</script>
