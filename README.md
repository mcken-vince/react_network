# SocialConnect - React Social Network Application

A full-stack social networking application built with React, TanStack Router, and Express.js. Users can create accounts, view profiles, and connect with other users in a modern, responsive interface.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd react_network
   ```

2. **Install client dependencies**

   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   npm run install:server
   ```

### Development

**Start both client and server in development mode:**

```bash
npm run dev
```

This will start:

- Frontend development server on `http://localhost:5173`
- Backend API server on `http://localhost:3001`

**Start services individually:**

```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server
```

### Building for Production

```bash
npm run build
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
