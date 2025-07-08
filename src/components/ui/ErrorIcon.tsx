// src/components/ui/ErrorIcon.tsx
import React from 'react';

interface ErrorIconProps {
    className?: string;
}

const ErrorIcon: React.FC<ErrorIconProps> = ({ className = '' }) => {
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
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </div>
    );
};

export default ErrorIcon;
