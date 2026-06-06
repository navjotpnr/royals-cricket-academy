import type { Student } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  role: "admin" | "player" | null;
  studentId: number | null;
  adminAuthenticated: boolean;
  playerStudent: Student | null;
  locationId: string | null;
  locationName: string | null;
  loginTime: number | null;
  loginAdmin: (locationId: string, locationName: string) => void;
  loginPlayer: (student: Student) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      studentId: null,
      adminAuthenticated: false,
      playerStudent: null,
      locationId: null,
      locationName: null,
      loginTime: null,

      loginAdmin: (locationId: string, locationName: string) =>
        set({
          role: "admin",
          adminAuthenticated: true,
          studentId: null,
          playerStudent: null,
          locationId,
          locationName,
          loginTime: Date.now(),
        }),

      loginPlayer: (student: Student) =>
        set({
          role: "player",
          studentId: student.id,
          playerStudent: student,
          adminAuthenticated: false,
        }),

      logout: () =>
        set({
          role: null,
          studentId: null,
          adminAuthenticated: false,
          playerStudent: null,
          locationId: null,
          locationName: null,
          loginTime: null,
        }),
    }),
    { name: "rca-auth-store" },
  ),
);
