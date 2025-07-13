# Aldacore Project Structure

## Overview
Aldacore is a full-stack AI-powered resource forecasting platform built with React (TypeScript) frontend and FastAPI (Python) backend.

## Directory Structure

```
aldacore/
├── README.md                    # Main project documentation
├── PROJECT_STRUCTURE.md         # This file - detailed structure
├── setup.sh                     # Quick setup script
├── docker-compose.yml           # Docker orchestration
│
├── backend/                     # FastAPI Python Backend
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile              # Backend container
│   ├── .env.example            # Environment variables template
│   ├── alembic.ini             # Database migration config
│   │
│   ├── app/                    # Main application code
│   │   ├── main.py             # FastAPI app entry point
│   │   │
│   │   ├── core/               # Core configuration
│   │   │   ├── config.py       # Settings and configuration
│   │   │   ├── database.py     # Database connection
│   │   │   └── security.py     # JWT and password utilities
│   │   │
│   │   ├── api/                # API routes
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── projects.py     # Project CRUD endpoints
│   │   │   ├── forecasts.py    # Forecast generation endpoints
│   │   │   └── deps.py         # Dependency injection
│   │   │
│   │   ├── models/             # Database models
│   │   │   ├── user.py         # User model
│   │   │   ├── project.py      # Project and Forecast models
│   │   │   └── __init__.py     # Model imports
│   │   │
│   │   ├── schemas/            # Pydantic schemas
│   │   │   ├── user.py         # User data validation
│   │   │   ├── project.py      # Project data validation
│   │   │   └── __init__.py     # Schema imports
│   │   │
│   │   └── services/           # Business logic
│   │       └── forecast_service.py  # Mock AI forecasting
│   │
│   └── alembic/                # Database migrations
│       ├── env.py              # Migration environment
│       └── script.py.mako      # Migration template
│
├── frontend/                   # React TypeScript Frontend
│   ├── package.json            # Node.js dependencies
│   ├── Dockerfile             # Frontend container
│   ├── .env.example           # Environment variables template
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── postcss.config.js      # PostCSS configuration
│   │
│   ├── public/                # Static assets
│   │   └── index.html         # Main HTML file
│   │
│   └── src/                   # Source code
│       ├── index.tsx          # React app entry point
│       ├── index.css          # Global styles with Tailwind
│       ├── App.tsx            # Main app component with routing
│       │
│       ├── types/             # TypeScript definitions
│       │   └── index.ts       # All type definitions
│       │
│       ├── contexts/          # React contexts
│       │   └── AuthContext.tsx # Authentication state management
│       │
│       ├── services/          # API services
│       │   └── api.ts         # HTTP client and API calls
│       │
│       ├── components/        # Reusable UI components
│       │   └── Layout.tsx     # Main layout with navigation
│       │
│       └── pages/             # Page components
│           ├── Login.tsx      # Login page
│           ├── Register.tsx   # Registration page
│           ├── Dashboard.tsx  # Main dashboard
│           ├── Projects.tsx   # Projects list
│           └── Settings.tsx   # User settings
│
└── docs/                      # Additional documentation
    └── (future documentation)
```

## Key Components

### Backend (FastAPI)

#### Core Modules
- **config.py**: Centralized configuration using Pydantic settings
- **database.py**: SQLAlchemy database connection and session management
- **security.py**: JWT token handling and password hashing

#### API Routes
- **auth.py**: User registration and login endpoints
- **projects.py**: CRUD operations for projects
- **forecasts.py**: AI forecasting generation and retrieval
- **deps.py**: Dependency injection for authentication

#### Models & Schemas
- **User**: User account management
- **Project**: Construction project data
- **Forecast**: AI-generated resource predictions
- **Pydantic schemas**: Data validation and serialization

#### Services
- **forecast_service.py**: Mock AI implementation for resource forecasting

### Frontend (React + TypeScript)

#### Core Architecture
- **TypeScript**: Strong typing throughout the application
- **React Router**: Client-side routing with protected routes
- **Context API**: Global state management for authentication
- **Axios**: HTTP client for API communication

#### Components
- **Layout**: Main application shell with navigation
- **AuthContext**: Authentication state management
- **Pages**: Individual page components for each route

#### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom components**: Reusable styled components
- **Responsive design**: Mobile-first approach

## Database Schema

### Users Table
```sql
- id (Primary Key)
- email (Unique)
- username (Unique)
- full_name
- hashed_password
- is_active
- created_at
- updated_at
```

### Projects Table
```sql
- id (Primary Key)
- name
- description
- start_date
- end_date
- status
- project_data (JSON)
- user_id (Foreign Key)
- created_at
- updated_at
```

### Forecasts Table
```sql
- id (Primary Key)
- project_id (Foreign Key)
- forecast_data (JSON)
- confidence_level
- generated_at
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Forecasts
- `POST /api/forecasts/generate` - Generate resource forecast
- `GET /api/forecasts/{project_id}` - Get project forecasts
- `GET /api/forecasts/{project_id}/latest` - Get latest forecast

## Development Workflow

### Local Development
1. Clone the repository
2. Run `./setup.sh` for Docker setup
3. Access frontend at http://localhost:3000
4. Access backend API at http://localhost:8000
5. View API docs at http://localhost:8000/docs

### Manual Setup
1. Set up PostgreSQL database
2. Install Python dependencies: `pip install -r backend/requirements.txt`
3. Install Node.js dependencies: `npm install` (in frontend directory)
4. Configure environment variables
5. Run database migrations: `alembic upgrade head`
6. Start backend: `uvicorn app.main:app --reload`
7. Start frontend: `npm start`

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migration tool
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **Pydantic**: Data validation
- **scikit-learn**: Mock ML implementation

### Frontend
- **React 18**: UI library
- **TypeScript**: Type safety
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Tailwind CSS**: Styling framework
- **Context API**: State management

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **PostgreSQL**: Database container

## Future Enhancements

### Planned Features
- Real ML model integration
- Advanced project templates
- Resource cost estimation
- Team collaboration features
- Mobile application
- Advanced analytics dashboard
- Integration with construction management software
- Real-time notifications
- Advanced reporting

### Technical Improvements
- Unit and integration tests
- CI/CD pipeline
- Performance monitoring
- Advanced caching
- Microservices architecture
- Real-time WebSocket communication