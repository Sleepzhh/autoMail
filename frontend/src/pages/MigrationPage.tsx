import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMailAccounts, type MailAccount } from "../api/mailAccounts";
import {
  getMigrationPreview,
  executeMigration,
  getDefaultExcludedFolders,
  type MigrationPreview,
  type MigrationResult,
} from "../api/migration";
import MigrationForm from "../components/Migration/MigrationForm";
import { Alert } from "../components/ui";
import { PageHeader } from "../components/ui/PageHeader";

export default function MigrationPage() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultExcludedFolders, setDefaultExcludedFolders] = useState<
    string[]
  >([]);
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, defaultFolders] = await Promise.all([
        getMailAccounts(),
        getDefaultExcludedFolders(),
      ]);
      setAccounts(accountsData);
      setDefaultExcludedFolders(defaultFolders.excludedFolders);
    } catch (error) {
      toast.error(`Failed to load data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (
    sourceAccountId: number,
    excludedFolders: string[]
  ) => {
    try {
      setPreview(null);
      setResult(null);
      const previewData = await getMigrationPreview({
        sourceAccountId,
        excludedFolders,
      });
      setPreview(previewData);
    } catch (error) {
      toast.error(`Failed to get preview: ${error}`);
    }
  };

  const handleExecute = async (
    sourceAccountId: number,
    targetAccountId: number,
    excludedFolders: string[]
  ) => {
    try {
      setIsExecuting(true);
      setResult(null);
      const migrationResult = await executeMigration({
        sourceAccountId,
        targetAccountId,
        excludedFolders,
      });
      setResult(migrationResult);
      if (migrationResult.success) {
        toast.success(
          `Migration completed: ${migrationResult.totalMessagesCopied} messages copied`
        );
      } else {
        toast.error(
          `Migration completed with errors: ${migrationResult.errors.length} errors`
        );
      }
    } catch (error) {
      toast.error(`Migration failed: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Migration"
        description="Copy folders and messages from one account to another."
      />

      {accounts.length < 2 && (
        <Alert variant="warning">
          You need at least two mail accounts to perform a migration.
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">Loading...</p>
        </div>
      ) : (
        <>
          <MigrationForm
            accounts={accounts}
            defaultExcludedFolders={defaultExcludedFolders}
            onPreview={handlePreview}
            onExecute={handleExecute}
            onReset={handleReset}
            isExecuting={isExecuting}
            hasPreview={preview !== null}
          />

          {preview && !result && (
            <div className="bg-white border border-neutral-200">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Migration Preview
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  The following folders and messages will be copied
                </p>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Total Messages:
                  </span>
                  <span className="text-sm text-neutral-900">
                    {preview.totalMessages}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Excluded Folders:
                  </span>
                  <span className="text-sm text-neutral-500">
                    {preview.excludedFolders.join(", ") || "None"}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">
                    Folders to Copy:
                  </h3>
                  {preview.folders.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No folders to copy
                    </p>
                  ) : (
                    <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-md">
                      {preview.folders.map((folder) => (
                        <li
                          key={folder.path}
                          className="px-4 py-3 flex justify-between items-center"
                        >
                          <div>
                            <span className="text-sm text-neutral-900">
                              {folder.path}
                            </span>
                            {folder.specialUse && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">
                                {folder.specialUse}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-neutral-500">
                            {folder.messageCount} messages
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div
              className={`border rounded-lg shadow-sm overflow-hidden ${
                result.success ? "border-green-200" : "border-red-200"
              }`}
            >
              <div
                className={`px-6 py-4 ${
                  result.success
                    ? "bg-green-50 border-b border-green-200"
                    : "bg-red-50 border-b border-red-200"
                }`}
              >
                <h2
                  className={`text-lg font-semibold ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.success
                    ? "Migration Completed Successfully"
                    : "Migration Completed with Errors"}
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Total Messages Copied:
                  </span>
                  <span className="text-sm text-neutral-900">
                    {result.totalMessagesCopied}
                  </span>
                </div>

                {result.foldersCreated.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">
                      Folders Created:
                    </h3>
                    <ul className="list-disc list-inside text-sm text-neutral-600">
                      {result.foldersCreated.map((folder) => (
                        <li key={folder}>{folder}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.foldersCopied.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">
                      Folders Copied:
                    </h3>
                    <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-md">
                      {result.foldersCopied.map((folder) => (
                        <li
                          key={folder.path}
                          className="px-4 py-2 flex justify-between items-center"
                        >
                          <span className="text-sm text-neutral-900">
                            {folder.path}
                          </span>
                          <span className="text-sm text-neutral-500">
                            {folder.messageCount} messages
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-red-700 mb-2">
                      Errors:
                    </h3>
                    <ul className="divide-y divide-red-200 border border-red-200 rounded-md bg-red-50">
                      {result.errors.map((error, index) => (
                        <li key={index} className="px-4 py-2">
                          <span className="text-sm font-medium text-red-800">
                            {error.folder}:
                          </span>{" "}
                          <span className="text-sm text-red-700">
                            {error.error}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
