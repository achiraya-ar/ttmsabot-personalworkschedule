import { supabase } from '../supabase'

export interface SaveBookingNoteInput {
  bookingId: string
  date: string
  time: string
  therapistName: string
  note: string
  updatedBy: string
  patientName?: string | null
  patientPhone?: string | null
}

/**
 * Creates or updates the staff note attached to a booking.
 *
 * This only writes to `booking_notes`; the booking row itself is never
 * deleted or modified, so the patient keeps their booking right.
 */
export async function saveBookingNote(
  input: SaveBookingNoteInput,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('booking_notes').upsert(
      {
        booking_id: input.bookingId,
        booking_date: input.date,
        booking_time: input.time.length === 5 ? `${input.time}:00` : input.time,
        therapist_name: input.therapistName,
        note: input.note.trim(),
        patient_name: input.patientName?.trim() || null,
        patient_phone: input.patientPhone?.trim() || null,
        updated_by: input.updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'booking_id' },
    )

    if (error) throw error
    return { error: null }
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง'),
    }
  }
}

/** Removes only the note. The booking itself is left untouched. */
export async function deleteBookingNote(
  bookingId: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('booking_notes')
      .delete()
      .eq('booking_id', bookingId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง'),
    }
  }
}
