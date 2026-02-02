import { createContext } from "react";

export type ToastType = "success" | "error" | "warning" | "info";
export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  show: (type: ToastType, message: string, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  remove: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
