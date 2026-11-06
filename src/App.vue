<template>
    <div class="min-h-screen bg-bg-light py-4 px-2 sm:py-8 sm:px-4 font-sans">
        <div
            class="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
            <!-- App Header -->
            <AppHeader />

            <!-- Main Content -->
            <main class="p-5 sm:p-8 min-h-100">
                <!-- Initializing Spinner -->
                <LoadingSpinner
                    v-if="isInitializing"
                    message="กำลังตรวจสอบสิทธิ์..."
                />

                <template v-else>
                    <Transition name="fade" mode="out-in">
                        <LoginForm
                            v-if="currentView === 'login'"
                            :key="'login'"
                        />
                        <TherapistMainMenu
                            v-else-if="currentView === 'therapist-menu'"
                            :key="'therapist-menu'"
                        />
                        <TherapistDashboard
                            v-else-if="currentView === 'therapist-dashboard'"
                            :key="'therapist-dashboard'"
                        />
                        <TherapistRecordsPage
                            v-else-if="currentView === 'therapist-records'"
                            :key="'therapist-records'"
                        />
                        <AdminMainMenu
                            v-else-if="currentView === 'admin-menu'"
                            :key="'admin-menu'"
                        />
                        <AdminQueuePage
                            v-else-if="currentView === 'admin-queue'"
                            :key="'admin-queue'"
                        />
                        <AdminRecordsPage
                            v-else-if="currentView === 'admin-records'"
                            :key="'admin-records'"
                        />
                    </Transition>
                </template>
            </main>

            <!-- App Footer -->
            <AppFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { supabase } from "./supabase";

import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import LoginForm from "./components/LoginForm.vue";
import TherapistMainMenu from "./components/TherapistMainMenu.vue";
import TherapistDashboard from "./components/TherapistDashboard.vue";
import TherapistRecordsPage from "./components/TherapistRecordsPage.vue";
import AdminMainMenu from "./components/AdminMainMenu.vue";
import AdminQueuePage from "./components/AdminQueuePage.vue";
import AdminRecordsPage from "./components/AdminRecordsPage.vue";

const authStore = useAuthStore();
const isInitializing = ref(true);
const currentView = computed(() => authStore.currentView);

// ── Session Restore on Mount ──────────────────────────────────────────────────
onMounted(async () => {
    try {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session) {
            // Always re-check the permission from DB so a revoked user
            // cannot keep using an old session.
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("full_name, role, can_access_personalworkschedule")
                .eq("id", session.user.id)
                .single();

            const typedProfile = profile as {
                full_name: string;
                role: string;
                can_access_personalworkschedule: boolean;
            } | null;

            if (
                error ||
                !typedProfile ||
                !typedProfile.can_access_personalworkschedule
            ) {
                // Profile not found or access revoked – sign out and show login
                await supabase.auth.signOut().catch(() => undefined);
                authStore.clearUser();
                authStore.navigateTo("login");
            } else {
                authStore.setUser(
                    typedProfile.full_name,
                    typedProfile.role,
                );
                authStore.navigateToMenu();
            }
        } else {
            authStore.navigateTo("login");
        }
    } catch {
        // Any unexpected error → show login
        authStore.clearUser();
        authStore.navigateTo("login");
    } finally {
        isInitializing.value = false;
    }
});
</script>

<style scoped>
/* Page transition */
.fade-enter-active,
.fade-leave-active {
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateY(6px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
