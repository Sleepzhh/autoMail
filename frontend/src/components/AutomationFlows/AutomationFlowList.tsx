import type { AutomationFlow } from "../../api/automationFlows";

interface AutomationFlowListProps {
  flows: AutomationFlow[];
  onEdit: (flow: AutomationFlow) => void;
  onDelete: (id: number) => void;
  onRun: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
}

export default function AutomationFlowList({
  flows,
  onEdit,
  onDelete,
  onRun,
  onToggle,
}: AutomationFlowListProps) {
  if (flows.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">
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
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {flows.map((flow) => (
          <li key={flow.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {flow.name}
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flow.enabled}
                      onChange={(e) => onToggle(flow.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      flow.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {flow.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {flow.sourceMailAccount?.name}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span>{flow.sourceMailbox}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {flow.targetMailAccount?.name}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span>{flow.targetMailbox}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>Interval: {flow.intervalMinutes} minutes</span>
                  <span>|</span>
                  <span>Last run: {formatDate(flow.lastRun)}</span>
                  <span>|</span>
                  <span>Next run: {formatDate(flow.nextRun)}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => onRun(flow.id)}
                  className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Run Now
                </button>
                <button
                  onClick={() => onEdit(flow)}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(`Are you sure you want to delete "${flow.name}"?`)
                    ) {
                      onDelete(flow.id);
                    }
                  }}
                  className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
