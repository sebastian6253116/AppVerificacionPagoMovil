import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  shadow?: 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
  hover?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'lg',
  border = true,
  hover = false
}: CardProps) {
  const baseClasses = 'bg-white rounded-xl'
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }
  
  return (
    <div className={clsx(
      baseClasses,
      paddingClasses[padding],
      shadowClasses[shadow],
      border && 'border border-gray-100',
      hover && 'transition-all duration-200 hover:shadow-xl hover:-translate-y-1',
      className
    )}>
      {children}
    </div>
  )
}