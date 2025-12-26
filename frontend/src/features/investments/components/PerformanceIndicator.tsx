/** Indicador visual de performance com bolinhas coloridas. */

interface PerformanceIndicatorProps {
  score: number; // 1-5
}

const performanceLabels = {
  5: { label: "Excelente", color: "bg-green-500" },
  4: { label: "Boa", color: "bg-green-400" },
  3: { label: "Neutra", color: "bg-yellow-400" },
  2: { label: "Atenção", color: "bg-orange-400" },
  1: { label: "Ruim", color: "bg-red-400" },
};

export function PerformanceIndicator({ score }: PerformanceIndicatorProps) {
  const config = performanceLabels[score as keyof typeof performanceLabels] || performanceLabels[3];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < score ? config.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{config.label}</span>
    </div>
  );
}

