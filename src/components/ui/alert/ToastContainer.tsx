import { useToast } from "../../../context/useToast";

const typeClasses: Record<string, string> = {
  success: "border-success-500 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-400",
  error: "border-error-500 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400",
  warning: "border-warning-500 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-warning-400",
  info: "border-blue-light-500 bg-blue-light-50 text-blue-light-700 dark:border-blue-light-500/30 dark:bg-blue-light-500/15 dark:text-blue-light-400",
};

export default function ToastContainer() {
  const { toasts, remove } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[1000] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border px-4 py-3 shadow-theme-xs flex items-start gap-3 min-w-[280px] ${typeClasses[t.type]}`}
          role="alert"
        >
          <div className="flex-1 text-sm">
            {t.message}
          </div>
          <button
            onClick={() => remove(t.id)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
