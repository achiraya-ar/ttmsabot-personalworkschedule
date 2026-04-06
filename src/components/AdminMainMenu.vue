<template>
    <div>
        <!-- Page Title -->
        <h2
            class="flex items-center gap-3 text-2xl md:text-3xl font-bold text-primary-blue border-b-[3px] border-primary-blue pb-3 mb-6"
        >
            <i class="fa-solid fa-cogs"></i>
            เมนูผู้ดูแลระบบ
        </h2>

        <!-- Menu Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <!-- Manage All Queues Card -->
            <div
                class="bg-white border-[3px] border-primary-blue rounded-[18px] p-8 text-center cursor-pointer transition-all duration-300 shadow-lg hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:border-primary-dark"
                @click="navigateToQueue"
            >
                <i
                    class="fa-solid fa-users-gear text-5xl text-primary-blue mb-5 block"
                ></i>
                <h3 class="text-xl font-extrabold text-primary-dark mb-3">
                    จัดการคิวพนักงานทั้งหมด
                </h3>
                <p class="text-base text-dark-gray">
                    ดูและจัดการตารางเวลาของพนักงานทุกคน
                </p>
            </div>

            <!-- View All Records Card -->
            <div
                class="bg-status-green-light border-[3px] border-status-green rounded-[18px] p-8 text-center cursor-pointer transition-all duration-300 shadow-lg scale-[0.98] hover:-translate-y-2 hover:scale-[1.00] hover:shadow-2xl"
                @click="navigateToRecords"
            >
                <i
                    class="fa-solid fa-book-medical text-5xl text-status-green mb-5 block"
                ></i>
                <h3 class="text-xl font-extrabold text-status-green mb-3">
                    ตรวจสอบค่าตอบแทน
                </h3>
                <p class="text-base text-dark-gray">
                    ตรวจสอบค่าตอบแทนตามวันและพนักงาน
                </p>
            </div>
        </div>

        <!-- Logout -->
        <div class="flex justify-end mt-8">
            <button
                :disabled="isLoggingOut"
                class="px-6 py-3 bg-status-red text-white font-semibold text-lg rounded-md cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                @click="handleLogout"
            >
                <i class="fa-solid fa-sign-out-alt mr-2"></i>
                ออกจากระบบ
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { supabase } from "../supabase";

const authStore = useAuthStore();
const isLoggingOut = ref(false);

function navigateToQueue() {
    authStore.navigateTo("admin-queue");
}

function navigateToRecords() {
    authStore.navigateTo("admin-records");
}

async function handleLogout() {
    isLoggingOut.value = true;
    try {
        await supabase.auth.signOut();
    } finally {
        authStore.clearUser();
        authStore.navigateTo("login");
        isLoggingOut.value = false;
    }
}
</script>
