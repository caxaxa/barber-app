# Barber‑App

> Multi‑tenant barber booking platform powered by React, AWS SAM & Cognito Hosted‑UI.

[![Build](https://img.shields.io/github/actions/workflow/status/caxaxa/barber-app/ci.yml?label=build)](../../actions)
[![License](https://img.shields.io/github/license/caxaxa/barber-app)](LICENSE)

---

## 🗺️ Architecture

```mermaid
flowchart LR
    subgraph Client
        A[User Browser]
    end
    A -- "1 · Hosted‑UI Login" --> B[AWS Cognito]
    B -- "2 · id_token" --> A
    A -- "3 · Bearer id_token" --> C[API Gateway (HTTP)]
    C -- "4 · Invoke" --> D[Lambda (app.py)]
    D -- "5 · CRUD" --> E[DynamoDB Tables]
    E -- "6 · Result" --> D --> C --> A
```

---

## ✨ Live Demo

| Flow                      | Preview                                    |
| ------------------------- | ------------------------------------------ |
| Calendar booking (guided) | ![Calendar demo](assets/demo_calendar.gif) |
| Chat assistant (AI)       | ![Chat demo](assets/demo_chat.gif)         |

> *GIFs too big?* Replace with short Loom or YouTube links—the table will still render nicely.

---

## 🚀 Quick Start

```bash
# clone & install
$ git clone https://github.com/caxaxa/barber-app.git && cd barber-app
$ cp docs/SETUP.md .env        # copy sample env vars (or edit manually)
$ npm --prefix shop-frontend install
$ sam build && sam deploy --guided  # deploy backend
$ npm --prefix shop-frontend start  # launch React dev server
```

Full environment‑variable reference has moved to **[`docs/SETUP.md`](docs/SETUP.md)** to keep this README lightweight.

---

## 📅 Features at a Glance

* **Dual‑mode booking** – enterprise (multi‑staff) vs. individual (solo pro)
* **AWS Cognito Hosted‑UI** implicit flow (no Amplify Auth SDK)
* **OpenAI‑powered chat assistant** with role‑aware system prompts
* **Serverless back‑end** – AWS SAM, Lambda, DynamoDB (on‑demand)
* **Mock fallback** – works offline with in‑memory data for quick demos

---

# docs/SETUP.md (new file)

```md
# Local Setup & Environment Variables

Copy this file to your project root as `.env` and fill in the blanks.

| Variable | Example | Purpose |
|----------|---------|---------|
| `REACT_APP_BACKEND_URL` | `https://api.example.com` | Root URL returned by SAM/API Gateway |
| `REACT_APP_API_URL` | `https://api.example.com/Prod` | Versioned endpoint for REST calls |
| `REACT_APP_OPENAI_API_KEY` | `sk‑********************************` | Enables AI chat assistant |
| `REACT_APP_AWS_REGION` | `us‑east‑2` | Region for Cognito & DynamoDB |
| `REACT_APP_USER_POOL_ID` | `us‑east‑2_abcd1234` | Cognito User Pool ID |
| `REACT_APP_COGNITO_CLIENT_ID` | `1h57kf5cpq17********` | OAuth2 app client (implicit) |
| `REACT_APP_COGNITO_DOMAIN` | `https://your-domain.auth.us-east-2.amazoncognito.com` | Hosted‑UI domain |
| `REACT_APP_REDIRECT_URI` | `http://localhost:3000` | Callback URL whitelisted in Cognito |

## Extra (optional)

| Variable | Purpose |
|----------|---------|
| `REACT_APP_GOOGLE_CALENDAR_ID` | Enables Google Calendar sync for free tier |
| `REACT_APP_GOOGLE_API_KEY` | Needed if you activate calendar sync |

---

## Tips

* **No redirects?** Ensure your `REACT_APP_REDIRECT_URI` matches *exactly* in Cognito console.
* **CORS 401?** Double‑check the API Gateway authorizer is pointed at the same User Pool.
* **Running offline?** Omit API URLs – the front‑end auto‑switches to mock data.
```
