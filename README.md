# Aldacore - AI-Powered Resource Forecasting Platform

A full-stack MVP for web-based AI-powered resource forecasting designed for the construction and logistics industry. Enables project managers to see real-time predictions of materials, equipment, and resources needed at each project stage.

## 🚀 Features

- **Authentication**: Secure JWT-based login/signup system
- **Project Management**: Create, view, and edit construction projects
- **Resource Forecasting**: AI-powered predictions for materials and equipment needs
- **Real-time Dashboard**: Overview of all projects and their status
- **Responsive Design**: Clean, intuitive interface optimized for project managers

## 🔧 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python 3.11
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **ML Layer**: Mock forecasting logic (ready for scikit-learn integration)

## 📁 Project Structure

```
aldacore/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── db/             # Database models and setup
│   │   ├── ml/             # ML forecasting logic
│   │   └── main.py         # FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml      # Multi-container setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repo-url>
cd aldacore
```

2. Start all services:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔐 Authentication

The platform uses JWT-based authentication. Default test credentials:
- Email: `admin@aldacore.com`
- Password: `admin123`

## 📊 API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `POST /api/forecasts/predict` - Generate resource forecast

## 🤖 Forecasting Engine

The current implementation includes mock forecasting logic that simulates AI predictions based on:
- Project phases (foundation, framing, finishing)
- Task duration and complexity
- Historical usage patterns (mocked)
- Resource types (materials, equipment, labor)

The system is designed to easily integrate with real ML models using scikit-learn or other frameworks.

## 🎨 UI/UX Design

- Clean, minimal interface designed for project managers
- Responsive design that works on desktop, tablet, and mobile
- Loading states and comprehensive error handling
- Intuitive navigation with clear visual hierarchy

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

The application is containerized and ready for deployment on any Docker-compatible platform:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Kubernetes clusters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.