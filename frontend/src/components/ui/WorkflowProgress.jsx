import { Check } from 'lucide-react';

export function WorkflowProgress({ current, steps }) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.matches?.includes(current) || step.key === current));
  return (
    <ol className="progress-steps">
      {steps.map((step, index) => {
        const state = index < currentIndex ? 'is-complete' : index === currentIndex ? 'is-active' : 'is-pending';
        return (
          <li className={`progress-step ${state}`} key={step.key}>
            <span className="progress-node">{state === 'is-complete' ? <Check size={13} /> : index + 1}</span>
            <span className="progress-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
