**Updating project context**

The user wants to update the context file (README markdown) to reflect the current state of their project. Specifically, they want to include a directory structure for both the front-end and back-end, based on the images they provided. Additionally, they'll need to revise sections like "Project Overview," "Key Components," and "Technical Architecture" to incorporate features like OAuth, Cognito, Hosted UI, and environment variables for redirect. I'll also clarify that they're no longer using Amplify Auth but instead using Cognito with OIDC implicit grant.


Thought for 4 seconds


```markdown
# WhatsApp Business Assistant – Project Context

> **Note:** This document reflects the current state of the project, including Cognito Hosted-UI integration, dual-mode booking flows, AI-powered chat, and AWS DynamoDB ARNs.

---

## 📁 Directory Structure

```

shop-frontend/
├── build/
├── node\_modules/
├── public/
├── src/
│   ├── components/
│   │   ├── admin/                # all admin-only configuration screens
│   │   ├── appointment/          # calendar & booking UI components
│   │   ├── chat/                 # Chatbox, message bubbles, options
│   │   └── ui/                   # shared MUI wrappers, icons, buttons
│   ├── context/
│   │   └── ConfigContext.js      # React Context for role-based config
│   ├── hooks/
│   │   └── useWorkers.js         # custom hook for fetching/filtering workers
│   ├── pages/
│   │   ├── AdminPage.js
│   │   ├── ConfirmSignup.js
│   │   ├── LoginPage.js          # Cognito Hosted-UI integration
│   │   ├── SignIn.js             # fallback SRP flow (if needed)
│   │   ├── SignUp.js
│   │   └── TestEnvironment.js    # sandbox for calendar & chat testing
│   ├── services/
│   │   └── api.js                # REST calls + Cognito JWT auth + mock fallback
│   ├── utils/                    # general utilities (date formatting, etc.)
│   ├── App.js
│   ├── aws-exports.js            # Amplify stubbed config (if used)
│   ├── index.js                  # Bootstraps React, reads .env for Cognito
│   └── index.css
├── .env                          # REACT\_APP\_XXX variables (Cognito, API, OpenAI…)
├── package.json
└── README.md                     # this file

shop-backend/
├── .aws-sam/                     # SAM build artifacts
├── venv/                         # Python virtualenv
├── app.py                        # Lambda handlers (Python)
├── server.js                     # optional local dev server (Node)
├── template.yaml                 # SAM template
├── samconfig.toml                # SAM CLI config
├── package.json                  # for Node helpers
├── .env.example
└── README.md

````

---

## 🚀 Project Overview

A **dual-mode** scheduling and client-management system tailored for barber shops:

- **Enterprise** (multi-staff)  
  - Full AWS Cognito Hosted-UI authentication  
  - DynamoDB ARNs for _Appointments_, _Customers_, _Workers_  
  - Worker selection in both calendar and chat flows  
  - Role stored in sessionStorage → drives `ConfigContext`  

- **Individual** (solo professional)  
  - Same Hosted-UI login, but UI skips worker selection  
  - Only _Appointments_ & _Customers_ ARNs (or mock fallback)  
  - Single-barber calendar & chat flow  

---

## 🔑 Key Components

1. **Authentication & Session**  
   - AWS Cognito User Pool + Hosted-UI (implicit grant)  
   - Environment vars:  
     ```bash
     REACT_APP_COGNITO_DOMAIN=…
     REACT_APP_COGNITO_CLIENT_ID=…
     REACT_APP_REDIRECT_URI=…
     ```  
   - `LoginPage.js` → redirects to Cognito, parses `#id_token`

2. **ConfigContext** (`/src/context/ConfigContext.js`)  
   - Loads per-role configuration from `localStorage`  
   - Exposes `login()`, `logout()`, `getUserRole()`, `updateConfig()`  
   - Persists DynamoDB ARNs or toggles to mock data

