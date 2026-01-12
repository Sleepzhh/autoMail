import { useState, useEffect } from "react";
import type { MailAccount } from "../../api/mailAccounts";
import { startOAuthFlow } from "../../api/oauth";

interface MailAccountFormProps {
  account?: MailAccount | null;
  onSubmit: (data: Partial<MailAccount>) => void;
  onCancel: () => void;
}

export default function MailAccountForm({
  account,
  onSubmit,
  onCancel,
}: MailAccountFormProps) {
  const [formData, setFormData] = useState<Partial<MailAccount>>({
    name: "",
    type: "imap",
    email: "",
    imapHost: "",
    imapPort: 993,
    password: "",
  });
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleMicrosoftOAuth = async () => {
    setOauthLoading(true);
    setOauthError(null);

    try {
      const { authUrl } = await startOAuthFlow("microsoft");
      // Redirect to Microsoft OAuth page
      window.location.href = authUrl;
    } catch (error) {
      setOauthError(`Failed to start OAuth flow: ${error}`);
      setOauthLoading(false);
    }
  };

  // If editing a Microsoft account, show read-only info
  if (account && account.type === "microsoft") {
    return (
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">
          Microsoft Account Details
        </h2>

        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex items-center">
            <svg
              className="h-8 w-8 text-purple-600 mr-3"
              viewBox="0 0 23 23"
              fill="currentColor"
            >
              <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
            </svg>
            <div>
              <p className="font-medium text-purple-900">{account.name}</p>
              <p className="text-sm text-purple-700">{account.email}</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <span className="font-medium">IMAP Host:</span>{" "}
            {account.imapHost || "outlook.office365.com"}
          </p>
          <p>
            <span className="font-medium">Token Status:</span>{" "}
            {account.tokenExpiry ? (
              new Date(account.tokenExpiry) > new Date() ? (
                <span className="text-green-600">Valid</span>
              ) : (
                <span className="text-red-600">Expired</span>
              )
            ) : (
              <span className="text-gray-400">Unknown</span>
            )}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            Microsoft accounts are connected via OAuth. To update the
            connection, delete this account and reconnect.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-lg p-6 space-y-4"
    >
      <h2 className="text-lg font-medium text-gray-900">
        {account ? "Edit Mail Account" : "Add Mail Account"}
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Account Type
        </label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: "imap" })}
            className={`flex items-center justify-center px-4 py-3 border rounded-lg ${
              formData.type === "imap"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            IMAP
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: "microsoft" })}
            className={`flex items-center justify-center px-4 py-3 border rounded-lg ${
              formData.type === "microsoft"
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg
              className="h-5 w-5 mr-2"
              viewBox="0 0 23 23"
              fill="currentColor"
            >
              <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
            </svg>
            Microsoft
          </button>
        </div>
      </div>

      {formData.type === "imap" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="My Email Account"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                IMAP Host
              </label>
              <input
                type="text"
                value={formData.imapHost || ""}
                onChange={(e) =>
                  setFormData({ ...formData, imapHost: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="imap.example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                IMAP Port
              </label>
              <input
                type="number"
                value={formData.imapPort || 993}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    imapPort: parseInt(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={formData.password || ""}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder={account ? "(unchanged)" : ""}
              required={!account}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {account ? "Update" : "Create"}
            </button>
          </div>
        </>
      )}

      {formData.type === "microsoft" && (
        <>
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <div className="flex items-start">
              <svg
                className="h-6 w-6 text-purple-600 mt-0.5 mr-3 shrink-0"
                viewBox="0 0 23 23"
                fill="currentColor"
              >
                <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
              </svg>
              <div>
                <h3 className="font-medium text-purple-900">
                  Connect with Microsoft
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                  Click the button below to sign in with your Microsoft account.
                  You'll be redirected to Microsoft to authorize access to your
                  mailbox.
                </p>
              </div>
            </div>
          </div>

          {oauthError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{oauthError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMicrosoftOAuth}
              disabled={oauthLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {oauthLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 mr-2"
                    viewBox="0 0 23 23"
                    fill="currentColor"
                  >
                    <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                  </svg>
                  Sign in with Microsoft
                </>
              )}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
