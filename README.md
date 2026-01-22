# Malnutrition & Mental Health Program Management System

A comprehensive web application for managing malnutrition and Mental Health programs, built with Next.js. This system helps healthcare professionals track patient assessments, generate reports, and manage patient data efficiently.

## Features

### 🔐 Authentication & User Management

- Secure user registration and login
- Profile management and session handling
- Role-based access control (Admin/User)

### 👥 Patient Management

- Add and manage patient records
- Advanced patient search functionality
- Bulk patient operations (import/export)
- Patient history tracking
- Data export capabilities (CSV)

### 📊 Assessment & Monitoring

- Comprehensive malnutrition assessment tools
- Historical assessment data tracking
- Progress monitoring and analytics

### 📈 Dashboard & Reporting

- Interactive dashboard with key metrics
- Data visualization with charts
- Comprehensive reporting system
- Exportable reports for stakeholders

### 🔄 Offline Support

- Offline data queue for synchronization
- Automatic data syncing when online
- Reliable data persistence

### 🎨 User Experience

- Modern, responsive design
- Dark/Light theme toggle
- Intuitive admin sidebar navigation
- Mobile-friendly interface

### 🛠️ Technical Features

- RESTful API endpoints
- Real-time data updates
- Secure authentication system
- Optimized performance with Next.js

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React, JavaScript
- **Styling:** CSS Modules, PostCSS
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT-based auth
- **Linting:** ESLint
- **Build Tool:** Next.js built-in

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, pnpm, or bun
- MongoDB database

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd malnutrition-program
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/             # API routes
│   │   ├── auth/        # Authentication endpoints
│   │   └── patients/    # Patient management endpoints
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard pages
│   └── patients/        # Patient management pages
├── components/          # Reusable React components
├── lib/                 # Utility libraries
│   ├── auth.js          # Authentication utilities
│   ├── db.js            # Database connection
│   └── offlineQueue.js  # Offline data management
├── models/              # Database models
├── public/              # Static assets
└── store/               # State management
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

### Patients

- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/search` - Search patients
- `POST /api/patients/bulk` - Bulk operations
- `GET /api/patients/export` - Export patient data
- `GET /api/patients/[id]/history` - Get patient history

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email chonchol57@gmail.com or create an issue in this repository.
