import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface StepShellProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  disableNext?: boolean;
}

export function StepShell({
  currentStep,
  totalSteps,
  title,
  description,
  children,
  onNext,
  onBack,
  nextLabel = 'Next',
  disableNext = false
}: StepShellProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="wizard-container"
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[var(--color-tertiary)] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {currentStep}
          </div>
          <div className="h-1 w-24 bg-[var(--color-surface-light)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--color-accent)] transition-all duration-500" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-[var(--color-text)] opacity-60">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      </div>

      <header className="mb-10 text-left">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-xl opacity-80 leading-relaxed max-w-2xl">{description}</p>
      </header>

      <div className="card-fancy mb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border-light)]">
        {onBack ? (
          <button
            onClick={onBack}
            className="px-8 py-4 text-lg font-medium text-[var(--color-text)] hover:opacity-70 transition-opacity"
          >
            Go Back
          </button>
        ) : (
          <div />
        )}

        {onNext && (
          <button
            onClick={onNext}
            disabled={disableNext}
            className={`
              px-12 py-4 rounded-xl text-xl font-bold text-white shadow-lg transition-all
              ${disableNext 
                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                : 'bg-[var(--color-tertiary)] hover:bg-[var(--color-accent)] active:scale-95'
              }
            `}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
