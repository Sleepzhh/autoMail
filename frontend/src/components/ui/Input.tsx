import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          block w-full px-3 py-2 rounded-md border shadow-sm
          text-sm text-neutral-900 placeholder-neutral-400
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
          ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-neutral-300 focus:border-blue-500 focus:ring-blue-500"
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input, type InputProps };
