import subprocess
import sys
import os
import time

def main():
    print("=" * 60)
    print("🚀 Starting MuleShield AI (Frontend & Backend - LOCAL MODE) 🚀")
    print("=" * 60)
    
    processes = []
    base_dir = os.path.abspath(os.path.dirname(__file__))
    
    # 1. Start Backend
    print("\n[1/2] Launching Backend Services...")
    backend_p = subprocess.Popen(
        [sys.executable, "start_backend.py"],
        cwd=base_dir,
        stdout=sys.stdout,
        stderr=subprocess.STDOUT
    )
    processes.append(("Backend Stack", backend_p))
    
    # Wait a few seconds for backend to initialize and bind ports
    time.sleep(5)
    
    # 2. Start Frontend
    print("\n[2/2] Launching Web Frontend...")
    frontend_dir = os.path.join(base_dir, "apps", "web")
    
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    frontend_p = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir,
        stdout=sys.stdout,
        stderr=subprocess.STDOUT
    )
    processes.append(("Web Frontend", frontend_p))
    
    print("\n" + "="*50)
    print("✅ Local environment started successfully!")
    print("🌐 Frontend App: http://localhost:3000")
    print("🔌 Backend API Gateway: http://localhost:8000")
    print("Press Ctrl+C to stop everything.")
    print("="*50 + "\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping services...")
        for name, p in processes:
            print(f"Terminating {name}...")
            # For Windows, sometimes terminate() doesn't kill child processes of batch scripts cleanly
            # but this is the safest built-in method.
            p.terminate()
            p.wait(timeout=5)
        print("Everything stopped successfully.")

if __name__ == "__main__":
    main()
