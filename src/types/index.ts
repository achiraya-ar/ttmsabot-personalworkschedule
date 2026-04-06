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
export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

/** User profile returned from the `profiles` table */
export interface UserProfile {
  email: string;
  full_name: string;
  role: string;
  username: string;
}

/** A single booking record from the `bookings` table */
export interface Booking {
  booking_time: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
}

/** A single blockage record from the `blockages` table */
export interface Blockage {
  block_time: string;
  reason: string | null;
  created_by: string;
}

/** Schedule data from the `schedules` table */
export interface ScheduleData {
  time_slots: string[];
}

/** Processed slot info used in the management grid */
export interface SlotInfo {
  time: string;
  status: SlotStatus;
  details: string | null;
  blockedBy: string | null;
}

/** Processed appointment row used in the appointment list table */
export interface AppointmentItem {
  time: string;
  status: SlotStatus;
  description: string;
}

/** Aggregated dashboard data for a therapist on a given date */
export interface DashboardData {
  therapistName: string;
  scheduleSlots: SlotInfo[];
  appointmentList: AppointmentItem[];
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
