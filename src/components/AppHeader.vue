<template>
  <header class="bg-gradient-to-br from-primary-blue to-primary-dark text-white px-8 py-8 text-center">
    <h1 class="m-0 text-2xl md:text-3xl font-bold leading-snug">
      <i class="fa-solid fa-user-shield mr-3"></i>
      ระบบบริหารจัดการคิวนัดหมาย
    </h1>
    <p class="mt-2 mb-0 font-medium text-sm md:text-base opacity-95 min-h-[1.5rem]">
      <template v-if="authStore.isLoggedIn">
        ยินดีต้อนรับ,
        <strong>{{ authStore.therapistName }}</strong>
        <span
          v-if="authStore.isManager"
          class="ml-2 text-sm bg-status-yellow text-dark-gray font-bold px-3 py-1 rounded-full"
        >
          ผู้ดูแลระบบ
        </span>
      </template>
      <template v-else>
        กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล
      </template>
    </p>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>
