import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import api from "@/lib/api";

type User = {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar?: string;
  is_staff?: boolean;
  city?: string;
  whatsapp?: string;
  role?: string;
  vehicle_type?: string;
  trajet_depart?: string;
  trajet_destination?: string;
  wilaya?: string;
};

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  bootstrapDone: boolean;
  pendingPhone:        string;
  pendingFirst:        string;
  pendingLast:         string;
  pendingRole:         string;
  pendingVehicle:      string;
  pendingTrajetDepart: string;
  pendingTrajetDest:   string;
  pendingWilaya:       string;

  login:      (access: string, refresh: string, user: User) => Promise<void>;
  logout:     () => Promise<void>;
  setUser:    (user: User) => void;
  setPending: (phone: string, first?: string, last?: string, role?: string, vehicle?: string, trajetDepart?: string, trajetDest?: string, wilaya?: string) => void;
  clearPending: () => void;
  bootstrap:    () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  bootstrapDone: false,
  pendingPhone:        "",
  pendingFirst:        "",
  pendingLast:         "",
  pendingRole:         "vendeur",
  pendingVehicle:      "",
  pendingTrajetDepart: "",
  pendingTrajetDest:   "",
  pendingWilaya:       "",

  login: async (access, refresh, user) => {
    await SecureStore.setItemAsync("access_token", access);
    await SecureStore.setItemAsync("refresh_token", refresh);
    set({ user, accessToken: access, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  setPending: (phone, first = "", last = "", role = "vendeur", vehicle = "", trajetDepart = "", trajetDest = "", wilaya = "") =>
    set({
      pendingPhone:        phone,
      pendingFirst:        first,
      pendingLast:         last,
      pendingRole:         role,
      pendingVehicle:      vehicle,
      pendingTrajetDepart: trajetDepart,
      pendingTrajetDest:   trajetDest,
      pendingWilaya:       wilaya,
    }),

  clearPending: () => set({
    pendingPhone: "", pendingFirst: "", pendingLast: "",
    pendingRole: "vendeur", pendingVehicle: "",
    pendingTrajetDepart: "", pendingTrajetDest: "", pendingWilaya: "",
  }),

  bootstrap: async () => {
    try {
      const access  = await SecureStore.getItemAsync("access_token");
      const refresh = await SecureStore.getItemAsync("refresh_token");
      if (access && refresh) {
        set({ accessToken: access, isAuthenticated: true });
        try {
          const profile = await api.get("/auth/me/");
          set({ user: {
            id:                 profile.id,
            phone:              profile.phone,
            first_name:         profile.first_name,
            last_name:          profile.last_name,
            email:              profile.email,
            avatar:             profile.avatar_url ?? profile.avatar,
            is_staff:           profile.is_admin,
            city:               profile.city ?? "",
            whatsapp:           profile.whatsapp ?? "",
            role:               profile.role ?? "vendeur",
            vehicle_type:       profile.vehicle_type ?? "",
            trajet_depart:      profile.trajet_depart ?? "",
            trajet_destination: profile.trajet_destination ?? "",
            wilaya:             profile.wilaya ?? "",
          }});
        } catch {
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
          set({ accessToken: null, isAuthenticated: false });
        }
      }
    } finally {
      set({ bootstrapDone: true });
    }
  },
}));
