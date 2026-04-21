# ToneLab Desktop App

A desktop Electron application built with React, TypeScript, Vite, and Electron Forge. This application provides tools for music research, sound analysis, and audio experimentation.

## Features

- 🎵 **Music Research Tools**: Explore and analyze different musical instruments and sounds
- 🔊 **Sound Research Tool**: Interactive interface for audio experimentation
- 💾 **Firebase Integration**: Cloud storage for user data and preferences
- ☁️ **Cloudinary Integration**: Image upload and transformation capabilities
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- ⚡ **Fast Development**: Powered by Vite for lightning-fast hot module replacement
- 🖥️ **Desktop Experience**: Native Electron application with system tray, menus, and desktop notifications

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with Electron Forge plugin
- **UI Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: Zustand
- **Icons**: Lucide React
- **Backend Services**: 
  - Firebase (Auth, Firestore, Storage)
  - Cloudinary (Image management)
- **Desktop Framework**: Electron 41+
- **Packaging**: Electron Forge

## Project Structure

```
tone-lab-electron/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script for security
│   ├── renderer.tsx         # React entry point
│   ├── App.tsx              # Root React component
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Firebase, Cloudinary utilities
│   ├── store/               # Zustand state management
│   ├── styles/              # Global CSS and Tailwind setup
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── forge.config.ts          # Electron Forge configuration
├── vite.*config.ts          # Vite configurations for main/preload/renderer
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (>=18.x)
- npm or yarn
- Git
- Firebase project (for full functionality)
- Cloudinary account (for image features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DjoAHP/tone-lab-electron.git
   cd tone-lab-electron
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Add your Firebase and Cloudinary credentials
   - Required variables:
     ```
     VITE_FIREBASE_API_KEY=your_key
     VITE_FIREBASE_AUTH_DOMAIN=your_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
     VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
     ```

### Development

Start the application in development mode with hot reloading:

```bash
npm run dev
```

Or start Electron directly:

```bash
npm start
```

### Building for Production

Create distributable packages for your platform:

```bash
# Package the application
npm run package

# Create installers (MSI, EXE, DMG, AppImage, etc.)
npm run make
```

The built applications will be available in the `out/make` directory.

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm start` - Start Electron application in development mode
- `npm run package` - Package the application with Electron Forge
- `npm run make` - Create distributable installers
- `npm run publish` - Publish release to GitHub
- `npm run lint` - Run ESLint for code quality
- `npm run build` - Build for production (Vite build)

## Configuration

### Electron Forge

The Electron Forge configuration is in `forge.config.ts`. It includes:
- Vite plugin for React/HMR support
- Auto unpack natives for better performance
- Fuses for security
- Multiple makers (ZIP, Deb, RPM, Squirrel.Windows)

### Vite Configuration

Separate Vite configurations for:
- `vite.main.config.ts` - Electron main process
- `vite.preload.config.ts` - Preload script
- `vite.renderer.config.ts` - Renderer process (React app)

### Environment Variables

The application uses Vite's environment variable prefacing:
- Variables must be prefixed with `VITE_` to be exposed to the renderer process
- Example: `VITE_FIREBASE_API_KEY` becomes `import.meta.env.VITE_FIREBASE_API_KEY`

## Features in Detail

### Sound Research Tool
Interactive workspace for:
- Loading and analyzing audio samples
- Visualizing waveforms and frequency spectrums
- Applying audio effects and filters
- Comparing different instrument timbres

### Instrument Library
Explore various musical instruments with:
- High-quality audio samples
- Visual representations
- Playing techniques and characteristics
- Historical context

### Data Persistence
- User preferences saved locally via Electron's storage
- Research notes and experiments saved to Firebase
- Media assets managed through Cloudinary

## Security Considerations

- Context isolation enabled in Electron webPreferences
- Preload script exposes only necessary APIs to renderer
- Content Security Policy (CSP) implemented
- Regular dependency updates to address vulnerabilities

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing-feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the existing code style.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Electron Forge](https://www.electronforge.io/) for simplifying Electron packaging
- [Vite](https://vitejs.dev/) for the fast development experience
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling approach
- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- [Firebase](https://firebase.google.com/) for backend services
- [Cloudinary](https://cloudinary.com/) for image management
- [Lucide](https://lucide.dev/) for the beautiful icon set

---

Built with ❤️ by DjoAHP