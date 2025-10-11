### Below are the MS Teams app Manifest examples for various scenarios, 

## Dev environment - Backend & Frontend run separately
- Expose to public internet with ngrok frontend url and backend url
```json
{
  "id": "<azure-client-id>",
  "contentUrl": "https://your-ngrok-static-url-frontend.app/teamsTab",
  "validDomains": [
    "your-ngrok-static-url-frontend.app",
    "<backend-id>.ngrok-free.app"
  ],
  "webApplicationInfo": {
    "id": "<azure-client-id>",
    "resource": "api://your-ngrok-static-url-frontend.app/<azure-client-id>"
  }
}
```

## Local Testing environment - Local Docker Run 
#### NestJS will serve both backend & frontend, 
- Expose to public internet with ngrok frontend url
- Set `https://your-ngrok-static-url-frontend.app/v6/mcp/agent` for `VITE_API_BASE_URL` in env
```json
{
  // MS Teams Manifest is same as above
}
```
## Deployed Testing environment - Docker run
#### Deployed at cloud and available at https://api.topcoder-dev.com (example)
#### NestJS will serve both backend & frontend, 
- `VITE_API_BASE_URL="https://api.topcoder-dev.com/v6/mcp/agent"` in env
```json
{
  "id": "<azure-client-id>",
  "contentUrl": "https://api.topcoder-dev.com/teamsTab",
  "validDomains": [
    "api.topcoder-dev.com"
  ],
  "webApplicationInfo": {
    "id": "<azure-client-id>",
    "resource": "api://api.topcoder-dev.com/<azure-client-id>"
  }
}
```
## Production environment - Docker run
#### Deployed at cloud and available at https://api.topcoder.com (example), Or, point required domain with DNS
#### NestJS will serve both backend & frontend, 
- `VITE_API_BASE_URL="https://api.topcoder.com/v6/mcp/agent"` in env
```json
{
  "id": "<azure-client-id>",
  "contentUrl": "https://api.topcoder.com/teamsTab",
  "validDomains": [
    "api.topcoder.com"
  ],
  "webApplicationInfo": {
    "id": "<azure-client-id>",
    "resource": "api://api.topcoder.com/<azure-client-id>"
  }
}
```
#
> **Note:** MS Teams cache issue
>
> * When we modify values in the same manifest file and re-upload the app to MS Teams, the platform may display the previous version from cache — preventing latest changes from appearing immediately.
> * **Solution:** Exit MS Teams completely from the system tray and then relaunch the application.
