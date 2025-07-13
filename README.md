# Aldacore - AI-Powered Resource Forecasting Platform

A full-stack MVP for construction and logistics project managers to predict resource needs using AI forecasting.

## 🚀 Features

- **Real-time Resource Forecasting**: Predict materials, equipment, and resource needs
- **Project Management**: Create and manage construction projects
- **AI-Powered Predictions**: Machine learning-based forecasting (mock implementation)
- **Responsive Dashboard**: Clean, intuitive interface for project managers
- **JWT Authentication**: Secure user authentication system

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python) + SQLAlchemy
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **ML Layer**: scikit-learn (mock implementation)

## 📁 Project Structure

```
aldacore/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
├── database/               # Database migrations and setup
└── docs/                   # Documentation
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 13+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Create PostgreSQL database
createdb aldacore_db

# Run migrations (after backend setup)
cd backend
alembic upgrade head
```

## 🔧 Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost/aldacore_db
SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:8000
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Forecasts
- `POST /api/forecasts/generate` - Generate resource forecast
- `GET /api/forecasts/{project_id}` - Get project forecasts

## 🧪 Mock AI Implementation

The current version uses mock forecasting logic that:
- Analyzes project phases and durations
- Applies historical usage patterns
- Generates realistic resource predictions
- Provides confidence levels for each prediction

This can be easily replaced with real ML models in the future.

## 🚀 Deployment

### Docker (Recommended)
```bash
docker-compose up --build
```

### Manual Deployment
1. Set up production database
2. Configure environment variables
3. Build frontend: `npm run build`
4. Deploy backend to your preferred hosting service
5. Serve frontend build files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details