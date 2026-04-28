# Markdown Editor Mock API (Stria API)

A lightweight NestJS backend designed strictly as an example to connect and run the front-end markdown editor showcase. It fulfills the required API contract by returning mock data, allowing the frontend to run locally without needing a real database.

## Runtime

- NestJS + TypeScript
- `@nestjs/config` for secure environment variable parsing
- Built-in CORS configuration to allow local frontend requests
- Pure REST API architecture (No database connections configured for this showcase)

## Environment

Create a `.env` file in the root directory.

```bash
# The port this backend will run on
PORT=3000

# The URL of your local Vite frontend to allow through CORS
VITE_FRONT_END_BASE_URL=http://localhost:5173
```

## Command

```
# Run in watch mode for development (Recommended)
npm run start:dev

# Run in production mode
npm run start:prod

# Build the application
npm run build

# Run linting
npm run lint

# Run unit tests
npm test
```