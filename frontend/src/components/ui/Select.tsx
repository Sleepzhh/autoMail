import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, className = "", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          block w-full px-3 py-2 rounded-md border shadow-sm
          text-sm text-neutral-900 bg-white
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
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export { Select, type SelectProps };
