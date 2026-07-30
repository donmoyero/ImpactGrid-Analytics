import { ProjectStage } from "@/types";
import { cn } from "@/lib/utils";

const stages: { id: ProjectStage; label: string }[] = [
  { id: "planning", label: "Planning" },
  { id: "design", label: "Design" },
  { id: "development", label: "Development" },
  { id: "testing", label: "Testing" },
  { id: "completed", label: "Completed" },
];

export default function ProgressTracker({
  currentStage,
  progress,
}: {
  currentStage: ProjectStage;
  progress: Partial<Record<ProjectStage, number>>;
}) {
  const currentIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="space-y-5">
      {stages.map((stage, i) => {
        const pct = progress[stage.id] ?? (i < currentIndex ? 100 : i === currentIndex ? 40 : 0);
        const done = i < currentIndex;
        const active = i === currentIndex;

        return (
          <div key={stage.id}>
            <div className="mb-1.5 flex items-center justify-between">
              <span
                className={cn(
                  "label-tag",
                  active ? "text-signal" : done ? "text-blueprint2" : "text-slate"
                )}
              >
                {stage.label}
              </span>
              <span className="font-mono text-xs text-slate">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className={cn("h-full rounded-full", active ? "bg-signal" : "bg-blueprint2")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
