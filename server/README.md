# React Network Server - PostgreSQL Backend

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (running on localhost:5433)
- npm or yarn

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your configuration:

   ```
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5433
   DB_NAME=react_network
   DB_USER=postgres
   DB_PASSWORD=postgres

   # JWT Configuration
   JWT_SECRET=your-secret-key-change-in-production

   # Server Configuration
   PORT=3001
   ```

3. **Create the database:**

   Make sure PostgreSQL is running on localhost:5433, then create the database:

   ```sql
   CREATE DATABASE react_network;
   ```

4. **Set up database tables:**
   ```bash
   npm run db:setup
   ```

## Running the Server

- **Development mode (with auto-reload):**

  ```bash
  npm run dev
  ```

- **Production mode:**
  ```bash
  npm start
  ```
