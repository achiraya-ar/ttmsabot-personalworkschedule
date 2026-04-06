<template>
  <div class="flex flex-col items-center justify-center py-16 text-primary-dark">
    <i class="fas fa-spinner fa-spin text-5xl mb-4"></i>
    <p class="text-lg font-medium">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
  }>(),
  {
    message: 'กำลังโหลดข้อมูล... กรุณารอสักครู่...',
  },
)
</script>
