import { ref } from "vue";
import { supabase } from "../supabase";
import type { PatientRecord } from "../types";

export function useRecords() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function loadPatientRecords(
    date: string,
    therapistFilter: string,
  ): Promise<PatientRecord[]> {
    isLoading.value = true;
    error.value = null;

    try {
      let query = supabase
        .from("patient_record")
        .select(
          "first_name, last_name, rights, therapist, payout_amount, visit_date",
        )
        .eq("visit_date", date);

      if (therapistFilter && therapistFilter !== "ALL") {
        query = query.eq("therapist", therapistFilter);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      return (data as PatientRecord[]) ?? [];
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      error.value = msg;
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, error, loadPatientRecords };
}
