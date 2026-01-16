import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Plus } from "lucide-react";

export default function AutomationFlowsPage() {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);

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
      toast.error(`Failed to load data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Partial<AutomationFlow>) => {
    try {
      await createAutomationFlow(data);
      toast.success("Automation flow created successfully");
      setShowForm(false);
      loadData();
    } catch (error) {
      toast.error(`Failed to create flow: ${error}`);
    }
  };

  const handleUpdate = async (data: Partial<AutomationFlow>) => {
    if (!editingFlow) return;

    try {
      await updateAutomationFlow(editingFlow.id, data);
      toast.success("Automation flow updated successfully");
      setEditingFlow(null);
      setShowForm(false);
      loadData();
    } catch (error) {
      toast.error(`Failed to update flow: ${error}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAutomationFlow(id);
      toast.success("Automation flow deleted successfully");
      loadData();
    } catch (error) {
      toast.error(`Failed to delete flow: ${error}`);
    }
  };

  const handleRun = async (id: number) => {
    try {
      await runAutomationFlow(id);
      toast.success("Automation flow started successfully");
      loadData();
    } catch (error) {
      toast.error(`Failed to run flow: ${error}`);
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
    <div className="space-y-4">
      <PageHeader
        title="Automation Flows"
        description="Create and manage automated email flows between your mail accounts."
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowForm(true)}
            disabled={accounts.length === 0}
          >
            <Plus className="size-4" />
          </Button>
        }
      />

      {accounts.length === 0 && (
        <Alert variant="warning">
          You need to create at least one mail account before you can create
          automation flows.
        </Alert>
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
        />
      )}
    </div>
  );
}
