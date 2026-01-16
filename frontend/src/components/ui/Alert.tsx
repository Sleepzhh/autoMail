import type { ReactNode } from "react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  success: "bg-green-50 text-green-800 border-green-200",
  error: "bg-red-50 text-red-800 border-red-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
};

function Alert({ variant = "info", children, className = "" }: AlertProps) {
  return (
    <div
      className={`rounded-2xl border p-4 text-sm ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}

export { Alert, type AlertProps, type AlertVariant };
