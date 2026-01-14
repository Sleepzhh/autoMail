import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const description = searchParams.get("description");
    const provider = searchParams.get("provider");
    const accountId = searchParams.get("accountId");

    if (success === "true") {
      setStatus("success");
      setMessage(`Successfully connected your ${provider} account!`);
      // Redirect to mail accounts page after 2 seconds
      setTimeout(() => {
        navigate("/", { state: { newAccountId: accountId } });
      }, 2000);
    } else if (error) {
      setStatus("error");
      setMessage(description || getErrorMessage(error));
    } else {
      setStatus("error");
      setMessage("Unknown error occurred during OAuth flow");
    }
  }, [searchParams, navigate]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case "access_denied":
        return "You denied access to your account. Please try again and allow the required permissions.";
      case "missing_scope":
        return "Mail access permission was not granted. Please try again and allow mail access.";
      case "exchange_failed":
        return "Failed to complete the authentication. Please try again.";
      default:
        return `Authentication failed: ${error}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-neutral-900">
              Processing...
            </h2>
            <p className="text-sm text-neutral-500 mt-2">
              Please wait while we complete the authentication.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-neutral-900">Success!</h2>
            <p className="text-sm text-neutral-500 mt-2">{message}</p>
            <p className="text-xs text-neutral-400 mt-4">
              Redirecting to Mail Accounts...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-neutral-900">
              Authentication Failed
            </h2>
            <p className="text-sm text-neutral-500 mt-2">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Back to Mail Accounts
            </button>
          </>
        )}
      </div>
    </div>
  );
}
