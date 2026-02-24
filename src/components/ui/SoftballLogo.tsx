
interface SoftballLogoProps {
    className?: string;
    size?: number;
}

export function SoftballLogo({ className = '', size = 64 }: SoftballLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
        >
            {/* Ball Background */}
            <circle cx="50" cy="50" r="48" fill="#FDE047" stroke="black" strokeWidth="3" />

            {/* Stitching Lines (Curved) */}
            <path
                d="M20 25 C 40 45, 60 45, 80 25"
                stroke="#DC2626"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="6 4"
            />

            <path
                d="M20 75 C 40 55, 60 55, 80 75"
                stroke="#DC2626"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="6 4"
            />

            {/* Stitch details (small dashes across the main lines) can be simulated with dasharray above */}

            {/* Shine */}
            <ellipse cx="35" cy="35" rx="10" ry="6" fill="white" fillOpacity="0.4" transform="rotate(-45 35 35)" />
        </svg>
    );
}
