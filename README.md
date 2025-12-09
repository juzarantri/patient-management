# Patient Management System - Setup & Running Guide

A robust Node.js application built with Express.js and TypeScript for managing patient records with AWS integration (Cognito, DynamoDB, OpenSearch).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Overview](#project-overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **npm** v6+ (comes with Node.js) or **yarn**
- **AWS Account** with the following services configured:
  - AWS Cognito (for authentication)
  - DynamoDB (for patient data storage)
  - OpenSearch (optional, for advanced search capabilities)
- **AWS CLI** configured with credentials (for setup and testing)

## Project Overview

This is a Patient Management System API that provides:

- **Patient CRUD Operations**: Create, Read, Update, Delete patient records
- **Authentication**: JWT-based authentication using AWS Cognito
- **Search Capabilities**: Search patients by address or medical conditions
- **Data Storage**: DynamoDB for persistent patient data storage
- **Full-Text Search**: OpenSearch integration for fast condition-based searches
- **Type Safety**: Built with TypeScript for better developer experience

## Installation

### Step 1: Clone and Navigate to Project

```bash
cd patient-management
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Express.js (web framework)
- AWS SDK v3 (DynamoDB, Cognito, OpenSearch)
- TypeScript (language)
- nodemon (development auto-reload)
- ts-node (TypeScript execution)

## Configuration

### Step 1: Create Environment File

Create a `.env` file in the root directory of the project:

```bash
# Create .env file
copy NUL .env
# or on Linux/Mac
touch .env
```

### Step 2: Add Required Environment Variables

Add the following variables to your `.env` file:

```env
# Server Configuration
PORT=3000

# AWS Configuration
AWS_REGION=ap-south-1

# Cognito Configuration
COGNITO_USER_POOL_ID=<your-user-pool-id>
COGNITO_CLIENT_ID=<your-client-id>

# DynamoDB Configuration
PATIENTS_TABLE_NAME=Patients

# OpenSearch Configuration (Optional)
OPENSEARCH_DOMAIN=<your-opensearch-domain>
OPENSEARCH_INDEX=patients
```

### Step 3: Get Configuration Values

You'll need to obtain these values from your AWS Console:

1. **Cognito User Pool ID & Client ID**:
   - Go to AWS Cognito → User Pools → Select your pool
   - Copy User Pool ID from "General Settings"
   - Copy Client ID from "App Integration" → "App Clients and Analytics"

2. **DynamoDB Table**:
   - Create a Patients table in DynamoDB (see `create-table-script.md` for SQL commands)
   - Or run: `aws dynamodb create-table --cli-input-json file://path-to-schema.json`

3. **OpenSearch Domain** (Optional):
   - Create an OpenSearch domain in AWS OpenSearch Service
   - Copy the domain endpoint (without `https://` or `:443`)

## Running the Project

### Development Mode (with auto-reload)

Run the application in development mode with hot-reload:

```bash
npm run dev
```

Expected output:
```
Server is running on http://localhost:3000
OpenSearch Client initialized for domain: <your-domain>
```

The server will automatically restart when you modify files in the `src/` directory.

### Build for Production

Compile TypeScript to JavaScript:

```bash
npm run build
```

This generates JavaScript files in the `dist/` directory.

### Production Mode

Run the compiled application:

```bash
npm start
```

## Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled application in production |
| `npm run auth` | Run Cognito authentication utility (testing) |
| `npm test` | Run tests (currently not configured) |

## API Endpoints

### Base URL
```
http://localhost:3000/api/patients
```

### Patient Management Endpoints

#### 1. Create Patient (Protected)
```http
POST /api/patients
Authorization: Bearer <cognito-token>
Content-Type: application/json

{
  "name": "John Doe",
  "address": "123 Main St, New York, NY",
  "conditions": ["Diabetes", "Hypertension"],
  "allergies": ["Penicillin"]
}
```

#### 2. List All Patients (Public)
```http
GET /api/patients?limit=50
```

#### 3. Get Patient by ID (Public)
```http
GET /api/patients/{patientId}
```

#### 4. Update Patient (Protected)
```http
PUT /api/patients/{patientId}
Authorization: Bearer <cognito-token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "conditions": ["Diabetes"]
}
```

#### 5. Delete Patient (Protected)
```http
DELETE /api/patients/{patientId}
Authorization: Bearer <cognito-token>
```

### Search Endpoints

#### 6. Search by Address (Public)
```http
GET /api/patients/search/address?address=New%20York
```

#### 7. Search by Condition (Public)
```http
GET /api/patients/search/condition?condition=Diabetes
```

### Health Check
```http
GET /
```

## Project Structure

```
patient-management/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── config/
│   │   ├── cognito.ts             # AWS Cognito JWT verification
│   │   ├── database.ts            # DynamoDB client setup
│   │   └── opensearch.ts          # OpenSearch client setup
│   ├── controllers/
│   │   └── patientController.ts   # Request handlers
│   ├── services/
│   │   └── patientService.ts      # Business logic
│   ├── routes/
│   │   └── patientRoutes.ts       # API route definitions
│   ├── middleware/
│   │   └── authMiddleware.ts      # JWT authentication
│   ├── types/
│   │   └── patient.ts            # TypeScript interfaces
│   └── utils/
│       └── cognitoAuth.ts         # Cognito utilities
├── dist/                          # Compiled JavaScript (generated)
├── node_modules/                  # Dependencies
├── package.json                   # Project metadata
├── tsconfig.json                  # TypeScript configuration
├── create-table-script.md         # DynamoDB setup instructions
└── .env                          # Environment variables (create this)
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js 5.x |
| **Language** | TypeScript 5.x |
| **Database** | AWS DynamoDB |
| **Search** | AWS OpenSearch |
| **Authentication** | AWS Cognito |
| **Dev Tools** | ts-node, nodemon, tsconfig-paths |
| **Build Tool** | TypeScript Compiler (tsc) |

## Authentication Details

### How Authentication Works

1. **Login**: Users authenticate with AWS Cognito using username/password
2. **Get Token**: Cognito returns a JWT access token
3. **API Calls**: Include token in `Authorization: Bearer <token>` header
4. **Verification**: Middleware validates token signature and expiry

### Protected vs Public Endpoints

- **Protected** (require valid token):
  - `POST /api/patients` - Create patient
  - `PUT /api/patients/:id` - Update patient
  - `DELETE /api/patients/:id` - Delete patient

- **Public** (no authentication needed):
  - `GET /api/patients` - List patients
  - `GET /api/patients/:id` - Get patient details
  - `GET /api/patients/search/address` - Search by address
  - `GET /api/patients/search/condition` - Search by condition

## Troubleshooting

### Issue: `COGNITO_USER_POOL_ID not configured`

**Solution**: Check your `.env` file has the correct `COGNITO_USER_POOL_ID` value from AWS Cognito console.

### Issue: `Cannot find module '@/...'`

**Solution**: This uses path aliases configured in `tsconfig.json`. Make sure you're using `npm run dev` or `npm run build` (not directly running `.ts` files).

### Issue: `DynamoDB connection failed`

**Solution**:
1. Verify AWS credentials are configured: `aws sts get-caller-identity`
2. Check `PATIENTS_TABLE_NAME` exists in DynamoDB
3. Verify AWS region in `.env` matches your DynamoDB table region

### Issue: `OpenSearch initialization failed`

**Solution**: This is non-fatal. The API will work without OpenSearch for search operations. If you need OpenSearch:
1. Create an OpenSearch domain in AWS
2. Add `OPENSEARCH_DOMAIN` to `.env`
3. Ensure your AWS credentials have OpenSearch permissions

### Issue: Port 3000 already in use

**Solution**: Either:
1. Change the port in `.env`: `PORT=3001`
2. Kill the process using port 3000: `npx kill-port 3000` (Windows) or `lsof -ti:3000 | xargs kill -9` (Mac/Linux)

### Issue: TypeScript compilation errors

**Solution**:
1. Clear the dist folder: `rm -r dist` (Windows: `rmdir /s dist`)
2. Rebuild: `npm run build`
3. Check that all dependencies are installed: `npm install`

## Testing the API

### Using Postman or cURL

1. **Get Cognito Token** (using provided script):
   ```bash
   npm run auth
   ```

2. **Create a Patient**:
   ```bash
   curl -X POST http://localhost:3000/api/patients \
     -H "Authorization: Bearer <your-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "address": "123 Main St",
       "conditions": ["Diabetes"],
       "allergies": ["Penicillin"]
     }'
   ```

3. **List Patients**:
   ```bash
   curl http://localhost:3000/api/patients
   ```

4. **Search by Condition**:
   ```bash
   curl "http://localhost:3000/api/patients/search/condition?condition=Diabetes"
   ```

## Database Schema

### Patients Table (DynamoDB)

| Attribute | Type | Key | Notes |
|-----------|------|-----|-------|
| `patientId` | String | Partition Key | Unique patient identifier (UUID) |
| `name` | String | - | Patient full name |
| `address` | String | GSI | Global Secondary Index for address searches |
| `conditions` | Array | - | Medical conditions (e.g., ["Diabetes", "Hypertension"]) |
| `allergies` | Array | - | Known allergies |
| `createdAt` | String | - | ISO timestamp of creation |
| `updatedAt` | String | - | ISO timestamp of last update |

For detailed table creation instructions, see `create-table-script.md`.

## Environment Variables Reference

```env
# Server
PORT                  # Server port (default: 3000)

# AWS
AWS_REGION           # AWS region (e.g., ap-south-1, us-east-1)

# Cognito
COGNITO_USER_POOL_ID # User pool ID from AWS Cognito
COGNITO_CLIENT_ID    # Client ID from Cognito App Client

# DynamoDB
PATIENTS_TABLE_NAME  # DynamoDB table name (default: Patients)

# OpenSearch (Optional)
OPENSEARCH_DOMAIN    # OpenSearch domain endpoint
OPENSEARCH_INDEX     # Index name in OpenSearch (default: patients)
```

## Quick Start Summary

```bash
# 1. Install dependencies
npm install

# 2. Create and configure .env file
copy NUL .env
# (Add environment variables)

# 3. Create DynamoDB table
aws dynamodb create-table --table-name Patients ...

# 4. Run development server
npm run dev

# 5. Test the API
curl http://localhost:3000/
```


## Support

For issues or questions, check the troubleshooting section above or refer to the inline code comments in the `src/` directory.
