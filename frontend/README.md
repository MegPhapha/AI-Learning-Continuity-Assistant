# AI Learning Continuity Assistant - Next.js Frontend

A modern, beautiful Next.js frontend for the AI Learning Continuity Assistant.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn installed

### Installation

```bash
cd /Users/margaretfafa/AI\ Learning\ Continuity\ Assistant/frontend

# Install dependencies
npm install

# OR with yarn
yarn install
```

### Run Development Server

```bash
npm run dev
# OR
yarn dev
```

The development server will start at `http://localhost:3000`

### Build for Production

```bash
npm run build
# OR
yarn build
```

### Start Production Server

```bash
npm run start
# OR
yarn start
```

## 📁 Project Structure

```
frontend/
├── pages/                    # Next.js pages
│   ├── index.tsx           # Student chat interface
│   ├── teacher.tsx         # Teacher dashboard
│   ├── documents.tsx       # Documents list
│   ├── settings.tsx        # User settings
│   ├── help.tsx            # Help page
│   ├── _app.tsx            # Custom App
│   └── _document.tsx        # Custom Document
├── components/              # React components
│   ├── Layout.tsx          # Main layout
│   ├── Sidebar.tsx         # Sidebar navigation
│   ├── ChatPanel.tsx       # Main chat panel (best of best!)
│   └── DocumentCard.tsx    # Document card component
├── styles/                 # CSS styles
│   └── globals.css         # Global styles with Tailwind
├── lib/                    # Utility functions
│   ├── api.ts             # API client for backend
│   └── ...
├── types/                  # TypeScript types
│   └── index.ts
├── public/                 # Static files
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

## 🎨 Features

### 💬 Chat Panel (Best of Best!)
- **Beautiful UI**: Modern design with smooth animations
- **Proper positioning**: User messages on right, AI on left
- **Rich formatting**: Markdown support with code blocks, lists, etc.
- **Message metadata**: Sources, verification status, timestamps
- **Learning features**: Practice questions, feedback, revision activities
- **Responsive**: Works on desktop, tablet, and mobile
- **Streaming support**: Real-time response generation
- **Quick actions**: Pre-defined question buttons

### 📚 Student Interface
- Clean, welcoming design
- Document selection from sidebar
- Multi-language support (English & French)
- Demo mode with realistic responses
- Source citations for all answers

### 👩‍🏫 Teacher Dashboard
- Document management (upload, approve, reject)
- Statistics overview
- Flagged response monitoring
- Search and filter capabilities
- Recent activity tracking

### 🎯 Shared Features
- Consistent design language
- Smooth animations with Framer Motion
- Tailwind CSS styling
- Responsive layout
- Loading states
- Error handling
- Accessibility features

## 🎨 Design System

### Colors
- **Primary**: #3b82f6 (Blue)
- **Secondary**: #10b981 (Green)
- **Accent**: #f59e0b (Amber)
- **Background**: Smooth gradients
- **Text**: High contrast for readability

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Sizes**: Responsive scaling

### Layout
- **Container**: Max width 6xl (72rem)
- **Spacing**: Consistent 4px increments
- **Border Radius**: 10-20px for modern look
- **Shadows**: Subtle, layered shadows

### Animations
- **Fade In**: 0.5s ease-in-out
- **Slide Up**: 0.5s ease-out
- **Slide In**: 0.3s ease-out
- **Staggered**: Delayed animations for lists

## 🔌 Backend Connection

The frontend connects to a FastAPI backend at `http://localhost:8000/api` by default.

### Environment Variables
Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### API Endpoints
- `GET /api/health` - Health check
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document
- `PUT /api/documents/{id}/status` - Update document status
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/chat` - Send chat message
- `POST /api/chat/start` - Start new chat
- `GET /api/chat/history/{sessionId}` - Get chat history
- `GET /api/teacher/stats` - Get teacher stats
- `GET /api/teacher/flagged` - Get flagged responses
- `PUT /api/teacher/flagged/{id}` - Review flagged response

## 📦 Dependencies

- **Next.js**: React framework
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS
- **Framer Motion**: Animations
- **React Markdown**: Render markdown in messages
- **React Feather**: Icon library

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build the image
docker build -t ai-learning-frontend .

# Run the container
docker run -p 3000:3000 ai-learning-frontend
```

### Manual Deployment

1. Build the app: `npm run build`
2. Copy `.next` folder to your server
3. Serve with Node.js: `node server.js`

## 🎯 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## 🐛 Troubleshooting

### "Module not found"
```bash
npm install
```

### "Port already in use"
```bash
# Change port by setting PORT environment variable
PORT=3001 npm run dev
```

### "Backend not connected"
1. Make sure backend is running: `cd backend && uvicorn main:app --reload`
2. Check API URL in `.env.local`
3. Verify CORS settings in backend

### "Styles not loading"
```bash
npm run dev  # Make sure you're using dev server
```

## 📝 License

MIT License - Feel free to use this code for your projects!

## 🙏 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions or issues:
- Check the documentation
- Review the example code
- Ask in the community forum (if available)

---

**Version**: 1.0.0  
**Last Updated**: October 2024  
**Status**: ✅ Ready for Production
