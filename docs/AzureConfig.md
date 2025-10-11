### Azure App Registration

This is a mandatory step to enable SSO and secure Agent. We should create different App registrations for different [MS Teams environments](./MsTeamsConfig.md) at Azure portal for Azure AD SSO

1.  Go to the **Azure Portal** -> **Azure Active Directory** -> **App registrations** -> **+ New registration**.
2.  **Name:** `Teams AI Agent`
3.  **Supported account types:** Select `Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts`.
4.  Click **Register**.
    * **Save the `Application (client) ID` and `Directory (tenant) ID`.** You will need these for your environment variables.
5.  Go to the **Expose an API** blade.
    * Click **Set** next to "Application ID URI". The default `api://<frontend_uri>/<this_azure_app_client_id>` is fine for now. We will update this with our frontend url later.
    - eg: `api://api.topcoder.com/82d17b02-2d34-4594-b243-09c516aad2e8`
6.  Click **+ Add a scope**.
    *   **Scope name:** `access_as_user`
    *   **Who can consent?:** `Admins and users`
    *   Fill in the admin/user consent descriptions (e.g., "Allows the app to access the AI agent API as the signed-in user.").
    *   Click **Add scope**.
7.  Click **+ Add a client application**.
    * Add **MS Teams** client id `1fec8e78-bce4-4aaf-ab1b-5451cc387264`
    * Select `access_as_user` in Authorize scopes
8. Go to the **API permissions** blade.
    * Click **+ Add a permission** -> **APIs of my Org**.
    * Select your `Teams AI Agent` app.
    * Check the box for the `access_as_user` permission and click **Add permissions**.
    * Click the **Grant admin consent** button.
9.  Go to the **Authentication** blade.
    * Click **+ Add a platform** -> **Web** & **SPA**.
    * **Redirect URIs:** You will add your frontend URL here (e.g., `https://api.topcoder.com/teamsTab`)
    * And also add `Mobile and desktop applications` and check all default urls

---

### Read: [MS Teams environments - MsTeamsConfig.md](./MsTeamsConfig.md)