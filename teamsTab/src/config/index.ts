export const config = {
  /**
   * The base URL for the Backend MCP Agent API.
   *
   * For local development, this typically points to the local NestJS instance.
   * Ensure this URL matches your backend's listening address and context path.
   */
  apiBaseUrl: import.meta.env.VITE_AGENT_API_URL,

  /**
   * Determines if the application should bypass Microsoft Teams integration.
   *
   * - `true`: Enables Teams integration. The app expects to run within the Microsoft Teams client.
   * - `false`: Enables standalone mode for development in a standard web browser. Skips Teams SDK initialization, authentication, and theming.
   */
  isTeamsTab: bool(import.meta.env.VITE_IS_TEAMS_TAB),

  /**
   * Controls authentication token validation behavior.
   *
   * - `true`: Uses a mock UUID token, bypassing Azure AD SSO. Ideal for local development or testing without a MS Teams identity.
   * - `false`: Performs real Azure AD SSO validation using tokens acquired from the MS Teams client.
   */
  mockAzureADtoken: bool(import.meta.env.VITE_MOCK_AZURE_AD_TOKEN),
};

function bool(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return defaultValue;
}
