# Hospital Management System — Backend

NestJS API for the Hospital Management System, backed by PostgreSQL (Supabase).

## Database schema

The entity-relationship diagram below shows the core data model for patients, clinical workflows, billing, and inventory.

![ER diagram](./docs/er-diagram.png)

### Entities

| Table | Description |
| --- | --- |
| `patients` | Patient demographics and contact details |
| `departments` | Hospital departments |
| `doctors` | Doctors linked to departments |
| `appointments` | Scheduled visits between patients and doctors |
| `rooms` | Ward/room inventory and daily charges |
| `admissions` | Inpatient stays linked to patients and rooms |
| `prescriptions` / `prescription_items` | Prescriptions and line-item medicines |
| `medicines` | Medicine catalog and stock |
| `lab_tests` | Lab orders and results |
| `bills` / `payments` | Billing and payment records |

The diagram source lives in [`docs/dbdiagram.io`](./docs/dbdiagram.io). Edit that file in [dbdiagram.io](https://dbdiagram.io), export a new PNG, and replace [`docs/er-diagram.png`](./docs/er-diagram.png) when the schema changes.

## Project setup

```bash
npm install
cp .env.example .env
```

Fill in your Supabase/PostgreSQL credentials in `.env`.

## Run locally

```bash
# development
npm run start

# watch mode
npm run start:dev

# production build
npm run build
npm run start:prod
```

API docs (Swagger):

- Local: [http://localhost:3000/api](http://localhost:3000/api)
- Vercel: `/docs` (see `.env.example`)

## Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Deployment (Vercel)

This project includes a [`vercel.json`](./vercel.json) configured for NestJS on Vercel.

```bash
npm install -g vercel
vercel
```

Set environment variables from [`.env.example`](./.env.example) in the Vercel project settings.

## License

MIT
