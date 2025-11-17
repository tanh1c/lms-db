# LMS Frontend

Frontend application for Learning Management System built with React, TypeScript, and Vite.

## Features

- Authentication with role-based access control (Student, Tutor, Admin)
- Role-specific dashboards with analytics
- Course management and enrollment
- Assignment submission and tracking
- Quiz system with timer
- Grade management and viewing
- Schedule calendar with notes
- Profile management and theme customization
- Dark mode support
- Responsive design

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for component library
- React Router v7 for routing
- Zustand for state management
- GSAP for animations

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable components
│   ├── ui/        # shadcn/ui components
│   ├── layout/    # Layout components
│   └── theme/     # Theme customization
├── pages/         # Page components
├── lib/           # Utilities and API services
├── store/         # Zustand state management
├── context/       # React contexts
└── styles/        # Global styles
```

## Mock Accounts

- Student: University_ID `100001` or `100002` (any password)
- Tutor: University_ID `200001` (any password)
- Admin: University_ID `3000001` (any password)

## Notes

- Current implementation uses mock data with simulated API delays
- Theme preferences are stored in localStorage
- Authentication state persists in localStorage

## License

MIT
