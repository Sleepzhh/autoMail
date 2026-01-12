import { useState, useEffect } from "react";
import { getMailAccounts, type MailAccount } from "../api/mailAccounts";
import {
  getMigrationPreview,
  executeMigration,
  getDefaultExcludedFolders,
  type MigrationPreview,
  type MigrationResult,
} from "../api/migration";
import MigrationForm from "../components/Migration/MigrationForm";

export default function MigrationPage() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultExcludedFolders, setDefaultExcludedFolders] = useState<string[]>([]);
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
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
      const [accountsData, defaultFolders] = await Promise.all([
        getMailAccounts(),
        getDefaultExcludedFolders(),
      ]);
      setAccounts(accountsData);
      setDefaultExcludedFolders(defaultFolders.excludedFolders);
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
      showMessage("error", `Failed to get preview: ${error}`);
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
        showMessage(
          "success",
          `Migration completed: ${migrationResult.totalMessagesCopied} messages copied`
        );
      } else {
        showMessage(
          "error",
          `Migration completed with errors: ${migrationResult.errors.length} errors`
        );
      }
    } catch (error) {
      showMessage("error", `Migration failed: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Migration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Copy folders and messages from one account to another
          </p>
        </div>
      </div>

      {accounts.length < 2 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            You need at least two mail accounts to perform a migration.
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

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
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
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Migration Preview
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  The following folders and messages will be copied
                </p>
              </div>
              <div className="px-6 py-4">
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Total Messages:{" "}
                  </span>
                  <span className="text-sm text-gray-900">
                    {preview.totalMessages}
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Excluded Folders:{" "}
                  </span>
                  <span className="text-sm text-gray-500">
                    {preview.excludedFolders.join(", ") || "None"}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Folders to Copy:
                  </h3>
                  {preview.folders.length === 0 ? (
                    <p className="text-sm text-gray-500">No folders to copy</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 border rounded-md">
                      {preview.folders.map((folder) => (
                        <li
                          key={folder.path}
                          className="px-4 py-3 flex justify-between items-center"
                        >
                          <div>
                            <span className="text-sm text-gray-900">
                              {folder.path}
                            </span>
                            {folder.specialUse && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                {folder.specialUse}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
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
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div
                className={`px-6 py-4 border-b ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h2
                  className={`text-lg font-medium ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.success
                    ? "Migration Completed Successfully"
                    : "Migration Completed with Errors"}
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Total Messages Copied:{" "}
                  </span>
                  <span className="text-sm text-gray-900">
                    {result.totalMessagesCopied}
                  </span>
                </div>

                {result.foldersCreated.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Folders Created:
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {result.foldersCreated.map((folder) => (
                        <li key={folder}>{folder}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.foldersCopied.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Folders Copied:
                    </h3>
                    <ul className="divide-y divide-gray-200 border rounded-md">
                      {result.foldersCopied.map((folder) => (
                        <li
                          key={folder.path}
                          className="px-4 py-2 flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-900">
                            {folder.path}
                          </span>
                          <span className="text-sm text-gray-500">
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
