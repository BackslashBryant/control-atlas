type Step = {
  id: string;
  label: string;
};

export function StepIndicator({
  steps,
  currentStepId,
}: {
  steps: Step[];
  currentStepId: string;
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <div aria-label="Progress" className="ca-steps" role="list">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = step.id === currentStepId;
        return (
          <div
            className={`ca-step ${active ? "ca-step--active" : ""} ${done ? "ca-step--done" : ""}`.trim()}
            key={step.id}
            role="listitem"
          >
            <span aria-hidden="true" className="ca-step__num">
              {done ? "✓" : index + 1}
            </span>
            <span>{step.label}</span>
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="ca-step__connector" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
