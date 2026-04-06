import Swal from 'sweetalert2'
import { supabase } from '../supabase'
import { formatThaiDate } from '../utils/helpers'

export async function handleSlotAction(
  action: 'block' | 'unblock',
  time: string,
  date: string,
  therapistName: string,
  isManager: boolean,
  currentUserName: string,
  refreshCallback: () => void | Promise<void>,
): Promise<void> {
  const actionText = action === 'block' ? 'ล็อกคิว' : 'ปลดล็อกคิว'

  // ── Confirmation dialog config ─────────────────────────────────────────
  interface SwalConfig {
    title: string
    html: string
    icon: 'warning'
    showCancelButton: boolean
    confirmButtonText: string
    cancelButtonText: string
    reverseButtons: boolean
    input?: 'text'
    inputPlaceholder?: string
    inputValidator?: (value: string) => string | null
  }

  const swalConfig: SwalConfig = {
    title: `ยืนยันการ${actionText}?`,
    html: `ชื่อพนักงาน: <strong>${therapistName}</strong><br>เวลา <strong>${time}</strong> น. วันที่ <strong>${formatThaiDate(date)}</strong>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
  }

  if (action === 'block') {
    swalConfig.input = 'text'
    swalConfig.inputPlaceholder = 'ระบุเหตุผล (เช่น ประชุม, ลากิจ)'
    if (isManager) {
      swalConfig.inputValidator = (value: string) =>
        !value ? 'ผู้ดูแลระบบต้องระบุเหตุผลที่ล็อกคิว' : null
    }
  }

  const result = await Swal.fire(swalConfig)
  if (!result.isConfirmed) return

  // ── Processing ────────────────────────────────────────────────────────
  Swal.fire({
    title: 'กำลังดำเนินการ...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  })

  try {
    if (action === 'block') {
      // Check if slot is already booked before blocking
      const { data: existingBooking, error: checkError } = await supabase
        .from('bookings')
        .select('booking_id')
        .eq('booking_date', date)
        .eq('booking_time', `${time}:00`)
        .eq('therapist_name', therapistName)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingBooking) {
        await Swal.fire(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถล็อกคิวได้ เนื่องจากมีคนไข้จองคิวนี้แล้ว',
          'error',
        )
        return
      }

      const { error: insertError } = await supabase.from('blockages').insert({
        block_date: date,
        block_time: `${time}:00`,
        therapist_name: therapistName,
        reason: (result.value as string) || 'ปิดโดยเจ้าของคิว',
        created_by: currentUserName,
      })

      if (insertError) throw insertError
    } else {
      // Unblock – delete the blockage record
      const { error: deleteError } = await supabase
        .from('blockages')
        .delete()
        .match({
          block_date: date,
          block_time: `${time}:00`,
          therapist_name: therapistName,
        })

      if (deleteError) throw deleteError
    }

    await Swal.fire({
      title: 'สำเร็จ!',
      text: `ดำเนินการ${actionText}เรียบร้อยแล้ว`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })

    await refreshCallback()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง'
    await Swal.fire(`การ${actionText}ล้มเหลว`, message, 'error')
  }
}
