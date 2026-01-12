import type { MailAccount } from "../../api/mailAccounts";

interface MailAccountListProps {
  accounts: MailAccount[];
  onEdit: (account: MailAccount) => void;
  onDelete: (id: number) => void;
}

export default function MailAccountList({
  accounts,
  onEdit,
  onDelete,
}: MailAccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">
          No mail accounts yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {accounts.map((account) => (
          <li key={account.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {account.name}
                </h3>
                <p className="text-sm text-gray-500">{account.email}</p>
                <div className="mt-1 flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.type === "imap"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {account.type === "imap" ? "IMAP" : "Microsoft"}
                  </span>
                  {account.type === "imap" && (
                    <span className="text-xs text-gray-500">
                      {account.imapHost}:{account.imapPort}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(account)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to delete "${account.name}"?`
                      )
                    ) {
                      onDelete(account.id);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
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
