import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {action}
      </div>
      {description && (
        <p className="text-sm text-neutral-500">{description}</p>
      )}
    </div>
  );
}
