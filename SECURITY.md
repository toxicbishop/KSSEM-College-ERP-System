# Security Policy

## Supported Versions

Currently, the following versions of the KSSEM College ERP System receive security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

We take the security of this project seriously. If you find a security vulnerability, please do not report it publicly via GitHub issues. Instead, please follow the steps below:

1. **Email the Maintainer**: Send a detailed email to the project administrator/owner at [pranavarun19@gmail.com](mailto:pranavarun19@gmail.com).
2. **Details to Include**:
   - A description of the vulnerability.
   - The steps required to reproduce it (including a Proof of Concept if possible).
   - The potential impact of the vulnerability.
3. **Response Time**: We will acknowledge receipt of your vulnerability report within 48 hours and work with you to resolve it as quickly as possible.

## Security Practices

We encourage developers and administrators running this system to follow these best practices:
- **Environment Variables**: Always keep your `.env.local` file secure and never commit it to source control.
- **Firebase Security Rules**: Ensure that Firestore rules are properly deployed to prevent unauthorized read/write access. Do not run in test mode in production.
- **Dependency Management**: Regularly audit and keep packages updated, especially when Dependabot alerts are triggered.
