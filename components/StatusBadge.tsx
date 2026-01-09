import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

interface StatusBadgeProps {
  status: 'success' | 'error' | 'pending' | 'warning'
  text: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export default function StatusBadge({ 
  status, 
  text, 
  size = 'md', 
  showIcon = true,
  className = '' 
}: StatusBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  const statusConfig = {
    success: {
      classes: 'bg-success-50 text-success-700 border border-success-200',
      icon: CheckCircle
    },
    error: {
      classes: 'bg-error-50 text-error-700 border border-error-200',
      icon: XCircle
    },
    pending: {
      classes: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      icon: Clock
    },
    warning: {
      classes: 'bg-orange-50 text-orange-700 border border-orange-200',
      icon: AlertTriangle
    }
  }
  
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <span className={clsx(
      baseClasses,
      sizeClasses[size],
      config.classes,
      className
    )}>
      {showIcon && (
        <Icon className={clsx(iconSizes[size], 'mr-1.5')} />
      )}
      {text}
    </span>
  )
}