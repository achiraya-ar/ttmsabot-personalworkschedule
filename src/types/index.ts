// =====================================================================
//  Application-wide TypeScript Types & Interfaces
// =====================================================================

/** Possible views rendered in App.vue */
export type ViewName =
  | "login"
  | "therapist-menu"
  | "therapist-dashboard"
  | "therapist-records"
  | "admin-menu"
  | "admin-queue"
  | "admin-records";

/** Status of a single time slot */
export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED" | "NOTE_HOLD";

/** User profile returned from the `profiles` table */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  username: string;
  can_access_personalworkschedule: boolean;
  can_access_workschedule: boolean;
  can_access_bookingportalmanager: boolean;
}

/** A single booking record from the `bookings` table */
export interface Booking {
  booking_id: string;
  booking_time: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
}

/**
 * A staff note attached to a booking (`booking_notes` table).
 * Notes never alter or remove the booking itself.
 */
export interface BookingNote {
  id?: number | string;
  booking_id: string;
  booking_date?: string;
  booking_time?: string;
  therapist_name?: string;
  note: string;
  patient_name?: string | null;
  patient_phone?: string | null;
  updated_by: string | null;
  updated_at: string | null;
}

/** A single blockage record from the `blockages` table */
export interface Blockage {
  block_time: string;
  reason: string | null;
  created_by: string;
}

/** Schedule data from the `schedule_versions` table */
export interface ScheduleData {
  time_slots: string[];
}

/** Processed slot info used in the management grid */
export interface SlotInfo {
  time: string;
  status: SlotStatus;
  details: string | null;
  blockedBy: string | null;
  bookingId?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
  note?: BookingNote | null;
}

/** Processed appointment row used in the appointment list table */
export interface AppointmentItem {
  time: string;
  status: SlotStatus;
  description: string;
  note?: BookingNote | null;
}

/** Aggregated dashboard data for a therapist on a given date */
export interface DashboardData {
  therapistName: string;
  scheduleSlots: SlotInfo[];
  appointmentList: AppointmentItem[];
  isHoliday: boolean;
  holidayDescription: string | null;
}

/** A patient record from the `patient_record` table (fields optional to allow partial selects) */
export interface PatientRecord {
  id?: number | string;
  created_at?: string;
  visit_date?: string;
  hn?: string | null;
  cid?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  age?: string | number | null;
  rights?: string | null;
  symptoms?: string | null;
  procedure?: string | null;
  therapist?: string | null;
  total_revenue?: number | null;
  payout_amount?: number | null;
}
