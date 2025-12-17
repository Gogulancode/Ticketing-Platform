# Business Hub Chat - Desktop Application

Enterprise-grade desktop chat application built with Electron and React, integrated with the Business Hub ticketing platform.

## Features

- 💬 **Real-time Messaging** - Instant messaging powered by SignalR
- 👥 **Conversations** - Direct messages, group chats, and channels
- 🎫 **Ticket Integration** - Convert conversations to support tickets
- 🔔 **Desktop Notifications** - Native OS notifications for new messages
- 📎 **File Attachments** - Share files and documents
- 😊 **Reactions** - React to messages with emojis
- ✅ **Read Receipts** - Know when messages are read
- ⌨️ **Typing Indicators** - See when others are typing
- 🟢 **Presence Status** - Online/Away/Busy/Offline status
- 🖥️ **Cross-Platform** - Windows, macOS, and Linux support

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Business Hub API server running (default: http://localhost:5016)

## Installation

```bash
cd desktop-app
npm install
```

## Development

Start the development server with hot-reload:

```bash
npm run dev
```

This will start both the Vite dev server and Electron in development mode.

## Building for Production

### Windows
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

Build outputs will be in the `release` folder.

## Project Structure

```
desktop-app/
├── electron/               # Electron main process
│   ├── main.ts            # Main process entry
│   └── preload.ts         # Preload script (context bridge)
├── src/                   # React application
│   ├── components/        # React components
│   │   ├── Layout.tsx     # Main layout wrapper
│   │   └── chat/          # Chat-specific components
│   ├── pages/             # Page components
│   │   ├── Login.tsx      # Login page
│   │   ├── Chat.tsx       # Main chat page
│   │   └── Settings.tsx   # Settings page
│   ├── services/          # API and SignalR services
│   │   ├── api.ts         # REST API client
│   │   └── signalRService.ts # SignalR hub client
│   ├── store/             # Zustand state stores
│   │   ├── authStore.ts   # Authentication state
│   │   └── chatStore.ts   # Chat state
│   ├── App.tsx            # Root component
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles
├── public/                # Static assets
│   └── icon.svg           # Application icon
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
└── tailwind.config.js     # Tailwind CSS configuration
```

## Configuration

### Server URL

The server URL can be configured in the Settings page or during login. It persists across sessions using electron-store.

Default: `http://localhost:5016`

### Auto-Updates

Auto-updates are configured using electron-updater. For production builds, configure your update server in `package.json`:

```json
{
  "build": {
    "publish": [{
      "provider": "generic",
      "url": "https://your-update-server.com/releases"
    }]
  }
}
```

## Security

- Context isolation enabled
- Node integration disabled
- Sandboxed renderer process
- Content Security Policy configured
- Secure token storage using electron-store

## API Integration

The app connects to the Business Hub API backend:

- **REST API** - For CRUD operations (conversations, messages, users)
- **SignalR Hub** - For real-time messaging at `/hubs/chat`

Authentication uses JWT tokens passed in the Authorization header.

## Tech Stack

- **Electron** - Cross-platform desktop app framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - Lightweight state management
- **SignalR** - Real-time communication
- **React Query** - Server state management
- **date-fns** - Date formatting
- **Lucide React** - Icons

## License

Proprietary - Business Hub Team
