import { apiRequest } from "./client";
import type { MailAccount } from "./mailAccounts";

export interface AutomationFlow {
  id: number;
  name: string;
  sourceMailAccountId: number;
  sourceMailAccount?: MailAccount;
  sourceMailbox: string;
  targetMailAccountId: number;
  targetMailAccount?: MailAccount;
  targetMailbox: string;
  enabled: boolean;
  intervalMinutes: number;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAutomationFlows(): Promise<AutomationFlow[]> {
  return apiRequest("/automation-flows");
}

export async function getAutomationFlow(id: number): Promise<AutomationFlow> {
  return apiRequest(`/automation-flows/${id}`);
}

export async function createAutomationFlow(
  data: Partial<AutomationFlow>
): Promise<AutomationFlow> {
  return apiRequest("/automation-flows", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAutomationFlow(
  id: number,
  data: Partial<AutomationFlow>
): Promise<AutomationFlow> {
  return apiRequest(`/automation-flows/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAutomationFlow(id: number): Promise<void> {
  return apiRequest(`/automation-flows/${id}`, {
    method: "DELETE",
  });
}

export async function runAutomationFlow(id: number): Promise<void> {
  return apiRequest(`/automation-flows/${id}/run`, {
    method: "POST",
  });
}
