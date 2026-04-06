<template>
    <div class="mt-6 overflow-x-auto">
        <!-- Empty state -->
        <div
            v-if="!records || records.length === 0"
            class="text-center py-8 text-status-gray-dark font-semibold text-lg border-2 border-border-light rounded-lg"
        >
            <i class="fa-solid fa-folder-open mr-2 text-medium-gray"></i>
            ไม่พบข้อมูลการรักษาในวันที่เลือก
        </div>

        <!-- Records Table -->
        <table v-else class="appt-table w-full border-collapse mt-4">
            <thead class="bg-primary-dark text-white">
                <tr>
                    <th class="px-4 py-3 text-left font-bold text-sm">
                        ชื่อ-สกุล
                    </th>
                    <th class="px-4 py-3 text-left font-bold text-sm">
                        สิทธิการรักษา
                    </th>
                    <th class="px-4 py-3 text-right font-bold text-sm">
                        ค่าตอบแทน (บาท)
                    </th>
                    <th
                        v-if="isAdminView"
                        class="px-4 py-3 text-left font-bold text-sm"
                    >
                        พนักงาน
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="(rec, index) in records"
                    :key="index"
                    class="border-b border-border-light hover:bg-bg-light transition-colors duration-150"
                >
                    <!-- ชื่อ-สกุล -->
                    <td class="px-4 py-3 text-sm border border-border-light">
                        <span class="cell-label sm:hidden">ชื่อ-สกุล: </span>
                        <span class="cell-value">
                            {{
                                [rec.first_name, rec.last_name]
                                    .filter(Boolean)
                                    .join(" ") || "-"
                            }}
                        </span>
                    </td>

                    <!-- สิทธิการรักษา -->
                    <td class="px-4 py-3 text-sm border border-border-light">
                        <span class="cell-label sm:hidden"
                            >สิทธิการรักษา:
                        </span>
                        <span class="cell-value">{{ rec.rights || "-" }}</span>
                    </td>

                    <!-- ค่าตอบแทน -->
                    <td
                        class="px-4 py-3 text-sm border border-border-light text-right"
                    >
                        <span class="cell-label sm:hidden">ค่าตอบแทน: </span>
                        <span class="cell-value">{{
                            formatCurrency(rec.payout_amount)
                        }}</span>
                    </td>

                    <!-- พนักงาน (admin only) -->
                    <td
                        v-if="isAdminView"
                        class="px-4 py-3 text-sm border border-border-light"
                    >
                        <span class="cell-label sm:hidden">พนักงาน: </span>
                        <span class="cell-value">{{
                            rec.therapist || "-"
                        }}</span>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Record count & total payout -->
        <div
            v-if="records && records.length > 0"
            class="mt-3 text-right text-sm text-medium-gray font-medium"
        >
            <div>
                พบข้อมูลทั้งหมด
                <strong class="text-primary-dark">{{ records.length }}</strong>
                รายการ
            </div>
            <div class="mt-1">
                รวมค่าตอบแทนทั้งหมด:
                <strong class="text-status-green-dark">{{
                    formatCurrency(totalPayout)
                }}</strong>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PatientRecord } from "../types";

const props = withDefaults(
    defineProps<{
        records: PatientRecord[];
        isAdminView?: boolean;
    }>(),
    {
        isAdminView: false,
    },
);

// total payout computed from records
const totalPayout = computed(() =>
    props.records.reduce((sum, r) => sum + (r.payout_amount ?? 0), 0),
);

// Format number as Thai currency with 2 decimals (or '-' when no value)
function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return "-";
    return value.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// keep props referenced so linter/type-checkers don't complain
void props;
</script>
