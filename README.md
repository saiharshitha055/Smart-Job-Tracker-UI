JobPilot — Smart Job Application Tracker
Live website: https://smart-job-tracker-ui.vercel.app/
GitHub repository: https://github.com/saiharshitha055/Smart-Job-Tracker-UI

JobPilot is a web dashboard for organizing job leads received through LinkedIn job-alert emails. It combines an n8n workflow, Google Sheets, a Google Apps Script web endpoint, and a React + Vite frontend deployed on Vercel.
Features
- Dashboard summary cards for jobs, saved jobs, applications, and interviews.
- Job Explorer with job listings and search/filter controls.
- Save/bookmark jobs.
- Track application status and job details/notes.
- Load job leads from Google Sheets through Google Apps Script.
- Use n8n to parse LinkedIn job-alert emails and append/update rows in Google Sheets.
- Host the frontend on Vercel with the source stored in GitHub.
Current limitation: JobPilot does not yet verify whether a LinkedIn job is still accepting applications or automatically expire closed postings. A job may remain in the sheet until it is removed or expiry logic is added.

Architecture
LinkedIn job-alert email
        ↓
Gmail Trigger (n8n)
        ↓
HTML Extract
        ↓
Code in JavaScript
        ↓
Google Sheets: Append or Update Row
        ↓
Google Sheets — Job Leads tab
        ↓
Google Apps Script Web App (/exec; JSON/JSONP)
        ↓
React + Vite JobPilot dashboard
        ↓
Vercel deployment
Technology stack
- Frontend: React, Vite, JavaScript, CSS
- Automation: n8n Cloud
- Email source: Gmail / LinkedIn job-alert emails
- Data store: Google Sheets
- Read API: Google Apps Script Web App (JSON and JSONP)
- Version control: Git and GitHub
- Hosting: Vercel
Google Sheets structure
Spreadsheet: Smart Job Application Tracker

The dashboard reads from the Job Leads tab. Expected column headers:
- Role
- Company
- Location
- Pay
- Job_URL
Other tabs created in the spreadsheet include Applications and Read Me.
How the project was built
1. Created the spreadsheet. Added the Job Leads tab and columns for role, company, location, pay, and job URL.
2. Created the n8n workflow. Connected Gmail Trigger → HTML Extract → Code in JavaScript → Google Sheets Append or Update Row.
3. Parsed LinkedIn alerts. Configured the workflow to extract job details from alert emails and map them to sheet columns.
4. Created the Apps Script endpoint. A doGet(e) function reads rows from Job Leads and returns JSON. It also supports JSONP callbacks for the browser frontend.
5. Built the React dashboard. Created a Vite application and implemented the JobPilot UI, job listing/search/filter features, saved jobs, application statuses, and job details/notes.
6. Connected the dashboard to Sheets. Added VITE_JOBS_API_URL to the local .env.local file, pointing to the Apps Script /exec URL.
7. Tested the data flow. Confirmed the endpoint returned job rows and the dashboard displayed the six real job listings. Removing temporary test rows from the sheet and refreshing the dashboard removed those rows from the UI.
8. Built the frontend. Ran npm run build successfully.
9. Pushed the source to GitHub. Repository: saiharshitha055/Smart-Job-Tracker-UI.
10. Deployed to Vercel. Imported the GitHub repository, selected Vite, kept the dist output directory, configured VITE_JOBS_API_URL, and deployed the website.
Run locally
Prerequisites
- Node.js and npm
- The deployed Google Apps Script /exec endpoint
Setup
1. Clone the repository or open the project folder.
2. Install dependencies:
   npm install
3. Create .env.local in the project root, beside package.json.
4. Add your actual Apps Script URL:
   VITE_JOBS_API_URL=https://YOUR_APPS_SCRIPT_WEB_APP_URL/exec
   Replace the example URL with your deployed Apps Script /exec URL. Do not add quotes or extra spaces.
5. Start the development server:
   npm run dev
6. Open the local address shown in the terminal (usually http://localhost:5173).
Build
npm run build
Vite creates the production build in dist.

Optional local production preview:
npm run preview
n8n workflow
The workflow consists of:
1. Gmail Trigger — watches the connected Gmail account for matching emails.
2. HTML Extract — extracts email content.
3. Code in JavaScript — parses and formats the job fields.
4. Google Sheets: Append or Update Row — writes job information into Job Leads.
The workflow can only process emails the Gmail Trigger detects. If LinkedIn alerts are unsubscribed, not delivered, or excluded by the trigger's settings, no new rows will be added. The n8n Cloud trial is time-limited, so arrange a sustainable automation/hosting option before it expires if continuous syncing is required.
Vercel deployment
1. Push code changes to the connected GitHub repository.
2. Open the Vercel project or import the repository.
3. Framework preset: Vite.
4. Build command: npm run build.
5. Output directory: dist.
6. Add this environment variable:
   - Key: VITE_JOBS_API_URL
   - Value: the deployed Google Apps Script /exec URL
   - Environments: Production and, if needed, Preview
7. Redeploy after changing environment variables.
Live website: https://smart-job-tracker-ui.vercel.app/
Notes and limitations
- Job expiry: the current app does not check LinkedIn to confirm whether a posting is still open. Expiry dates/status labels would need to be implemented separately.
- Refreshing data: the dashboard may need a page refresh to fetch changed sheet contents, depending on the current frontend implementation.
- Public endpoint: if the Apps Script web app is deployed for public access, anyone with its URL may be able to read the returned job data. Keep private information out of Job Leads.
- Frontend environment variables are public: values prefixed with VITE_ are bundled into client-side code. Never put passwords or private API secrets there.
- Keep .env.local private: ensure .env.local is excluded by .gitignore and is not committed to GitHub.
- Browser storage: saved jobs and application status are stored in browser localStorage where implemented; that data is browser-specific and is not automatically shared between devices.
- LinkedIn: the workflow parses alert emails; it does not guarantee real-time availability of a job.
Future improvements
- Add Added_Date, Expiry_Date, and Status columns.
- Add Active / Expired filters and clearly label estimated expiry dates.
- Add email notifications for newly captured job leads.
- Add periodic refresh or a manual refresh button.
- Improve duplicate handling using Job_URL.
- Replace the expiring n8n Cloud trial with a sustainable option.
- Add automated tests and a deployment health check.
License
No license has been specified yet. Add a license file if you want to define how others may use, modify, and distribute this project.
