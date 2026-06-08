'use client'

import { CheckCircle } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface Step {
  id: string
  title: string
  description?: string
}

type StepperContextValue = {
  steps: Step[]
  currentStep: number
  goToStep: (index: number) => void
  handleNext: () => void
  handleBack: () => void
  canProceed: boolean
  isLastStep: boolean
  isFirstStep: boolean
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

export function useStepper() {
  const context = React.use(StepperContext)
  if (!context) {
    throw new Error('useStepper must be used within a <Stepper>')
  }
  return context
}

// --- Compound sub-components ---

function StepperIndicator({ className }: { className?: string }) {
  const { steps, currentStep } = useStepper()

  return (
    <div className={cn('mt-6 flex items-start justify-between gap-2 px-2', className)}>
      {steps.map((step, idx) => {
        const isActive = idx === currentStep
        const isCompleted = idx < currentStep

        return (
          <div
            key={step.id}
            className="relative flex min-w-0 flex-1 flex-col"
          >
            <div className="flex items-center justify-center relative z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  isCompleted && 'bg-primary text-primary-foreground',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground border-2',
                )}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
              </div>
            </div>
            <div className="text-center mt-3 text-xs font-medium text-muted-foreground px-1">
              <span className={cn(isActive && 'text-foreground')}>{step.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full h-[2px] -z-0">
                <div className="h-full bg-muted transition-all" />
                <div
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StepperStep({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  const { currentStep } = useStepper()
  const isActive = index === currentStep

  if (!isActive) return null

  return (
    <div
      className={cn('space-y-6', className)}
      role="tabpanel"
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

function StepperActions({
  renderBack,
  renderNext,
  className,
}: {
  renderBack?: (props: { onClick: () => void; disabled?: boolean; label: React.ReactNode }) => React.ReactNode
  renderNext?: (props: {
    onClick: () => void
    disabled?: boolean
    label: React.ReactNode
    isLastStep: boolean
  }) => React.ReactNode
  className?: string
}) {
  const { isFirstStep, isLastStep, handleBack, handleNext, canProceed } = useStepper()

  const backNode = renderBack?.({
    onClick: handleBack,
    disabled: !canProceed,
    label: isFirstStep ? 'Cancel' : 'Back',
  })

  const nextNode = renderNext?.({
    onClick: handleNext,
    disabled: !canProceed,
    label: isLastStep ? 'Submit' : 'Next',
    isLastStep,
  })

  return (
    <div className={cn('flex justify-between', className)}>
      {backNode}
      {nextNode}
    </div>
  )
}

// --- Main Stepper component ---

export interface StepperProps {
  steps: Step[]
  initialStep?: number
  children: React.ReactNode
  onStepChange?: (step: number) => void
  canProceed?: boolean
}

export function Stepper({ steps, initialStep = 0, children, onStepChange, canProceed = true }: StepperProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep)

  const goToStep = React.useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(Math.round(index), 0), steps.length - 1)
      setCurrentStep(clamped)
      onStepChange?.(clamped)
    },
    [steps.length, onStepChange],
  )

  const handleNext = React.useCallback(() => {
    goToStep(Math.min(currentStep + 1, steps.length - 1))
  }, [currentStep, steps.length, goToStep])

  const handleBack = React.useCallback(() => {
    goToStep(Math.max(currentStep - 1, 0))
  }, [currentStep, goToStep])

  const value = React.useMemo<StepperContextValue>(
    () => ({
      steps,
      currentStep,
      goToStep,
      handleNext,
      handleBack,
      canProceed,
      isLastStep: currentStep === steps.length - 1,
      isFirstStep: currentStep === 0,
    }),
    [steps, currentStep, goToStep, handleNext, handleBack, canProceed],
  )

  return <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
}

// Attach compound sub-components
Stepper.Indicator = StepperIndicator
Stepper.Step = StepperStep
Stepper.Actions = StepperActions

export { StepperIndicator, StepperStep, StepperActions }
