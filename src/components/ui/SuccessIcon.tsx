// src/components/ui/SuccessIcon.tsx
import React from 'react';

interface SuccessIconProps {
    className?: string;
}

const SuccessIcon: React.FC<SuccessIconProps> = ({ className = '' }) => {
    return (
        <div className={`relative ${className}`}>
            <svg
                className="w-full h-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="opacity-20"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4"
                    className="animate-pulse"
                />
            </svg>
        </div>
    );
};

export default SuccessIcon;
