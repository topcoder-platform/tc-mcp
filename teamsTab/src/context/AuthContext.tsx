import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { app, authentication } from "@microsoft/teams-js";
import { v4 as uuidv4 } from "uuid";
import { jwtDecode } from "jwt-decode";

interface UserProfile {
  name: string;
  email: string; // 'preferred_username' claim
}
// Define the shape of our context data
interface AuthContextType {
  ssoToken: string | null;
  error: string | null;
  isAuthenticating: boolean;
  userProfile: UserProfile | null;
  retryTeamsSsoToken: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [ssoToken, setSsoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const mockSsoToken = import.meta.env.VITE_MOCK_VALIDATE_TOKEN === "true";
  const isTeamsTab = import.meta.env.VITE_IS_NOT_TEAMS_TAB !== "true";

  const processToken = (token?: string | null) => {
    if (!token) {
      setUserProfile(null);
      return;
    }

    setSsoToken(token);

    if (mockSsoToken) {
      // Create a mock profile for local development
      setUserProfile({ name: "Mock User", email: "mock.user@example.com" });
    } else {
      try {
        // Decode the real token to get user claims
        const decodedToken: { name: string; preferred_username: string } = jwtDecode(token);
        setUserProfile({
          name: decodedToken.name,
          email: decodedToken.preferred_username,
        });
      } catch (e) {
        console.error("Failed to decode SSO token:", e);
        setError("Could not read user profile from token.");
        setUserProfile(null);
      }
    }
  };

  const getTeamsSsoToken = async () => {
    try {
      setIsAuthenticating(true);
      await app.initialize();

      // Get the authentication token from the Teams client
      const token = await authentication.getAuthToken();
      console.log("Successfully acquired Teams SSO Token.");
      processToken(token);
    } catch (err: any) {
      console.error("Failed to get Teams SSO Token:", err);
      setError(`Failed to authenticate. Please ensure you are running this app inside Microsoft Teams and have granted the necessary permissions.`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const retryTeamsSsoToken = async () => {
    setError(null);
    await getTeamsSsoToken();
  };

  const getMockSsoToken = async () => {
    let ssoTokenMock = localStorage.getItem("ms-teams-mock-ssoToken");
    if (!ssoTokenMock) {
      ssoTokenMock = uuidv4();
      localStorage.setItem("ms-teams-mock-ssoToken", ssoTokenMock);
    }
    processToken(ssoTokenMock);
  };

  useEffect(() => {
    if (mockSsoToken) getMockSsoToken();
    else if (isTeamsTab) getTeamsSsoToken();
  }, []);

  const value = { ssoToken, error, isAuthenticating, userProfile, retryTeamsSsoToken };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily consume the context in other components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
