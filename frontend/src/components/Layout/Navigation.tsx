import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

function MailIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function AutomationIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function MigrationIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  );
}

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ to, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium py-3 ${
        isActive
          ? "border-neutral-800 text-neutral-800"
          : "border-transparent text-neutral-400 hover:text-neutral-700"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

interface UserMenuProps {
  username: string;
  onLogout: () => void;
}

function UserMenu({ username, onLogout }: UserMenuProps) {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-neutral-500">{username}</span>
      <button
        onClick={onLogout}
        className="text-sm text-neutral-500 hover:text-neutral-700"
      >
        Logout
      </button>
    </div>
  );
}

const navItems = [
  { to: "/", icon: <MailIcon />, label: "Mail Accounts" },
  {
    to: "/automation-flows",
    icon: <AutomationIcon />,
    label: "Automation Flows",
  },
  { to: "/migration", icon: <MigrationIcon />, label: "Migration" },
];

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="shrink-0 flex items-center">
            <h1 className="text-xl font-bold text-neutral-900">autoMail</h1>
          </div>
          <div className="flex items-center">
            {user && (
              <UserMenu username={user.username} onLogout={handleLogout} />
            )}
          </div>
        </div>
        <div className="flex space-x-4">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.to}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
