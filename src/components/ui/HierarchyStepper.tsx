interface HierarchyStepperProps {
    currentStep: 1 | 2;
    onStepClick?: (step: number) => void;
}

export function HierarchyStepper({ currentStep, onStepClick }: HierarchyStepperProps) {
    const steps = [
        { id: 1, label: 'Organización', sublabel: 'EQUIPOS & JUGADORES', icon: '🏢' },
        { id: 2, label: 'Eventos', sublabel: 'TORNEOS & PARTIDOS', icon: '🏆' },
    ];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            padding: '32px 0',
            gap: '24px'
        }}>
            {steps.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div
                            onClick={() => onStepClick?.(step.id)}
                            className={`stepper-item ${onStepClick ? 'interactive' : ''} ${isActive ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                cursor: onStepClick ? 'pointer' : 'default',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                padding: '12px 20px',
                                borderRadius: 'var(--radius-lg)',
                                // Distinct colors for selected vs not selected
                                background: isActive ? 'var(--bg-card)' : 'rgba(0, 0, 0, 0.02)',
                                boxShadow: isActive ? 'var(--shadow-lg)' : 'none',
                                border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                                opacity: isActive ? 1 : 0.8
                            }}
                        >
                            {/* Step Number Circle */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: isActive
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : '#f1f5f9',
                                border: isActive
                                    ? '2px solid #059669'
                                    : '2px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1.125rem',
                                color: isActive ? 'white' : '#94a3b8',
                                boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {isCompleted ? '✓' : step.id}
                            </div>

                            {/* Step Labels */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{
                                    fontSize: '0.9375rem',
                                    fontWeight: 700,
                                    color: isActive ? '#059669' : 'var(--text-secondary)',
                                    lineHeight: 1.2,
                                    transition: 'color 0.3s ease'
                                }}>
                                    {isActive && '• '}{step.label}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: isActive ? 'var(--text-secondary)' : 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    transition: 'color 0.3s ease'
                                }}>
                                    {step.sublabel}
                                </span>
                            </div>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div style={{
                                width: '60px',
                                height: '2px',
                                background: isCompleted ? '#10b981' : '#e2e8f0',
                                borderRadius: '9999px',
                                transition: 'all 0.3s ease',
                                opacity: 0.5
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

