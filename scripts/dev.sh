#!/bin/bash

# Aldacore Development Script
# This script helps you quickly start the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════╗"
    echo "║                   Aldacore                    ║"
    echo "║        AI-Powered Resource Forecasting       ║"
    echo "║             Development Script                ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are available"
}

# Check if ports are available
check_ports() {
    print_info "Checking if required ports are available..."
    
    PORTS=(3000 8000 5432)
    for port in "${PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            print_warning "Port $port is already in use. You may need to stop the service using it."
        else
            print_success "Port $port is available"
        fi
    done
}

# Start the application
start_app() {
    print_info "Starting Aldacore application..."
    
    # Build and start all services
    docker-compose up --build -d
    
    print_success "Application is starting up..."
    print_info "Waiting for services to be healthy..."
    
    # Wait for services to be healthy
    sleep 5
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Services are running!"
        echo ""
        echo "🚀 Aldacore is now running:"
        echo "   • Frontend: http://localhost:3000"
        echo "   • Backend API: http://localhost:8000"
        echo "   • API Documentation: http://localhost:8000/docs"
        echo ""
        echo "📋 Default credentials:"
        echo "   • Email: admin@aldacore.com"
        echo "   • Password: admin123"
        echo ""
        echo "📊 To view logs: docker-compose logs -f"
        echo "🛑 To stop: docker-compose down"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
    fi
}

# Stop the application
stop_app() {
    print_info "Stopping Aldacore application..."
    docker-compose down
    print_success "Application stopped"
}

# View logs
view_logs() {
    print_info "Viewing application logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Clean up
cleanup() {
    print_info "Cleaning up Aldacore application..."
    docker-compose down -v --rmi all
    print_success "Cleanup completed"
}

# Show status
show_status() {
    print_info "Aldacore application status:"
    docker-compose ps
}

# Show help
show_help() {
    echo "Aldacore Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the application (default)"
    echo "  stop      Stop the application"
    echo "  restart   Restart the application"
    echo "  logs      View application logs"
    echo "  status    Show application status"
    echo "  cleanup   Stop and remove all containers, volumes, and images"
    echo "  help      Show this help message"
    echo ""
}

# Main script logic
main() {
    print_banner
    
    case "${1:-start}" in
        start)
            check_docker
            check_ports
            start_app
            ;;
        stop)
            stop_app
            ;;
        restart)
            stop_app
            sleep 2
            check_docker
            start_app
            ;;
        logs)
            view_logs
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup
            ;;
        help)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"