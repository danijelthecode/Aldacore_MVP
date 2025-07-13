#!/bin/bash

echo "🚀 Setting up Aldacore - AI-Powered Resource Forecasting Platform"
echo "================================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create environment files if they don't exist
echo "📝 Creating environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

# Build and start the application
echo "🏗️ Building and starting the application..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ All services are running!"
    echo ""
    echo "🎉 Aldacore is now running!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📊 API Documentation: http://localhost:8000/docs"
    echo ""
    echo "📝 Next steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Create a new account or sign in"
    echo "3. Start creating your first project!"
    echo ""
    echo "🛠️ To stop the application, run: docker-compose down"
    echo "🔄 To view logs, run: docker-compose logs -f"
else
    echo "❌ Some services failed to start. Check the logs with: docker-compose logs"
    exit 1
fi