import subprocess
import sys
import time

def print_banner():
    print("=" * 60)
    print("🚀 Starting MuleShield AI (Frontend, Backend, Databases) 🚀")
    print("=" * 60)
    print("This script uses Docker Compose to launch the entire stack.")
    print("Please ensure Docker Desktop is running in the background.\n")

def main():
    print_banner()
    
    try:
        # Run docker compose up in detached mode
        print("Executing: docker compose up -d")
        result = subprocess.run(["docker", "compose", "up", "-d"], check=True)
        
        print("\n✅ All services have been successfully started!")
        print("🌐 Frontend App: http://localhost:3000")
        print("🔌 Backend API Gateway: http://localhost:8000")
        print("\nTo stop the project later, you can run: docker compose down")
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error: Failed to start the Docker containers. (Exit code: {e.returncode})")
        print("Make sure Docker Desktop is open and running.")
        sys.exit(1)
    except FileNotFoundError:
        print("\n❌ Error: Docker is not installed or not added to your system PATH.")
        print("Please install Docker Desktop and try again.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
