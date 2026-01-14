import { useState, useEffect } from "react";
import {
  getMailAccounts,
  createMailAccount,
  updateMailAccount,
  deleteMailAccount,
  type MailAccount,
} from "../api/mailAccounts";
import MailAccountList from "../components/MailAccounts/MailAccountList";
import MailAccountForm from "../components/MailAccounts/MailAccountForm";

export default function MailAccountsPage() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MailAccount | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getMailAccounts();
      setAccounts(data);
    } catch (error) {
      showMessage("error", `Failed to load accounts: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = async (data: Partial<MailAccount>) => {
    try {
      await createMailAccount(data);
      showMessage("success", "Account created successfully");
      setShowForm(false);
      loadAccounts();
    } catch (error) {
      showMessage("error", `Failed to create account: ${error}`);
    }
  };

  const handleUpdate = async (data: Partial<MailAccount>) => {
    if (!editingAccount) return;

    try {
      await updateMailAccount(editingAccount.id, data);
      showMessage("success", "Account updated successfully");
      setEditingAccount(null);
      setShowForm(false);
      loadAccounts();
    } catch (error) {
      showMessage("error", `Failed to update account: ${error}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMailAccount(id);
      showMessage("success", "Account deleted successfully");
      loadAccounts();
    } catch (error) {
      showMessage("error", `Failed to delete account: ${error}`);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">Mail Accounts</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Account
        </button>
      </div>

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
