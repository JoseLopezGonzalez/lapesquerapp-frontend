---
applyTo: "services/**/*.{js,jsx,ts,tsx},lib/**/*.{js,jsx,ts,tsx},features/**/services/**/*.{js,jsx,ts,tsx}"
---

# API client instructions

- Use the existing service layer.
- Do not call API endpoints directly from UI components if a service exists.
- Keep payloads explicit.
- Keep error handling consistent.
- Respect authentication and tenant headers.
- Do not expose tokens.
- Do not assume backend fields without checking existing services.
