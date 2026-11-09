import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CircleCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StageDecision } from '@/types/document'
import './progress-indicator.css'

export interface ProgressStage {
    id: string
    name: string
    status: StageDecision
    detail?: string
    participants?: { name: string; status: StageDecision }[]
}

export interface PaymentStatus {
    isPaid: boolean
    label: string
    tone: 'success' | 'warning' | 'neutral'
}

export interface ProgressIndicatorProps {
    steps?: ProgressStage[]
    compact?: boolean
    variant?: string
    paymentStatus?: PaymentStatus
}

export const progressStatusLabels: Record<StageDecision, string> = {
    WAITING: 'Belum dimulai', PENDING: 'Menunggu', APPROVED: 'Disetujui', REJECTED: 'Dikembalikan',
}

export function completedProgress(statuses: StageDecision[]): number {
    if (statuses.length < 2) return 0
    const firstIncomplete = statuses.findIndex((status) => status !== 'APPROVED')
    const completed = firstIncomplete === -1 ? statuses.length : firstIncomplete
    return Math.max(0, completed - 1) / (statuses.length - 1) * 100
}

const ProgressIndicator = ({ steps, compact, variant, paymentStatus }: ProgressIndicatorProps) => {
    const [step, setStep] = useState(1)
    const [isExpanded, setIsExpanded] = useState(true)

    const handleContinue = () => {
        if (step < 3) {
            setStep(step + 1)
            setIsExpanded(false)
        }
    }

    const handleBack = () => {
        if (step == 2) {
            setIsExpanded(true)
        }
        if (step > 1) {
            setStep(step - 1)
        }
    }

    if (steps) {
        return (
            <div className={cn("approval-capsule", compact && "approval-capsule--compact", variant && `approval-capsule--${variant}`)}>
                <ol
                    className={cn(
                        "approval-progress approval-progress--capsule",
                        compact && "approval-progress--compact"
                    )}
                    aria-label="Progres persetujuan"
                >
                    {steps.map((stage, index) => {
                        const isLast = index === steps.length - 1
                        const statusText = stage.detail || progressStatusLabels[stage.status]
                        const dotLabel = `${stage.name}: ${statusText}`
                        return (
                            <li
                                key={stage.id}
                                className={cn(
                                    "approval-progress-step",
                                    `is-${stage.status.toLowerCase()}`,
                                    isLast && "approval-progress-step--last"
                                )}
                            >
                                <span
                                    className="approval-progress-dot"
                                    role="img"
                                    tabIndex={0}
                                    title={dotLabel}
                                    aria-label={dotLabel}
                                >
                                    {stage.status === 'APPROVED' ? '✓' : stage.status === 'REJECTED' ? '×' : ''}
                                </span>
                                {!compact && (
                                    <span className="approval-progress-copy">
                                        <strong style={{ overflowWrap: 'anywhere' }}>{stage.name}</strong>
                                        <small>{stage.detail || progressStatusLabels[stage.status]}</small>
                                        {stage.participants?.map((person) => (
                                            <small key={person.name}>{person.name}: {progressStatusLabels[person.status]}</small>
                                        ))}
                                    </span>
                                )}
                                {!isLast && (
                                    <span
                                        className={cn(
                                            "step-connector",
                                            "approval-progress-connector",
                                            stage.status === 'APPROVED' && "is-approved"
                                        )}
                                        aria-hidden="true"
                                    />
                                )}
                            </li>
                        )
                    })}
                </ol>
                {paymentStatus && (
                    <>
                        <span className="stepper-payment-divider" aria-hidden="true" />
                        <div
                            className={cn("stepper-payment-node", `is-${paymentStatus.tone}`)}
                            role="img"
                            tabIndex={0}
                            title={`Pembayaran: ${paymentStatus.label}`}
                            aria-label={`Pembayaran: ${paymentStatus.label}`}
                        >
                            {paymentStatus.tone === 'success' ? '✓' : paymentStatus.tone === 'warning' ? <Clock size={11} strokeWidth={2.5} aria-hidden="true" /> : ''}
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center gap-8">
            <div className="flex items-center gap-6 relative">
                {[1, 2, 3].map((dot) => (
                    <div
                        key={dot}
                        className={cn(
                            "w-2 h-2 rounded-full relative z-10",
                            dot <= step ? "bg-white" : "bg-gray-300"
                        )}
                    />
                ))}
                {/* Green progress overlay */}
                <motion.div
                    initial={{ width: '12px', height: "24px", x: 0 }}
                    animate={{
                        width: step === 1 ? '24px' : step === 2 ? '60px' : '96px',
                        x: 0
                    }}
                    className="absolute -left-[8px] -top-[8px] -translate-y-1/2 h-3 bg-green-500 rounded-full"
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        mass: 0.8,
                        bounce: 0.25,
                        duration: 0.6
                    }}
                />
            </div>
            {/* Buttons container */}
            <div className="w-full max-w-sm">
                <motion.div
                    className="flex items-center gap-1"
                    animate={{
                        justifyContent: isExpanded ? 'stretch' : 'space-between'
                    }}
                >
                    {!isExpanded && (
                        <motion.button
                            initial={{ opacity: 0, width: 0, scale: 0.8 }}
                            animate={{ opacity: 1, width: "64px", scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                                mass: 0.8,
                                bounce: 0.25,
                                duration: 0.6,
                                opacity: { duration: 0.2 }
                            }}
                            onClick={handleBack}
                            className="px-4 py-3 text-black flex items-center justify-center   bg-gray-100  font-semibold rounded-full hover:bg-gray-50 hover:border transition-colors flex-1 w-16 text-sm"
                        >
                            Back
                        </motion.button>
                    )}
                    <motion.button
                        onClick={handleContinue}
                        animate={{
                            flex: isExpanded ? 1 : 'inherit',
                        }}
                        className={cn(
                            "px-4 py-3 rounded-full text-white bg-[#006cff]   transition-colors flex-1 w-56",
                            !isExpanded && 'w-44'
                        )}
                    >
                        <div className="flex items-center font-[600] justify-center gap-2 text-sm">
                            {step === 3 && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 15,
                                        mass: 0.5,
                                        bounce: 0.4
                                    }}
                                >
                                    <CircleCheck size={16} />
                                </motion.div>
                            )}
                            {step === 3 ? 'Finish' : 'Continue'}
                        </div>
                    </motion.button>
                </motion.div>
            </div>
        </div>
    )
}

export default ProgressIndicator
