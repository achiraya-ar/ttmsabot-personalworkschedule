import { ref } from 'vue'
import { supabase } from '../supabase'
import type { SlotInfo, AppointmentItem, DashboardData, Booking, Blockage } from '../types'

export function useDashboard() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadDashboardData(
    therapistName: string,
    date: string,
  ): Promise<DashboardData> {
    isLoading.value = true
    error.value = null

    try {
      const selectedDate = new Date(date + 'T00:00:00')
      const dayOfWeek = selectedDate.getDay()

      const [scheduleResult, bookingsResult, blockagesResult] = await Promise.all([
        supabase
          .from('schedules')
          .select('time_slots')
          .eq('therapist_name', therapistName)
          .eq('day_of_week', dayOfWeek)
          .single(),
        supabase
          .from('bookings')
          .select('booking_time, patient_first_name, patient_last_name, patient_phone')
          .eq('therapist_name', therapistName)
          .eq('booking_date', date),
        supabase
          .from('blockages')
          .select('block_time, reason, created_by')
          .eq('therapist_name', therapistName)
          .eq('block_date', date),
      ])

      // No schedule found for this therapist / day
      if (!scheduleResult.data?.time_slots) {
        return { therapistName, scheduleSlots: [], appointmentList: [] }
      }

      const rawSlots: string[] = scheduleResult.data.time_slots
      const availableSlots = [...rawSlots].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      )

      const bookingsData: Booking[] = bookingsResult.data ?? []
      const blockagesData: Blockage[] = blockagesResult.data ?? []

      // Build lookup maps keyed by "HH:MM" (first 5 chars of time string)
      const bookingsMap = new Map<string, Booking>(
        bookingsData.map((b) => [b.booking_time.substring(0, 5), b]),
      )
      const blockagesMap = new Map<string, Blockage>(
        blockagesData.map((b) => [b.block_time.substring(0, 5), b]),
      )

      // ── Build schedule slots ─────────────────────────────────────────────
      const scheduleSlots: SlotInfo[] = availableSlots.map((time) => {
        const booking = bookingsMap.get(time)
        const blockage = blockagesMap.get(time)

        if (booking) {
          return {
            time,
            status: 'BOOKED',
            details: `คุณ ${booking.patient_first_name} ${booking.patient_last_name} (${booking.patient_phone})`,
            blockedBy: null,
          }
        }

        if (blockage) {
          return {
            time,
            status: 'BLOCKED',
            details: blockage.reason ?? 'ปิดโดยแพทย์/ผู้ดูแลระบบ',
            blockedBy: blockage.created_by,
          }
        }

        return { time, status: 'AVAILABLE', details: null, blockedBy: null }
      })

      // ── Build appointment list ───────────────────────────────────────────
      const appointmentList: AppointmentItem[] = scheduleSlots.map((slot) => {
        let description = 'ว่าง'
        if (slot.status === 'BOOKED') {
          description = slot.details ?? 'ว่าง'
        } else if (slot.status === 'BLOCKED') {
          description = `ล็อคคิว - ${slot.details}`
        }
        return { time: slot.time, status: slot.status, description }
      })

      return { therapistName, scheduleSlots, appointmentList }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
      error.value = msg
      return { therapistName, scheduleSlots: [], appointmentList: [] }
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, error, loadDashboardData }
}
