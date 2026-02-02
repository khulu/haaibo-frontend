import React, { useCallback, useState } from "react";
import { ToastContext, ToastItem, ToastType } from "./ToastContextBase";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [nextId, setNextId] = useState(1);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string, durationMs = 3000) => {
    setToasts((prev) => {
      const id = nextId;
      setNextId(id + 1);
      const item: ToastItem = { id, type, message };
      // auto-remove
      setTimeout(() => remove(id), durationMs);
      return [...prev, item];
    });
  }, [nextId, remove]);

  const success = useCallback((message: string, durationMs?: number) => show("success", message, durationMs), [show]);
  const error = useCallback((message: string, durationMs?: number) => show("error", message, durationMs), [show]);

  return (
    <ToastContext.Provider value={{ toasts, show, success, error, remove }}>
      {children}
    </ToastContext.Provider>
  );
};
