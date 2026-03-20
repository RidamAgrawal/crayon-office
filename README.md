# 📋 Jira Clone

A feature-rich **Jira-inspired project management tool** built with **Angular 20**. Users can create accounts, manage dashboards, and create ticket items — all through a polished, component-driven UI.

> **⚠️ Work in Progress** — This project is under active development. Core features like user accounts, dashboards, and ticket creation are functional, with more capabilities being added.

---

## ✨ Features

| Feature | Status |
|---|---|
| 🔐 User account creation & landing page | ✅ |
| 📊 Dashboard with sidebar navigation | ✅ |
| 🏠 Dashboard Home & Recent views | ✅ |
| 📝 Rich-text WYSIWYG editor (ProseMirror) | ✅ |
| 🎨 Color picker for text styling | ✅ |
| 😄 Emoji picker with search & skin tones | ✅ |
| 📷 Image upload, link preview & camera capture | ✅ |
| 📋 Task lists, bullet/ordered lists, code blocks | ✅ |
| 🔍 Dashboard search bar | ✅ |
| 🧩 Drag-and-drop support (CDK) | ✅ |
| 🎫 Full ticket management workflow | 🚧 |
| 👥 Team collaboration features | 🚧 |

---

## 🛠️ Tech Stack

- **Framework:** [Angular 20](https://angular.dev/)
- **Language:** TypeScript 5.8
- **Styling:** SCSS
- **Rich-Text Editor:** [ProseMirror](https://prosemirror.net/)
- **UI Kit:** Angular CDK (Overlay, Drag & Drop, Virtual Scroll)
- **State Management:** Angular Signals & RxJS
- **Build Tool:** Angular CLI / `@angular/build`

---

## 📁 Project Structure

```
src/app/
├── components/
│   ├── dashboards/          # Main dashboard module & child routes
│   │   └── _components/     # Header, sidebar, search bar, modals, tabs
│   ├── header/              # App header
│   └── landing/             # Landing / sign-up page
├── directives/              # click-outside, tooltip, resizable, floating-container
├── modules/                 # Feature modules
├── services/
│   ├── http-service/        # API communication
│   ├── overlay-service/     # CDK overlay manager
│   └── template-service/    # Template helpers
└── templates/               # Reusable UI components
    ├── wysiwyg2/            # ProseMirror-based rich-text editor
    │   ├── components/      # Toolbar, ColorPicker, EmojiPicker, MediaUpload, MiscTools
    │   ├── pipes/           # Unicode-to-emoji pipe
    │   └── services/        # EditorView, EditorCommands, EditorImage
    ├── text-field/          # Input field with validation
    ├── checkbox/            # Checkbox component
    ├── multi-select/        # Multi-select dropdown
    ├── toggle-btn/          # Toggle switch
    ├── radio-group/         # Radio button group
    └── ...                  # listing, sidebar-item, option-wrapper, etc.
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Angular CLI** ≥ 20 (`npm install -g @angular/cli`)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/jira-clone.git
cd jira-clone

# Install dependencies
npm install
```

### Development Server

```bash
npm start
```

Navigate to **http://localhost:4200/**. The app will auto-reload on source file changes.

### Build

```bash
npm run build
```

Build artifacts are stored in the `dist/` directory.

### Running Tests

```bash
npm test
```

---

## 📸 Screenshots

> _Screenshots coming soon — the project is under active development._

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is for learning and practice purposes.

---

<p align="center">
  Built with ❤️ using <strong>Angular 20</strong> & <strong>ProseMirror</strong>
</p>
