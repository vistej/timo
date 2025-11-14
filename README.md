# Timo

A beautiful, responsive countdown timer dashboard built with React, Vite, and Tailwind CSS. Track multiple upcoming events with live countdowns, categorize timers, and enjoy a seamless experience across devices with light and dark themes.

## ✨ Features

- **Create & Manage Timers**: Add, edit, and delete countdown timers with ease
- **Category Management**: Organize timers with searchable categories
- **Live Countdowns**: Real-time updates showing days, hours, minutes, and seconds remaining
- **Theme Switcher**: Beautiful light and dark themes with smooth transitions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Persistent Storage**: All data stored locally using IndexedDB
- **Modern UI**: Glassmorphic design with smooth animations and intuitive controls

## 🚀 Live Demo

Visit the live app: [https://vistej.github.io/timo/](https://vistej.github.io/timo/)

## 🛠️ Tech Stack

- **React 19** - Modern UI library
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **IndexedDB** - Client-side storage via custom Axios adapter
- **React Select** - Searchable dropdown components
- **Heroicons** - Beautiful hand-crafted SVG icons

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/vistej/timo.git
cd timo

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm run dev
```

## 🎯 Usage

1. **Create a Timer**: Click "New timer" in the header
2. **Fill Details**: Enter event name, select a category (or create new), and choose date/time
3. **Save**: Click "Save timer" to add it to your dashboard
4. **Manage**: Edit or delete timers using the action buttons on each card
5. **Switch Themes**: Toggle between light and dark modes using the theme switcher in the header

## 📝 Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run deploy    # Deploy to GitHub Pages
```

## 🌐 Deployment

The app is configured for GitHub Pages deployment:

```bash
# Build and deploy
npm run deploy
```

The site will be published to `https://vistej.github.io/timo/`

## 🏗️ Project Structure

```
timo/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── CreateTimerForm.jsx
│   │   ├── Modal.jsx
│   │   ├── SiteHeader.jsx
│   │   └── TimerCard.jsx
│   ├── context/          # React context providers
│   │   └── TimerTickContext.jsx
│   ├── hooks/            # Custom React hooks
│   │   └── useTimerNow.js
│   ├── pages/            # Page components
│   │   └── TimersListPage.jsx
│   ├── services/         # API and storage services
│   │   ├── apiClient.js
│   │   └── indexedDbAdapter.js
│   ├── utils/            # Utility functions
│   │   └── timerStorage.js
│   ├── App.jsx           # Main app component
│   ├── index.css         # Global styles and theme variables
│   └── main.jsx          # App entry point
├── public/               # Static assets
├── index.html
├── vite.config.js
└── tailwind.config.js
```

## 🎨 Theming

The app supports both light and dark themes with custom color schemes:

- **Light Theme**: Clean, bright interface with indigo accents
- **Dark Theme**: Rich black background with warm yellow/amber accents

Themes are persisted to localStorage and automatically applied on subsequent visits.

## 🔧 Configuration

To deploy to a different GitHub Pages URL or custom domain, update the `base` path in `vite.config.js`:

```javascript
export default defineConfig({
  base: '/your-repo-name/',
  // or for custom domain:
  base: '/',
});
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

**Vistej**
- GitHub: [@vistej](https://github.com/vistej)

## 🙏 Acknowledgments

- Icons by [Heroicons](https://heroicons.com/)
- Font: [Inter](https://rsms.me/inter/)
- Built with [Vite](https://vitejs.dev/) and [React](https://react.dev/)
