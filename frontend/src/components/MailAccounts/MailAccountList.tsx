import type { MailAccount } from "../../api/mailAccounts";
import {
  Dropdown,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "../ui";

interface MailAccountListProps {
  accounts: MailAccount[];
  onEdit: (account: MailAccount) => void;
  onDelete: (id: number) => void;
}

export default function MailAccountList({
  accounts,
  onEdit,
  onDelete,
}: MailAccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-center">
        <p className="text-neutral-500">
          No mail accounts yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Name</TableHeader>
          <TableHeader>Email</TableHeader>
          <TableHeader>Type</TableHeader>
          <TableHeader>Server</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.id}>
            <TableCell className="font-medium text-neutral-900">
              {account.name}
            </TableCell>
            <TableCell className="text-neutral-500">{account.email}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  account.type === "imap"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {account.type === "imap" ? "IMAP" : "Microsoft"}
              </span>
            </TableCell>
            <TableCell className="text-neutral-500">
              {account.type === "imap"
                ? `${account.imapHost}:${account.imapPort}`
                : "-"}
            </TableCell>
            <TableCell className="text-right">
              <Dropdown
                items={[
                  {
                    label: "Edit",
                    onClick: () => onEdit(account),
                  },
                  {
                    label: "Delete",
                    onClick: () => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${account.name}"?`
                        )
                      ) {
                        onDelete(account.id);
                      }
                    },
                  },
                ]}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
