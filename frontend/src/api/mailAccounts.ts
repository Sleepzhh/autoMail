import { apiRequest } from './client';

export interface MailAccount {
  id: number;
  name: string;
  type: 'imap' | 'microsoft';
  email: string;
  imapHost?: string | null;
  imapPort?: number | null;
  password?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiry?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Mailbox {
  path: string;
  name: string;
  specialUse: string | null;
}

export async function getMailAccounts(): Promise<MailAccount[]> {
  return apiRequest('/mail-accounts');
}

export async function getMailAccount(id: number): Promise<MailAccount> {
  return apiRequest(`/mail-accounts/${id}`);
}

export async function createMailAccount(data: Partial<MailAccount>): Promise<MailAccount> {
  return apiRequest('/mail-accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMailAccount(id: number, data: Partial<MailAccount>): Promise<MailAccount> {
  return apiRequest(`/mail-accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMailAccount(id: number): Promise<void> {
  return apiRequest(`/mail-accounts/${id}`, {
    method: 'DELETE',
  });
}

export async function getMailboxes(accountId: number): Promise<Mailbox[]> {
  return apiRequest(`/mail-accounts/${accountId}/mailboxes`);
}
