import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  type User,
  getSetupStatus,
  getCurrentUser,
  login as apiLogin,
  register as apiRegister,
} from "../api/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  needsSetup: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // First check if setup is needed
      const status = await getSetupStatus();
      setNeedsSetup(status.needsSetup);

      if (status.needsSetup) {
        setIsLoading(false);
        return;
      }

      // Check if we have a valid token
      const token = localStorage.getItem("authToken");
      if (token) {
        const { user } = await getCurrentUser(token);
        setUser(user);
      }
    } catch (error) {
      localStorage.removeItem("authToken");
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const { token, user } = await apiLogin(username, password);
    localStorage.setItem("authToken", token);
    setUser(user);
  }

  async function register(username: string, password: string) {
    const { token, user } = await apiRegister(username, password);
    localStorage.setItem("authToken", token);
    setUser(user);
    setNeedsSetup(false);
  }

  function logout() {
    localStorage.removeItem("authToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, needsSetup, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
