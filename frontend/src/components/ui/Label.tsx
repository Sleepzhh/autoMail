import { forwardRef, type LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, className = "", children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-neutral-700 ${className}`}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Label, type LabelProps };
