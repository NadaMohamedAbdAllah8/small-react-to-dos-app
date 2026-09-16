# React CRUD Learning App

A React application for learning frontend development through CRUD features. The project uses Vite with JavaScript and JSX.

## Installation

Install the project dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`. The default configuration points the app to the local mock API:

```dotenv
VITE_API_BASE_URL=http://localhost:3001/api
```

## Local development

Start the mock API in one terminal:

```bash
npm run mock:api
```

Start the Vite development server in another terminal:

```bash
npm run dev
```

## Available commands

Start only the Vite development server:

```bash
npm run dev
```

Start only the local mock API:

```bash
npm run mock:api
```

Create a production build in `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run tests in watch mode:

```bash
npm test
```

Run the test suite once:

```bash
npm run test:run
```

## Project setup

- React renders the user interface.
- Vite provides the development server and production build.
- Vitest and React Testing Library test visible application behavior.
- Application source files use JavaScript and JSX.
