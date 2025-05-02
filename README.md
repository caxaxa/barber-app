# WhatsApp Business Assistant

A configurable React front-end and AWS SAM back-end application for managing barbershop (or service-based business) appointments via a chat interface.

## Features

* **Multi-tenant support**: Separate data per user account (individual vs enterprise).
* **AWS Cognito authentication**: Hosted UI sign-up, sign-in, and token-based API protection.
* **DynamoDB persistence**: Appointments, barbers, and configuration stored per tenant.
* **React + MUI front-end**: Admin configuration pages and chat-based booking UI.
* **OpenAI integration**: Free-form and guided booking via ChatGPT.
* **Mock & offline mode**: Local data fallback for development.
* **Customizable prompts & templates**: Business, assistant, theme, messaging, integrations.

## Repository Structure

```
barber-app/
├─ frontend/          # React application
│  ├─ src/
│  │  ├─ context/     # ConfigContext, Authentication logic
│  │  ├─ pages/       # LoginPage, AdminPage, SignIn, SignUp
│  │  ├─ components/  # Chatbox, configuration panels
│  │  ├─ services/    # api.js, cognito.js, mockData
│  │  └─ App.js       # Root component
├─ backend/           # AWS SAM service
│  ├─ template.yaml   # SAM template for Lambda + API Gateway + DynamoDB
│  └─ src/            # Lambda handlers and helpers
├─ README.md          # Project overview & setup (this file)
└─ CONTEXT.md         # System & chat prompt guidelines
```

## Getting Started

### Prerequisites

* Node.js 20+ (frontend)
* AWS CLI & SAM CLI (backend)
* An AWS account with permissions for Cognito, API Gateway, Lambda, DynamoDB

### Front-end Setup

1. Copy `.env.example` to `.env` and fill in:

   ```ini
   REACT_APP_BACKEND_URL=http://localhost:3002
   REACT_APP_API_URL=https://<api-gateway-id>.execute-api.<region>.amazonaws.com/Prod
   REACT_APP_OPENAI_API_KEY=<your-openai-key>

   REACT_APP_USER_POOL_ID=<your-cognito-pool-id>
   REACT_APP_COGNITO_CLIENT_ID=<your-cognito-client-id>
   REACT_APP_AWS_REGION=<your-aws-region>
   REACT_APP_COGNITO_DOMAIN=https://<your-cognito-domain>.auth.<region>.amazoncognito.com
   REACT_APP_REDIRECT_URI=http://localhost:3000
   ```
2. Install dependencies and start:

   ```bash
   cd frontend
   npm install
   npm start
   ```

### Back-end Setup

1. Configure AWS SAM:

   ```bash
   cd backend
   sam build
   sam deploy --guided
   ```
2. Note the API endpoint and update `REACT_APP_API_URL` in `.env`.

## Authentication & Authorization

* Uses AWS Cognito Hosted UI (OAuth2 implicit flow).
* Front-end redirects to Cognito for login/signup.
* Upon return, stores `id_token` in `sessionStorage` and sets `shopId` & `userRole`.
* All API calls include `Authorization: <JWT>` header.

## Configuration & Usage

* **Individual vs Enterprise**: Choice at sign-up (`custom:accountType`).
* **ConfigContext**: Manage business settings, themes, messages, integrations.
* **Admin UI**: Tabs for Business, Assistant, Theme, Terminology, Messages, Integrations, Security.
* **Chatbox**: Guided vs free-mode booking flows.

## Deployment

* Front-end: build as static, host on S3/CloudFront or any static host.
* Back-end: AWS SAM deploys Lambdas, API Gateway, and DynamoDB tables.
* Cognito: configure callback/logout URLs for production domain.

## Contributing

Feel free to open issues or pull requests to improve features, fix bugs, or enhance documentation.

---

*Last updated: \$(date +'%Y-%m-%d')*
