import type {
  ReactNode,
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from "react";

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

function Table({ children, className = "", ...props }: TableProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200">
      <table
        className={`min-w-full divide-y divide-neutral-200 ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

function TableHead({ children, className = "", ...props }: TableHeadProps) {
  return (
    <thead className={`bg-neutral-100 ${className}`} {...props}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

function TableBody({ children, className = "", ...props }: TableBodyProps) {
  return (
    <tbody
      className={`bg-white divide-y divide-neutral-200 ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

function TableRow({ children, className = "", ...props }: TableRowProps) {
  return (
    <tr className={`${className}`} {...props}>
      {children}
    </tr>
  );
}

interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

function TableHeader({ children, className = "", ...props }: TableHeaderProps) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-neutral-400 tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

function TableCell({ children, className = "", ...props }: TableCellProps) {
  return (
    <td
      className={`px-3 py-2 whitespace-nowrap text-sm ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  type TableProps,
  type TableHeadProps,
  type TableBodyProps,
  type TableRowProps,
  type TableHeaderProps,
  type TableCellProps,
};
