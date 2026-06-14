import { create } from 'zustand';
import type { DemoUser } from '@/types/cases';
import { USE_MOCK, DEFAULT_DEMO_USER, DEMO_USERS } from '@/config';

interface DemoUserState {
  currentUser: DemoUser;
  setCurrentUser: (user: DemoUser) => void;
}

const storedUserId = localStorage.getItem('demo_user_id');
const initialUser = DEMO_USERS.find((u) => u.id === storedUserId) || DEFAULT_DEMO_USER;

export const useDemoUserStore = create<DemoUserState>((set) => ({
  currentUser: USE_MOCK ? initialUser : DEFAULT_DEMO_USER,
  setCurrentUser: (user) => {
    localStorage.setItem('demo_user_id', user.id);
    set({ currentUser: user });
  },
}));

/** @deprecated Use useDemoUserStore */
export const useAuthStore = create<{
  user: DemoUser | null;
  isAuthenticated: boolean;
  setUser: (user: DemoUser) => void;
  logout: () => void;
}>((set) => ({
  user: initialUser,
  isAuthenticated: true,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: initialUser, isAuthenticated: true }),
}));

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
}));

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'default' | 'danger';
  onConfirm: (() => void) | null;
  openModal: (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
  }) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'default',
  onConfirm: null,
  openModal: (opts) =>
    set({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel || 'Confirmar',
      cancelLabel: opts.cancelLabel || 'Cancelar',
      variant: opts.variant || 'default',
      onConfirm: opts.onConfirm,
    }),
  closeModal: () => set({ isOpen: false, onConfirm: null }),
}));

interface CaseState {
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  selectedIds: [],
  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((i) => i !== id)
        : [...s.selectedIds, id],
    })),
  selectAll: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
}));

/** @deprecated Use useCaseStore */
export const useEmailStore = useCaseStore;
