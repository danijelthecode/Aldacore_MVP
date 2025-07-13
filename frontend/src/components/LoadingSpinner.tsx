import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-secondary-50 bg-opacity-75 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
          role="status"
          aria-label="Loading"
        />
        {message && (
          <p className="text-secondary-600 text-sm font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;