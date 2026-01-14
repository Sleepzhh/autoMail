import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, className = "", children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`
            block w-full px-3 py-2 pr-8 rounded-md border
            text-sm text-neutral-900 bg-white
            truncate appearance-none cursor-pointer
            disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
            ${
              error
                ? "border-red-300 focus:border-red-500"
                : "border-neutral-300 focus:border-blue-500"
            }
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"
          size={18}
        />
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select, type SelectProps };
