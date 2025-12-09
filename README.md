# Patient Management System

A Node.js application built with Express.js and TypeScript for managing patient records.

## Features

- Built with TypeScript for type safety
- Express.js web framework
- Hot-reload development environment with nodemon
- Production-ready build process

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

```bash
npm install
```

## Development

Run the development server with hot-reload:

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Production

Run the compiled application:

```bash
npm start
```

## Available Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Project Structure

```
patient-management/
├── src/
│   └── index.ts          # Main application entry point
├── dist/                 # Compiled JavaScript (generated)
├── node_modules/         # Dependencies
├── package.json          # Project metadata and dependencies
├── tsconfig.json         # TypeScript configuration
└── .gitignore           # Git ignore rules
```

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Dev Tools:** ts-node, nodemon

## License

ISC
