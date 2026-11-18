import { ref } from 'vue'
import { supabase } from '../supabase'
import type {
  SlotInfo,
  AppointmentItem,
  DashboardData,
  Booking,
  Blockage,
  BookingNote,
} from '../types'

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

      const [
        versionResult,
        bookingsResult,
        blockagesResult,
        holidayResult,
        notesResult,
      ] = await Promise.all([
        supabase
          .from('schedule_versions')
          .select('time_slots')
          .eq('therapist_name', therapistName)
          .eq('day_of_week', dayOfWeek)
          .lte('effective_from', date)
          .order('effective_from', { ascending: false })
          .order('id', { ascending: false })
          .limit(1),
        supabase
          .from('bookings')
          .select(
            'booking_id, booking_time, patient_first_name, patient_last_name, patient_phone',
          )
          .eq('therapist_name', therapistName)
          .eq('booking_date', date),
        supabase
          .from('blockages')
          .select('block_time, reason, created_by')
          .eq('therapist_name', therapistName)
          .eq('block_date', date),
        supabase
          .from('holidays')
          .select('description')
          .eq('holiday_date', date)
          .maybeSingle(),
        // Notes are optional. If the `booking_notes` migration has not
        // been applied yet, the schedule still loads normally.
        supabase
          .from('booking_notes')
          .select(
            'id, booking_id, booking_date, booking_time, therapist_name, note, patient_name, patient_phone, updated_by, updated_at',
          )
          .eq('booking_date', date)
          .eq('therapist_name', therapistName)
          .order('updated_at', { ascending: false }),
      ])

      const holidayDescription = holidayResult.data?.description ?? null
      const isHoliday = !!holidayResult.data

      const versionRow = versionResult.data?.[0] as
        | { time_slots: string[] | null }
        | undefined

      const rawSlots: string[] = versionRow?.time_slots ?? []

      const bookingsData: Booking[] = bookingsResult.data ?? []
      const blockagesData: Blockage[] = blockagesResult.data ?? []
      const notesData: BookingNote[] = notesResult.error
        ? []
        : ((notesResult.data ?? []) as BookingNote[])

      // Build lookup maps keyed by "HH:MM" (first 5 chars of time string)
      const bookingsMap = new Map<string, Booking>(
        bookingsData.map((b) => [b.booking_time.substring(0, 5), b]),
      )
      const blockagesMap = new Map<string, Blockage>(
        blockagesData.map((b) => [b.block_time.substring(0, 5), b]),
      )

      // One note per booking (latest first). Keyed by booking_id so notes
      // follow the booking rather than the time slot.
      const notesByBookingId = new Map<string, BookingNote>()
      notesData.forEach((note) => {
        if (note.booking_id && !notesByBookingId.has(note.booking_id)) {
          notesByBookingId.set(note.booking_id, note)
        }
      })

      // Notes whose booking has been deleted are slot holds. The slot must
      // stay unavailable until staff delete the note.
      const activeBookingIds = new Set(
        bookingsData.map((booking) => booking.booking_id),
      )
      const noteHoldsByTime = new Map<string, BookingNote>()
      notesData.forEach((note) => {
        if (!note.booking_id || activeBookingIds.has(note.booking_id)) return
        const time = (note.booking_time ?? '').substring(0, 5)
        if (!time || noteHoldsByTime.has(time)) return
        noteHoldsByTime.set(time, note)
      })

      // รวมเวลาที่มีการจอง/ล็อกคิวไว้แล้วด้วย
      // เพื่อไม่ให้คิวเดิมหายจากหน้าจอเมื่อมีการเปลี่ยนตารางเวลาในอนาคต
      const allTimes = new Set<string>([
        ...rawSlots.map((time) => time.trim()).filter(Boolean),
        ...bookingsMap.keys(),
        ...blockagesMap.keys(),
        ...noteHoldsByTime.keys(),
      ])

      const scheduleSlots: SlotInfo[] = [...allTimes]
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((time) => {
          const booking = bookingsMap.get(time)
          const blockage = blockagesMap.get(time)
          const noteHold = noteHoldsByTime.get(time)

          if (booking) {
            const patientName = `${booking.patient_first_name} ${booking.patient_last_name}`.trim()
            return {
              time,
              status: 'BOOKED',
              details: `คุณ ${patientName} (${booking.patient_phone})`,
              blockedBy: null,
              bookingId: booking.booking_id,
              patientName,
              patientPhone: booking.patient_phone,
              note: notesByBookingId.get(booking.booking_id) ?? null,
            }
          }

          // The booking was deleted but its note still holds the slot.
          if (noteHold) {
            const patientName = noteHold.patient_name?.trim() || ''
            const patientPhone = noteHold.patient_phone?.trim() || ''
            return {
              time,
              status: 'NOTE_HOLD',
              details: patientName
                ? `คุณ ${patientName}${patientPhone ? ` (${patientPhone})` : ''}`
                : 'รายการจองที่ถูกยกเลิกแล้ว',
              blockedBy: null,
              bookingId: noteHold.booking_id,
              patientName: patientName || null,
              patientPhone: patientPhone || null,
              note: noteHold,
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

      if (scheduleSlots.length === 0) {
        return {
          therapistName,
          scheduleSlots: [],
          appointmentList: [],
          isHoliday,
          holidayDescription,
        }
      }

      // ── Build appointment list ───────────────────────────────────────────
      const appointmentList: AppointmentItem[] = scheduleSlots.map((slot) => {
        let description = 'ว่าง'
        if (slot.status === 'BOOKED') {
          description = slot.details ?? 'ว่าง'
        } else if (slot.status === 'NOTE_HOLD') {
          description = slot.details ?? 'รายการจองที่ถูกยกเลิกแล้ว'
        } else if (slot.status === 'BLOCKED') {
          description = `ล็อคคิว - ${slot.details}`
        }
        return {
          time: slot.time,
          status: slot.status,
          description,
          note: slot.note ?? null,
        }
      })

      return {
        therapistName,
        scheduleSlots,
        appointmentList,
        isHoliday,
        holidayDescription,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
      error.value = msg
      return {
        therapistName,
        scheduleSlots: [],
        appointmentList: [],
        isHoliday: false,
        holidayDescription: null,
      }
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, error, loadDashboardData }
}
