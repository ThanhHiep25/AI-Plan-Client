// src/context/userContext.tsx
import { createContext, useState, useEffect, type ReactNode } from "react";
import { 
    getUser, 
    getToken, 
    setUser as saveUser, 
    setToken as saveToken,
    clearStorage,
    isAuthenticated as checkAuth,
    checkTokenExpiry
} from "../../src/utils/helpers/storage";

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role?: string;
    authProvider?: string;
    [key: string]: unknown;
}

interface UserContextType {
    user: User | null;
    accessToken: string | null;
    setUser: (user: User | null) => void;
    setAccessToken: (token: string | null) => void;
    setUserAndToken: (user: User | null, token: string | null) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUserState] = useState<User | null>(null);
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Khôi phục từ localStorage khi app khởi động
    useEffect(() => {
        try {
            // Check token expiry first
            checkTokenExpiry();
            
            const savedUser = getUser();
            const savedToken = getToken();

            if (savedUser && savedToken) {
                setUserState(savedUser);
                setAccessTokenState(savedToken);
            }
        } catch (error) {
            console.error('Error loading user data from localStorage:', error);
            clearStorage();
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto check token expiry every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            checkTokenExpiry();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    const setUser = (newUser: User | null) => {
        setUserState(newUser);
        if (newUser) {
            saveUser(newUser);
        }
    };

    const setAccessToken = (token: string | null) => {
        setAccessTokenState(token);
        if (token) {
            saveToken(token);
        }
    };

    const setUserAndToken = (newUser: User | null, token: string | null) => {
        setUser(newUser);
        setAccessToken(token);
        console.log('User and token updated:', { 
            user: newUser?.email, 
            hasToken: !!token 
        });
    };

    const logout = () => {
        setUserState(null);
        setAccessTokenState(null);
        clearStorage();
        console.log('User logged out successfully');
    };

    const isAuthenticated = checkAuth();

    return (
        <UserContext.Provider
            value={{
                user,
                accessToken,
                setUser,
                setAccessToken,
                setUserAndToken,
                logout,
                isAuthenticated,
                isLoading,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export { UserContext };
