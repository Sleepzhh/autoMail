import { useState, useEffect } from "react";
import type { AutomationFlow } from "../../api/automationFlows";
import {
  type MailAccount,
  getMailboxes,
  type Mailbox,
} from "../../api/mailAccounts";

interface AutomationFlowFormProps {
  flow?: AutomationFlow | null;
  accounts: MailAccount[];
  onSubmit: (data: Partial<AutomationFlow>) => void;
  onCancel: () => void;
}

export default function AutomationFlowForm({
  flow,
  accounts,
  onSubmit,
  onCancel,
}: AutomationFlowFormProps) {
  const [formData, setFormData] = useState<Partial<AutomationFlow>>({
    name: "",
    sourceMailAccountId: 0,
    sourceMailbox: "",
    targetMailAccountId: 0,
    targetMailbox: "",
    enabled: true,
    intervalMinutes: 60,
  });

  const [sourceMailboxes, setSourceMailboxes] = useState<Mailbox[]>([]);
  const [targetMailboxes, setTargetMailboxes] = useState<Mailbox[]>([]);
  const [loadingSourceMailboxes, setLoadingSourceMailboxes] = useState(false);
  const [loadingTargetMailboxes, setLoadingTargetMailboxes] = useState(false);

  useEffect(() => {
    if (flow) {
      setFormData(flow);
      if (flow.sourceMailAccountId) {
        loadMailboxes(flow.sourceMailAccountId, "source");
      }
      if (flow.targetMailAccountId) {
        loadMailboxes(flow.targetMailAccountId, "target");
      }
    }
  }, [flow]);

  const loadMailboxes = async (
    accountId: number,
    type: "source" | "target"
  ) => {
    if (!accountId) return;

    if (type === "source") {
      setLoadingSourceMailboxes(true);
    } else {
      setLoadingTargetMailboxes(true);
    }

    try {
      const mailboxes = await getMailboxes(accountId);
      if (type === "source") {
        setSourceMailboxes(mailboxes);
      } else {
        setTargetMailboxes(mailboxes);
      }
    } catch (error) {
      console.error("Error loading mailboxes:", error);
      alert(`Failed to load mailboxes: ${error}`);
    } finally {
      if (type === "source") {
        setLoadingSourceMailboxes(false);
      } else {
        setLoadingTargetMailboxes(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-lg p-6 space-y-4"
    >
      <h2 className="text-lg font-medium text-gray-900">
        {flow ? "Edit Automation Flow" : "Add Automation Flow"}
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="e.g., Move Gmail to Outlook"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source Account
          </label>
          <select
            value={formData.sourceMailAccountId || ""}
            onChange={(e) => {
              const accountId = parseInt(e.target.value);
              setFormData({
                ...formData,
                sourceMailAccountId: accountId,
                sourceMailbox: "",
              });
              loadMailboxes(accountId, "source");
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            required
          >
            <option value="">Select account...</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source Mailbox
          </label>
          <select
            value={formData.sourceMailbox || ""}
            onChange={(e) =>
              setFormData({ ...formData, sourceMailbox: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            disabled={!formData.sourceMailAccountId || loadingSourceMailboxes}
            required
          >
            <option value="">
              {loadingSourceMailboxes ? "Loading..." : "Select mailbox..."}
            </option>
            {sourceMailboxes.map((mailbox) => (
              <option key={mailbox.path} value={mailbox.path}>
                {mailbox.name} {mailbox.specialUse && `(${mailbox.specialUse})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target Account
          </label>
          <select
            value={formData.targetMailAccountId || ""}
            onChange={(e) => {
              const accountId = parseInt(e.target.value);
              setFormData({
                ...formData,
                targetMailAccountId: accountId,
                targetMailbox: "",
              });
              loadMailboxes(accountId, "target");
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            required
          >
            <option value="">Select account...</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target Mailbox
          </label>
          <select
            value={formData.targetMailbox || ""}
            onChange={(e) =>
              setFormData({ ...formData, targetMailbox: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            disabled={!formData.targetMailAccountId || loadingTargetMailboxes}
            required
          >
            <option value="">
              {loadingTargetMailboxes ? "Loading..." : "Select mailbox..."}
            </option>
            {targetMailboxes.map((mailbox) => (
              <option key={mailbox.path} value={mailbox.path}>
                {mailbox.name} {mailbox.specialUse && `(${mailbox.specialUse})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Interval (minutes)
        </label>
        <input
          type="number"
          value={formData.intervalMinutes || 60}
          onChange={(e) =>
            setFormData({
              ...formData,
              intervalMinutes: parseInt(e.target.value),
            })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          min="1"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          How often to check and move emails (minimum 1 minute)
        </p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled !== undefined ? formData.enabled : true}
          onChange={(e) =>
            setFormData({ ...formData, enabled: e.target.checked })
          }
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
          Enable this automation
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {flow ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
