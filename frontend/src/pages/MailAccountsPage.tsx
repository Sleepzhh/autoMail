import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getMailAccounts,
  createMailAccount,
  updateMailAccount,
  deleteMailAccount,
  type MailAccount,
} from "../api/mailAccounts";
import MailAccountList from "../components/MailAccounts/MailAccountList";
import MailAccountForm from "../components/MailAccounts/MailAccountForm";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Plus } from "lucide-react";

export default function MailAccountsPage() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MailAccount | null>(
    null
  );

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getMailAccounts();
      setAccounts(data);
    } catch (error) {
      toast.error(`Failed to load accounts: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Partial<MailAccount>) => {
    try {
      await createMailAccount(data);
      toast.success("Account created successfully");
      setShowForm(false);
      loadAccounts();
    } catch (error) {
      toast.error(`Failed to create account: ${error}`);
    }
  };

  const handleUpdate = async (data: Partial<MailAccount>) => {
    if (!editingAccount) return;

    try {
      await updateMailAccount(editingAccount.id, data);
      toast.success("Account updated successfully");
      setEditingAccount(null);
      setShowForm(false);
      loadAccounts();
    } catch (error) {
      toast.error(`Failed to update account: ${error}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMailAccount(id);
      toast.success("Account deleted successfully");
      loadAccounts();
    } catch (error) {
      toast.error(`Failed to delete account: ${error}`);
    }
  };

  const handleEdit = (account: MailAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mail Accounts"
        description="Manage your IMAP and Microsoft OAuth mail accounts for automation flows."
        action={
          <Button variant="ghost" size="icon" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
          </Button>
        }
      />

      <MailAccountForm
        open={showForm}
        account={editingAccount}
        onSubmit={editingAccount ? handleUpdate : handleCreate}
        onCancel={handleCancelForm}
      />

      {loading ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">Loading accounts...</p>
        </div>
      ) : (
        <MailAccountList
          accounts={accounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
