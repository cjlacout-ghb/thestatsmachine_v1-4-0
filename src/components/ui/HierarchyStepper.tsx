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
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                opacity: isActive ? 1 : 0.5,
                                cursor: onStepClick ? 'pointer' : 'default',
                                transition: 'all 0.3s ease',
                                transform: isActive ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >
                            {/* Step Number Circle */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: isActive
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                    : isCompleted
                                        ? '#10b981'
                                        : '#f1f5f9',
                                border: isActive
                                    ? '2px solid #2563eb'
                                    : isCompleted
                                        ? '2px solid #10b981'
                                        : '2px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1.125rem',
                                color: isActive || isCompleted ? 'white' : '#94a3b8',
                                boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {isCompleted ? '✓' : step.id}
                            </div>

                            {/* Step Labels */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    lineHeight: 1.2
                                }}>
                                    {step.label}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {step.sublabel}
                                </span>
                            </div>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div style={{
                                width: '80px',
                                height: '2px',
                                background: isCompleted ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#e2e8f0',
                                borderRadius: '9999px',
                                transition: 'all 0.3s ease'
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
