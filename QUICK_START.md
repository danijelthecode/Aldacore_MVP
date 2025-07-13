# 🚀 Quick Start Guide - Aldacore

Get Aldacore up and running in minutes!

## Prerequisites

- **Docker** and **Docker Compose** installed
- At least 4GB of available RAM
- Ports 3000 and 8000 available

## Option 1: One-Command Setup (Recommended)

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd aldacore

# Run the setup script
./setup.sh
```

That's it! The script will:
- ✅ Check Docker installation
- ✅ Create environment files
- ✅ Build and start all services
- ✅ Set up the database
- ✅ Verify everything is running

## Option 2: Manual Setup

### 1. Environment Setup
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start Services
```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps
```

### 3. Verify Installation
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## First Steps

1. **Open the application**: Navigate to http://localhost:3000
2. **Create an account**: Click "Sign up" and fill in your details
3. **Create your first project**: Click "New Project" from the dashboard
4. **Generate a forecast**: Add project phases and generate AI predictions

## Sample Project Data

Here's a sample project structure you can use for testing:

```json
{
  "name": "Office Building Construction",
  "description": "5-story office building with parking garage",
  "status": "planning",
  "project_data": {
    "phases": [
      {
        "name": "Foundation",
        "duration_weeks": 4,
        "phase_type": "foundation",
        "dependencies": []
      },
      {
        "name": "Framing",
        "duration_weeks": 8,
        "phase_type": "framing",
        "dependencies": ["Foundation"]
      },
      {
        "name": "Electrical",
        "duration_weeks": 6,
        "phase_type": "electrical",
        "dependencies": ["Framing"]
      },
      {
        "name": "Plumbing",
        "duration_weeks": 5,
        "phase_type": "plumbing",
        "dependencies": ["Framing"]
      },
      {
        "name": "Finishing",
        "duration_weeks": 4,
        "phase_type": "finishing",
        "dependencies": ["Electrical", "Plumbing"]
      }
    ],
    "total_duration_weeks": 27,
    "budget": 2500000,
    "location": "Downtown Business District"
  }
}
```

## Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up --build -d
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up --build -d
```

### Port Conflicts
If ports 3000 or 8000 are in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001
  - "8001:8000"  # Change 8000 to 8001
```

### Performance Issues
- Ensure Docker has at least 4GB RAM allocated
- Close other resource-intensive applications
- Consider running on SSD storage

## Development Mode

For development with hot reloading:

```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (database data)
docker-compose down -v
```

## Next Steps

- 📖 Read the [full documentation](README.md)
- 🔧 Explore the [project structure](PROJECT_STRUCTURE.md)
- 🚀 Check out the [API documentation](http://localhost:8000/docs)
- 💡 Learn about [future enhancements](PROJECT_STRUCTURE.md#future-enhancements)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs: `docker-compose logs -f`
3. Ensure all prerequisites are met
4. Try the manual setup option

---

**Happy forecasting! 🏗️📊**