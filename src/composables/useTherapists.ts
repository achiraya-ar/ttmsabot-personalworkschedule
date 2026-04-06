import { ref } from 'vue'
import { supabase } from '../supabase'

export function useTherapists() {
  const therapists = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function getAllTherapists(): Promise<string[]> {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: sbError } = await supabase
        .from('bookings')
        .select('therapist_name')

      if (sbError) throw sbError

      const uniqueNames = [
        ...new Set((data ?? []).map((item: { therapist_name: string }) => item.therapist_name)),
      ].sort((a, b) => a.localeCompare(b))

      therapists.value = uniqueNames
      return uniqueNames
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดรายชื่อพนักงาน'
      error.value = msg
      return []
    } finally {
      isLoading.value = false
    }
  }

  return { therapists, isLoading, error, getAllTherapists }
}
