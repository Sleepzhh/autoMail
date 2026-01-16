import { useState } from "react";
import type { MailAccount } from "../../api/mailAccounts";
import { Button, Input, Select, Label } from "../ui";

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
    <div className="rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Migration Settings
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sourceAccount">Source Account</Label>
            <Select
              id="sourceAccount"
              value={sourceAccountId}
              onChange={(e) => {
                setSourceAccountId(
                  e.target.value ? Number(e.target.value) : ""
                );
                onReset();
              }}
              className="mt-1"
              disabled={isExecuting}
            >
              <option value="">Select source account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.email})
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-neutral-500">
              The account to copy messages from
            </p>
          </div>

          <div>
            <Label htmlFor="targetAccount">Target Account</Label>
            <Select
              id="targetAccount"
              value={targetAccountId}
              onChange={(e) =>
                setTargetAccountId(e.target.value ? Number(e.target.value) : "")
              }
              className="mt-1"
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
            </Select>
            <p className="mt-1 text-xs text-neutral-500">
              The account to copy messages to
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="excludedFolders">Excluded Folders</Label>
          <Input
            type="text"
            id="excludedFolders"
            value={excludedFoldersText}
            onChange={(e) => setExcludedFoldersText(e.target.value)}
            className="mt-1"
            placeholder="Trash, Junk, Spam"
            disabled={isExecuting}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Comma-separated list of folder names or special-use identifiers
            (e.g., \Trash, \Junk) to exclude from migration
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isExecuting}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handlePreview}
            loading={isPreviewing}
            disabled={!canPreview || isPreviewing || isExecuting}
          >
            {isPreviewing ? "Loading Preview..." : "Preview (Dry Run)"}
          </Button>
          <Button
            variant="success"
            onClick={handleExecute}
            loading={isExecuting}
            disabled={!canExecute || isExecuting}
          >
            {isExecuting ? "Executing Migration..." : "Execute Migration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
