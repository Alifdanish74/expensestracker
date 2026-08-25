'use client'

import React, { useRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'

export interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

/**
 * A date input component that triggers the OS native date picker when the user
 * clicks anywhere on the form field — not just on the calendar icon.
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, disabled, onClick, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    function triggerPicker() {
      if (disabled) return
      const input = inputRef.current
      if (!input) return
      try {
        if ('showPicker' in HTMLInputElement.prototype && typeof input.showPicker === 'function') {
          input.showPicker()
        } else {
          input.focus()
        }
      } catch {
        input.focus()
      }
    }

    return (
      <div
        className="relative w-full cursor-pointer"
        onClick={() => triggerPicker()}
      >
        <input
          {...props}
          ref={inputRef}
          type="date"
          disabled={disabled}
          onClick={(e) => {
            triggerPicker()
            if (onClick) onClick(e)
          }}
          className={cn(
            'w-full cursor-pointer',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100',
            className
          )}
        />
      </div>
    )
  }
)

DateInput.displayName = 'DateInput'
