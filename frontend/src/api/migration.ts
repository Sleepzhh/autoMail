import { apiRequest } from './client';

export interface FolderInfo {
  path: string;
  name: string;
  specialUse?: string;
  messageCount: number;
}

export interface MigrationPreview {
  folders: FolderInfo[];
  totalMessages: number;
  excludedFolders: string[];
}

export interface MigrationResult {
  success: boolean;
  foldersCreated: string[];
  foldersCopied: { path: string; messageCount: number }[];
  totalMessagesCopied: number;
  errors: { folder: string; error: string }[];
}

export interface MigrationRequest {
  sourceAccountId: number;
  targetAccountId?: number;
  excludedFolders?: string[];
}

export async function getMigrationPreview(data: MigrationRequest): Promise<MigrationPreview> {
  return apiRequest('/migration/preview', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function executeMigration(data: MigrationRequest): Promise<MigrationResult> {
  return apiRequest('/migration/execute', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDefaultExcludedFolders(): Promise<{ excludedFolders: string[] }> {
  return apiRequest('/migration/default-excluded-folders');
}
