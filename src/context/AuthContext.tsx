import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: string;
  did?: string;
  name: string;
  email: string;
  role?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (userData: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      setIsLoading(true);
      try {
        const storedUserString = await AsyncStorage.getItem("userId");
        if (storedUserString) {
          const storedUser: User = JSON.parse(storedUserString);
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.log("Gagal memuat data pengguna dari storage", e);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const signIn = async (userData: User) => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem("userId", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch (e) {
      console.log("Gagal menyimpan data pengguna ke storage", e);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem("userId");
      setUser(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.log("Gagal menghapus data pengguna dari storage", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
