import { ImapFlow } from 'imapflow';

export interface ImapCredentials {
  host: string;
  port: number;
  user: string;
  password?: string;
  accessToken?: string;
}

export async function withImapClient<T>(
  credentials: ImapCredentials,
  callback: (client: ImapFlow) => Promise<T>
): Promise<T> {
  const client = new ImapFlow({
    host: credentials.host,
    port: credentials.port,
    secure: true,
    auth: credentials.accessToken
      ? {
          user: credentials.user,
          accessToken: credentials.accessToken,
        }
      : {
          user: credentials.user,
          pass: credentials.password!,
        },
  });

  try {
    await client.connect();
    return await callback(client);
  } finally {
    await client.logout();
  }
}
