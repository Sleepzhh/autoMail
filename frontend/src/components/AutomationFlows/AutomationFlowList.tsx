import type { AutomationFlow } from "../../api/automationFlows";
import {
  Dropdown,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "../ui";

interface AutomationFlowListProps {
  flows: AutomationFlow[];
  onEdit: (flow: AutomationFlow) => void;
  onDelete: (id: number) => void;
  onRun: (id: number) => void;
}

export default function AutomationFlowList({
  flows,
  onEdit,
  onDelete,
  onRun,
}: AutomationFlowListProps) {
  if (flows.length === 0) {
    return (
      <div className="text-center py-12 bg-white shadow rounded-lg">
        <p className="text-neutral-500">
          No automation flows yet. Create one to get started.
        </p>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Name</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>Source</TableHeader>
          <TableHeader>Target</TableHeader>
          <TableHeader>Interval</TableHeader>
          <TableHeader>Last Run</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {flows.map((flow) => (
          <TableRow key={flow.id}>
            <TableCell className="font-medium text-neutral-900">
              {flow.name}
            </TableCell>
            <TableCell>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  flow.enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {flow.enabled ? "On" : "Off"}
              </span>
            </TableCell>
            <TableCell className="text-neutral-600">
              {flow.sourceMailAccount?.name} / {flow.sourceMailbox}
            </TableCell>
            <TableCell className="text-neutral-600">
              {flow.targetMailAccount?.name} / {flow.targetMailbox}
            </TableCell>
            <TableCell className="text-neutral-500">
              {flow.intervalMinutes}m
            </TableCell>
            <TableCell className="text-neutral-500 text-xs">
              {formatDate(flow.lastRun)}
            </TableCell>
            <TableCell className="text-right">
              <Dropdown
                items={[
                  {
                    label: "Edit",
                    onClick: () => onEdit(flow),
                  },
                  {
                    label: "Run",
                    onClick: () => onRun(flow.id),
                  },
                  {
                    label: "Delete",
                    onClick: () => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${flow.name}"?`
                        )
                      ) {
                        onDelete(flow.id);
                      }
                    },
                  },
                ]}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
