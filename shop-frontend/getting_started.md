# Getting Started: Deploying Your React + Cognito + S3/CloudFront App

This guide walks through the end‑to‑end process we used to deploy a React application (with AWS Cognito authentication) as a static site on S3, fronted by CloudFront over HTTPS, and exposed via a custom domain (e.g., `calendario.aisol.cloud`). Save this as `GETTING_STARTED.md` in your project’s `infrastructure/` directory for future reference.

---

## Table of Contentsen

1. [Prerequisites](#prerequisites)
2. [React App Configuration](#react-app-configuration)
3. [Build & Upload to S3](#build--upload-to-s3)
4. [Configure S3 Static Website Hosting](#configure-s3-static-website-hosting)
5. [Set Bucket Policy for Public Read](#set-bucket-policy-for-public-read)
6. [Request & Validate ACM Certificate (DNS)](#request--validate-acm-certificate-dns)
7. [Create CloudFront Distribution](#create-cloudfront-distribution)
8. [Point Your Domain via CNAME](#point-your-domain-via-cname)
9. [AWS Cognito Hosted UI Setup](#aws-cognito-hosted-ui-setup)
10. [Cognito Localization & Custom Attributes](#cognito-localization--custom-attributes)
11. [React Integration with Hosted UI](#react-integration-with-hosted-ui)
12. [Troubleshooting & Tips](#troubleshooting--tips)

---

## Prerequisites

* **AWS Account** with permissions to create S3 buckets, CloudFront distributions, ACM certificates, and Route 53 records (if managing DNS in AWS).
* **Domain Name** (e.g. managed at Hostinger) for which you can create subdomain records.
* **AWS CLI** configured with your credentials and default region.
* **Node.js & npm** for building your React app.
* **React project** using environment variables (`.env`).

---

## React App Configuration

1. In your React project root, create/update `.env`:

   ```ini
   REACT_APP_API_URL=https://<your-api>
   REACT_APP_USER_POOL_ID=<YOUR_COGNITO_POOL_ID>
   REACT_APP_COGNITO_CLIENT_ID=<YOUR_COGNITO_APP_CLIENT_ID>
   REACT_APP_AWS_REGION=<your-region>           # e.g. us-east-2
   REACT_APP_COGNITO_DOMAIN=https://<your-cognito-domain>
   REACT_APP_REDIRECT_URI=https://calendario.aisol.cloud
   ```
2. Use these variables in your `LoginPage` (hosted UI redirect) and in `api.js` (to send `Authorization: Bearer <idToken>` headers).

---

## Build & Upload to S3

1. Build your app for production:

   ```bash
   npm run build
   ```
2. Sync the `build/` folder to your S3 bucket:

   ```bash
   aws s3 sync build/ s3://calendario.aisol.cloud --delete
   ```

---

## Configure S3 Static Website Hosting

1. In the AWS S3 Console > **calendario.aisol.cloud** bucket > **Properties** > **Static website hosting**.
2. Enable hosting, set **Index document** and **Error document** to `index.html`.
3. Note the **Endpoint** (e.g. `calendario.aisol.cloud.s3-website.us-east-2.amazonaws.com`).

---

## Set Bucket Policy for Public Read

Allow CloudFront (and browsers) to read your files:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::calendario.aisol.cloud/*"
  }]
}
```

Paste into **Permissions** > **Bucket policy**.

---

## Request & Validate ACM Certificate (DNS)

1. In **us-east-1** (N. Virginia) ACM, request certificate:

   ```bash
   aws acm request-certificate \
     --region us-east-1 \
     --domain-name calendario.aisol.cloud \
     --validation-method DNS \
     --query CertificateArn --output text
   ```
2. Note the ARN returned.
3. Fetch DNS validation record:

   ```bash
   aws acm describe-certificate \
     --region us-east-1 \
     --certificate-arn <ARN> \
     --query "Certificate.DomainValidationOptions[0].ResourceRecord"
   ```
4. In your DNS provider (Hostinger), add that **CNAME** (Name = e.g. `_4324...`; Value = `_9836...`) and wait for it to propagate.
5. Poll until ACM reports status `ISSUED`:

   ```bash
   aws acm wait certificate-validated --region us-east-1 --certificate-arn <ARN>
   ```

---

## Create CloudFront Distribution

1. In **us-east-1** CloudFront console, **Create Distribution** → **Single website or app**.
2. **Origin domain**: your S3 website endpoint:

   ```
   calendario.aisol.cloud.s3-website.us-east-2.amazonaws.com
   ```
3. **Viewer protocol policy**: Redirect HTTP to HTTPS.
4. **Alternate domain names (CNAMEs)**: `calendario.aisol.cloud`.
5. **Custom SSL certificate**: select your validated ACM cert from us-east-1.
6. **Default root object**: `index.html`.
7. Leave other settings at defaults (CachingOptimized, HTTP2, etc.).
8. Create and wait until **Status** is **Deployed**.

---

## Point Your Domain via CNAME

In your DNS (Hostinger):

* **Type**: CNAME
* **Name**: `calendario`
* **Value**: `<your-cloudfront-domain>.cloudfront.net`
* **TTL**: e.g. 1 hour.

Allow DNS TTL to expire (\~5 min) then visit `https://calendario.aisol.cloud`.

---

## AWS Cognito Hosted UI Setup

1. In Cognito console > User Pool > **App clients** > configure Allowed callback URLs:

   ```
   https://calendario.aisol.cloud
   ```
2. Allowed sign-out URLs = same.
3. OAuth flows: Enable **Authorization code grant**.
4. Scopes: `openid`, `email`, `phone`.
5. Save changes.
6. Under **Domain** > set your hosted UI subdomain (e.g. `us-east-2abcd1234.auth.us-east-2.amazoncognito.com`).

---

## Cognito Localization & Custom Attributes

* **Localization**: append `?lang=pt-BR` or `&ui_locales=pt-BR` to `/oauth2/authorize` to render Portuguese. Once set, a cookie persists language.
* **Custom attributes**: define in User Pool > Attributes > Add custom up to 25, e.g. `custom:Plano`.
* **App client read/write attributes**: via AWS CLI:

  ```bash
  aws cognito-idp update-user-pool-client \
    --user-pool-id us-east-2_XXX \
    --client-id YYY \
    --read-attributes email phone_number custom:Plano name \
    --write-attributes email phone_number custom:Plano name
  ```

---

## React Integration with Hosted UI

1. On login button click, redirect to:

   ```js
   const params = new URLSearchParams({
     response_type: 'token',         // or 'code' if backend exchange
     client_id:     COGNITO_CLIENT,
     redirect_uri:  REDIRECT_URI,
     scope:         'openid email phone',
     screen_hint:   'signup',         // optional
     lang:          'pt-BR',
     ui_locales:    'pt-BR',
   });
   window.location.assign(
     `${COGNITO_DOMAIN}/oauth2/authorize?${params}`
   );
   ```
2. On redirect back, parse `window.location.hash` for `id_token` (implicit flow) or `code` (authorization code flow).
3. Decode via `import { jwtDecode } from 'jwt-decode'` and persist in `sessionStorage`.
4. Render your `AdminPage` once token is present.

---

## Troubleshooting & Tips

* **400 Unauthorized\_client**: Verify callback URL in Cognito matches exactly (including `https://`).
* **CloudFront origin errors**: ensure you used the **S3 website** endpoint (not the bucket ARN nor the REST endpoint).
* **ACM DNS validation failures**: check CAA records on your domain allow `amazonaws.com`. If not, add `0 issue "amazonaws.com"` to CAA.
* **Local development**: you can keep using `npm start` on EC2, but for HTTPS with Cognito require proper callback URL and HTTPS.
* **Invalid JWT decode import**: use `import jwtDecode from 'jwt-decode'` (default export) or named based on installed version.

---

Congratulations! 🎉 You now have a static React app with user authentication, served over a secure, high‑performance AWS stack.  Save this document for your next project rollout!

*Last updated: May 2025*
