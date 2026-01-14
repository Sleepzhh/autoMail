import { useState, useEffect } from "react";
import {
  getAutomationFlows,
  createAutomationFlow,
  updateAutomationFlow,
  deleteAutomationFlow,
  runAutomationFlow,
  type AutomationFlow,
} from "../api/automationFlows";
import { getMailAccounts, type MailAccount } from "../api/mailAccounts";
import AutomationFlowList from "../components/AutomationFlows/AutomationFlowList";
import AutomationFlowForm from "../components/AutomationFlows/AutomationFlowForm";

export default function AutomationFlowsPage() {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flowsData, accountsData] = await Promise.all([
        getAutomationFlows(),
        getMailAccounts(),
      ]);
      setFlows(flowsData);
      setAccounts(accountsData);
    } catch (error) {
      showMessage("error", `Failed to load data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = async (data: Partial<AutomationFlow>) => {
    try {
      await createAutomationFlow(data);
      showMessage("success", "Automation flow created successfully");
      setShowForm(false);
      loadData();
    } catch (error) {
      showMessage("error", `Failed to create flow: ${error}`);
    }
  };

  const handleUpdate = async (data: Partial<AutomationFlow>) => {
    if (!editingFlow) return;

    try {
      await updateAutomationFlow(editingFlow.id, data);
      showMessage("success", "Automation flow updated successfully");
      setEditingFlow(null);
      setShowForm(false);
      loadData();
    } catch (error) {
      showMessage("error", `Failed to update flow: ${error}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAutomationFlow(id);
      showMessage("success", "Automation flow deleted successfully");
      loadData();
    } catch (error) {
      showMessage("error", `Failed to delete flow: ${error}`);
    }
  };

  const handleRun = async (id: number) => {
    try {
      await runAutomationFlow(id);
      showMessage("success", "Automation flow started successfully");
      loadData();
    } catch (error) {
      showMessage("error", `Failed to run flow: ${error}`);
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await updateAutomationFlow(id, { enabled });
      showMessage(
        "success",
        `Automation flow ${enabled ? "enabled" : "disabled"}`
      );
      loadData();
    } catch (error) {
      showMessage("error", `Failed to update flow: ${error}`);
    }
  };

  const handleEdit = (flow: AutomationFlow) => {
    setEditingFlow(flow);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingFlow(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          Automation Flows
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          disabled={accounts.length === 0}
        >
          Add Flow
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            You need to create at least one mail account before you can create
            automation flows.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <AutomationFlowForm
        open={showForm}
        flow={editingFlow}
        accounts={accounts}
        onSubmit={editingFlow ? handleUpdate : handleCreate}
        onCancel={handleCancelForm}
      />

      {loading ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">Loading automation flows...</p>
        </div>
      ) : (
        <AutomationFlowList
          flows={flows}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRun={handleRun}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