3. **API Service** (`/src/services/api.js`)  
   - Reads Cognito JWT via `getSession()` → `Authorization` header  
   - Checks for `process.env.REACT_APP_API_URL` vs. `localhost:`  
   - Falls back to in-memory mocks when ARNs are missing or offline

4. **Calendar & Booking** (`/src/components/appointment/…`)  
   - MUI calendar grid, time-slot chips  
   - Conflict-detection (no overlapping)  
   - Color-coded by worker (enterprise) or single color (individual)

5. **Chat Assistant** (`/src/components/chat/Chatbox.js`)  
   - **Guided mode** (default): step-by-step with buttons  
     - *Enterprise* → ask name → service → worker → date → time → confirm  
     - *Individual* → skip worker selection  
   - **Free mode** (if enabled): send to OpenAI → parse JSON snippet → book  
   - System prompt dynamically built from `ConfigContext`  

6. **Test Environment** (`/src/pages/TestEnvironment.js`)  
   - Live preview of calendar + chat flows  
   - Toggle between mock vs. real ARN-driven data  

---

## 🗓️ Data & Flow

1. **Login**  
   - Redirect to  
     ```
     https://<YOUR_DOMAIN>.auth.<region>.amazoncognito.com/oauth2/authorize
       ?response_type=token
       &client_id=<CLIENT_ID>
       &redirect_uri=<REDIRECT_URI>
       &scope=openid email phone
     ```
   - On redirect back, extract `id_token`, decode `custom:accountType`

2. **Config Loading**  
   - `ConfigContext` reads `sessionStorage.userRole`  
   - Loads DynamoDB ARNs from `localStorage` under `config_<role>`  
   - Falls back to `defaultConfig` + mocks

3. **Data Fetching**  
   - `api.fetchConfig()`, `api.fetchBarbers()`, `api.bookAppointment()`  
   - If no ARN or offline, uses mock arrays (`mockData.js`)

4. **Booking**  
   - **Calendar UI** → POST to `/appointments/book`  
   - **Chat UI** → callChatApi or guided flow → final JSON → `onNewAppointment()`

---

## 🔧 Environment Variables

```ini
# Backend & OpenAI
REACT_APP_BACKEND_URL=…
REACT_APP_API_URL=…

REACT_APP_OPENAI_API_KEY=…

# AWS Cognito
REACT_APP_AWS_REGION=us-east-2
REACT_APP_USER_POOL_ID=us-east-2_XXXXXXX
REACT_APP_COGNITO_CLIENT_ID=XXXXXXXXXXXXX
REACT_APP_COGNITO_DOMAIN=https://<your-domain>.auth.us-east-2.amazoncognito.com
REACT_APP_REDIRECT_URI=http://localhost:3000
````

---

## 🛠️ Recent Enhancements

* **Hosted-UI only** for auth (no Amplify Auth imports)
* Robust **implicit grant** flow with `id_token` parsing
* Fully **role-driven** booking flows in chat & calendar
* Expanded **mock fallback** logic for offline/dev
* Improved **date formatting** (avoiding timezone bugs)
* Dynamic **system prompt** in Chatbox based on config

---

## 🔮 Future Roadmap

* 🎯 **WhatsApp API** integration for real-time notifications
* 📊 **Analytics dashboard** (bookings, revenue, worker performance)
* 📱 **Native mobile apps** with offline sync
* ⚙️ Support for additional **data stores** (SQL, MongoDB)

---

## 🐞 Troubleshooting

* **No data from DynamoDB?** → verify ARNs in Config tab, correct `arn:aws:dynamodb:…`
* **Chat flow skips steps?** → check `config.chatbot.guidedMode` & `userRole`
* **Cognito redirect errors?** → ensure `REDIRECT_URI` exactly matches allowed callback
* **Environment not loading?** → restart dev server after editing `.env`

---

> *Keep this context up to date as the project grows!*

```
```
