<template>
  <div class="max-w-md mx-auto my-8 p-10 border-2 border-border-light rounded-xl bg-[#F7FBFF] shadow-lg">
    <h2 class="flex items-center gap-3 text-2xl font-bold text-primary-blue border-b-[3px] border-primary-blue pb-3 mb-6">
      <i class="fa-solid fa-right-to-bracket"></i>
      เข้าสู่ระบบ
    </h2>

    <form @submit.prevent="handleLogin">
      <!-- Username -->
      <div class="mb-6">
        <label for="username" class="block mb-2 font-semibold text-dark-gray text-base">
          ชื่อผู้ใช้ (Username)
        </label>
        <input
          id="username"
          v-model="username"
          type="text"
          required
          autocomplete="username"
          placeholder="กรอกชื่อผู้ใช้"
          class="w-full px-4 py-3 border-2 border-border-light rounded-lg text-base font-sans bg-white text-black transition-all duration-200 focus:outline-none focus:border-primary-blue focus:ring-[5px] focus:ring-primary-blue/25"
        />
      </div>

      <!-- Password -->
      <div class="mb-8">
        <label for="password" class="block mb-2 font-semibold text-dark-gray text-base">
          รหัสผ่าน
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="กรอกรหัสผ่าน"
          class="w-full px-4 py-3 border-2 border-border-light rounded-lg text-base font-sans bg-white text-black transition-all duration-200 focus:outline-none focus:border-primary-blue focus:ring-[5px] focus:ring-primary-blue/25"
        />
      </div>

      <!-- Submit -->
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="isLoading"
          class="px-6 py-3 bg-primary-blue text-white font-semibold text-lg rounded-md cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <i class="fa-solid fa-right-to-bracket mr-2"></i>
          เข้าสู่ระบบ
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Swal from 'sweetalert2'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const isLoading = ref(false)

async function handleLogin() {
  if (!username.value.trim() || !password.value) return

  isLoading.value = true
  Swal.fire({
    title: 'กำลังตรวจสอบ...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  })

  try {
    // Step 1 – look up the user's email from the profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name, role')
      .eq('username', username.value.trim())

    if (profileError) throw profileError

    if (!profiles || profiles.length === 0) {
      Swal.close()
      await Swal.fire('ล็อกอินล้มเหลว', 'ไม่พบชื่อผู้ใช้นี้ในระบบ', 'error')
      return
    }

    const profile = profiles[0] as { email: string; full_name: string; role: string }

    // Step 2 – sign in with Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: password.value,
    })

    if (loginError) {
      Swal.close()
      let message = loginError.message

      if (loginError.message === 'Invalid login credentials') {
        message = 'รหัสผ่านไม่ถูกต้อง'
      } else if (
        loginError.message.includes('session is not found') ||
        (loginError as { code?: string }).code === '401'
      ) {
        message = 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่ค่ะ'
      }

      await Swal.fire('การล็อกอินล้มเหลว', message, 'error')
      return
    }

    if (loginData.user) {
      Swal.close()
      authStore.setUser(profile.full_name, profile.role)
      authStore.navigateToMenu()
    }
  } catch (err) {
    Swal.close()
    const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    await Swal.fire('การล็อกอินล้มเหลว', message, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>
