import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import getAuth from "../../hooks/api/useAuthApi";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  path: string;
};

type StepState = Record<string, boolean>;

const STEPS: OnboardingStep[] = [
  {
    id: "org-branding",
    title: "Configure organization branding",
    description: "Set company logo, colors, and reservation settings.",
    path: "/organizations",
  },
  {
    id: "invite-users",
    title: "Invite users",
    description: "Create users manually or bulk upload via CSV/XLSX.",
    path: "/users/create-bulk",
  },
  {
    id: "teams",
    title: "Set up teams",
    description: "Create teams so attendance and collaboration data stays organized.",
    path: "/teams",
  },
  {
    id: "locations",
    title: "Add office locations and floorplans",
    description: "Create locations and upload floorplans for map-based booking.",
    path: "/locations",
  },
  {
    id: "resources-import",
    title: "Import desks and rooms",
    description: "Bulk import resources and place them on the floorplan.",
    path: "/resources-import",
  },
  {
    id: "pilot-reservation",
    title: "Run a pilot reservation",
    description: "Create a test reservation and verify check-in flow.",
    path: "/reservations",
  },
  {
    id: "report-export",
    title: "Validate reporting",
    description: "Open reservation reports and test CSV/PDF export.",
    path: "/reservation-reports",
  },
  {
    id: "notifications",
    title: "Review notification experience",
    description: "Confirm users can see and mark notifications as read.",
    path: "/notifications",
  },
];

function buildStorageKey(companyId: string | null) {
  return `onboarding:admin:${companyId ?? "global"}:v1`;
}

export default function AdminOnboardingPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const companyId = auth.getCompanyId() as string | null;
  const storageKey = useMemo(() => buildStorageKey(companyId), [companyId]);
  const [stepState, setStepState] = useState<StepState>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setStepState({});
        return;
      }
      const parsed = JSON.parse(raw) as StepState;
      setStepState(parsed);
    } catch {
      setStepState({});
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stepState));
    } catch {
      // Ignore write failures (privacy mode/storage quota)
    }
  }, [storageKey, stepState]);

  const completedCount = useMemo(() => {
    return STEPS.reduce((count, step) => count + (stepState[step.id] ? 1 : 0), 0);
  }, [stepState]);

  const progressPercent = Math.round((completedCount / STEPS.length) * 100);
  const allDone = completedCount === STEPS.length;

  const toggleStep = (stepId: string) => {
    setStepState((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const markAllDone = () => {
    const next: StepState = {};
    for (const step of STEPS) next[step.id] = true;
    setStepState(next);
  };

  const resetAll = () => {
    setStepState({});
  };

  return (
    <div className="space-y-6">
      <ComponentCard title="Admin Onboarding Wizard">
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Label>Workspace setup progress</Label>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Complete these steps to fully launch desk booking for your tenant.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold text-gray-800 dark:text-white/90">{progressPercent}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{completedCount} of {STEPS.length} complete</div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${progressPercent}%` }}
              aria-hidden
            />
          </div>
        </div>

        {allDone && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
            Setup complete. Your tenant onboarding checklist is done.
          </div>
        )}

        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const done = !!stepState[step.id];
            return (
              <div
                key={step.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {index + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(step.path)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      Open Step
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium text-white ${
                        done ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {done ? "Mark Incomplete" : "Mark Complete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={markAllDone}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Mark All Complete
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            Reset Checklist
          </button>
        </div>
      </ComponentCard>
    </div>
  );
}
