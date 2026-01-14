import { useState, useEffect } from "react";
import type { AutomationFlow } from "../../api/automationFlows";
import {
  type MailAccount,
  getMailboxes,
  type Mailbox,
} from "../../api/mailAccounts";
import { Button, Input, Select, Label, Dialog } from "../ui";

interface AutomationFlowFormProps {
  open: boolean;
  flow?: AutomationFlow | null;
  accounts: MailAccount[];
  onSubmit: (data: Partial<AutomationFlow>) => void;
  onCancel: () => void;
}

export default function AutomationFlowForm({
  open,
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
    } else {
      setFormData({
        name: "",
        sourceMailAccountId: 0,
        sourceMailbox: "",
        targetMailAccountId: 0,
        targetMailbox: "",
        enabled: true,
        intervalMinutes: 60,
      });
      setSourceMailboxes([]);
      setTargetMailboxes([]);
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

  const title = flow ? "Edit Automation Flow" : "Add Automation Flow";

  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            id="name"
            value={formData.name || ""}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="mt-1"
            placeholder="e.g., Move Gmail to Outlook"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sourceAccount">Source Account</Label>
            <Select
              id="sourceAccount"
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
              className="mt-1"
              required
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.email})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="sourceMailbox">Source Mailbox</Label>
            <Select
              id="sourceMailbox"
              value={formData.sourceMailbox || ""}
              onChange={(e) =>
                setFormData({ ...formData, sourceMailbox: e.target.value })
              }
              className="mt-1"
              disabled={
                !formData.sourceMailAccountId || loadingSourceMailboxes
              }
              required
            >
              <option value="">
                {loadingSourceMailboxes ? "Loading..." : "Select mailbox..."}
              </option>
              {sourceMailboxes.map((mailbox) => (
                <option key={mailbox.path} value={mailbox.path}>
                  {mailbox.name}{" "}
                  {mailbox.specialUse && `(${mailbox.specialUse})`}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetAccount">Target Account</Label>
            <Select
              id="targetAccount"
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
              className="mt-1"
              required
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.email})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="targetMailbox">Target Mailbox</Label>
            <Select
              id="targetMailbox"
              value={formData.targetMailbox || ""}
              onChange={(e) =>
                setFormData({ ...formData, targetMailbox: e.target.value })
              }
              className="mt-1"
              disabled={
                !formData.targetMailAccountId || loadingTargetMailboxes
              }
              required
            >
              <option value="">
                {loadingTargetMailboxes ? "Loading..." : "Select mailbox..."}
              </option>
              {targetMailboxes.map((mailbox) => (
                <option key={mailbox.path} value={mailbox.path}>
                  {mailbox.name}{" "}
                  {mailbox.specialUse && `(${mailbox.specialUse})`}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="intervalMinutes">Interval (minutes)</Label>
          <Input
            type="number"
            id="intervalMinutes"
            value={formData.intervalMinutes || 60}
            onChange={(e) =>
              setFormData({
                ...formData,
                intervalMinutes: parseInt(e.target.value),
              })
            }
            className="mt-1"
            min={1}
            required
          />
          <p className="mt-1 text-xs text-neutral-500">
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
          />
          <label
            htmlFor="enabled"
            className="ml-2 block text-sm text-neutral-900"
          >
            Enable this automation
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{flow ? "Update" : "Create"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
