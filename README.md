# Tutor - AI-Powered Learning Platform

Tutor is a modern, AI-powered learning platform built as a Progressive Web Application (PWA). It provides an interactive and personalized learning experience with real-time AI assistance.

## 🌟 Key Features

- **AI-Powered Learning**: Integration with OpenAI for intelligent tutoring and assistance
- **Progressive Web App**: Offline capabilities and native-like experience
- **Real-time Notifications**: Firebase Cloud Messaging for instant updates
- **Responsive Design**: Modern UI built with Tailwind CSS
- **User Authentication**: Secure authentication system
- **Content Management**: Dynamic content handling with Nuxt Content
- **State Management**: Efficient state management with Pinia
- **Type Safety**: Full TypeScript support throughout the application

## 🛠 Tech Stack

### Frontend

- **Framework**: Nuxt.js 3
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **TypeScript**: For type safety
- **Push Notifications**: Firebase Cloud Messagin
- **PWA Support**: Vite PWA
- **Image Optimization**: Nuxt Image
- **Authentication**: Supabase Auth

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase
- **Push Notifications**: Firebase Cloud Messagin
- **Scheduling**: node-cron
- **Type Safety**: TypeScript
- **API Integration**: OpenAI API

## 🚀 Deployment Flow

### Frontend Deployment

1. Build the application:
   ```bash
   cd frontend
   npm run build
   ```
2. The build process includes:
   - TypeScript compilation
   - Service Worker generation
   - Environment configuration
   - PWA manifest generation

### Backend Deployment

1. Build the backend:
   ```bash
   cd backend
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```

## 🔧 Environment Setup

### Frontend Environment Variables

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `VAPID_KEY`: Web Push VAPID key
- Firebase configuration variables
- `MODE`: Application mode (development/production)

### Backend Environment Variables

- Database connection details
- API keys
- Authentication credentials

## 📱 PWA Features

- Offline support
- Push notifications
- App-like experience
- Automatic updates
- Caching strategies for:
  - Static assets
  - API responses
  - User preferences
  - Subject data

## 🔒 Security

- Secure authentication flow
- Environment variable protection
- API key management
- CORS configuration
- Type-safe API endpoints

## 🧪 Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
npm install
npm run dev
```

## 📄 License

ISC License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
