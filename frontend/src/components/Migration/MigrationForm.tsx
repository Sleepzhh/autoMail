import { useState } from "react";
import type { MailAccount } from "../../api/mailAccounts";

interface MigrationFormProps {
  accounts: MailAccount[];
  defaultExcludedFolders: string[];
  onPreview: (sourceAccountId: number, excludedFolders: string[]) => void;
  onExecute: (
    sourceAccountId: number,
    targetAccountId: number,
    excludedFolders: string[]
  ) => void;
  onReset: () => void;
  isExecuting: boolean;
  hasPreview: boolean;
}

export default function MigrationForm({
  accounts,
  defaultExcludedFolders,
  onPreview,
  onExecute,
  onReset,
  isExecuting,
  hasPreview,
}: MigrationFormProps) {
  const [sourceAccountId, setSourceAccountId] = useState<number | "">("");
  const [targetAccountId, setTargetAccountId] = useState<number | "">("");
  const [excludedFoldersText, setExcludedFoldersText] = useState(
    defaultExcludedFolders.join(", ")
  );
  const [isPreviewing, setIsPreviewing] = useState(false);

  const parseExcludedFolders = (): string[] => {
    return excludedFoldersText
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  };

  const handlePreview = async () => {
    if (sourceAccountId === "") return;
    setIsPreviewing(true);
    try {
      await onPreview(sourceAccountId, parseExcludedFolders());
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecute = () => {
    if (sourceAccountId === "" || targetAccountId === "") return;
    onExecute(sourceAccountId, targetAccountId, parseExcludedFolders());
  };

  const handleReset = () => {
    setSourceAccountId("");
    setTargetAccountId("");
    setExcludedFoldersText(defaultExcludedFolders.join(", "));
    onReset();
  };

  const canPreview = sourceAccountId !== "";
  const canExecute =
    sourceAccountId !== "" &&
    targetAccountId !== "" &&
    sourceAccountId !== targetAccountId &&
    hasPreview;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Migration Settings
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="sourceAccount"
              className="block text-sm font-medium text-gray-700"
            >
              Source Account
            </label>
            <select
              id="sourceAccount"
              value={sourceAccountId}
              onChange={(e) => {
                setSourceAccountId(
                  e.target.value ? Number(e.target.value) : ""
                );
                onReset();
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isExecuting}
            >
              <option value="">Select source account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              The account to copy messages from
            </p>
          </div>

          <div>
            <label
              htmlFor="targetAccount"
              className="block text-sm font-medium text-gray-700"
            >
              Target Account
            </label>
            <select
              id="targetAccount"
              value={targetAccountId}
              onChange={(e) =>
                setTargetAccountId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isExecuting}
            >
              <option value="">Select target account</option>
              {accounts
                .filter((a) => a.id !== sourceAccountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.email})
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              The account to copy messages to
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="excludedFolders"
            className="block text-sm font-medium text-gray-700"
          >
            Excluded Folders
          </label>
          <input
            type="text"
            id="excludedFolders"
            value={excludedFoldersText}
            onChange={(e) => setExcludedFoldersText(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Trash, Junk, Spam"
            disabled={isExecuting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Comma-separated list of folder names or special-use identifiers
            (e.g., \Trash, \Junk) to exclude from migration
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isExecuting}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canPreview || isPreviewing || isExecuting}
          >
            {isPreviewing ? "Loading Preview..." : "Preview (Dry Run)"}
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canExecute || isExecuting}
          >
            {isExecuting ? "Executing Migration..." : "Execute Migration"}
          </button>
        </div>
      </div>
    </div>
  );
}
