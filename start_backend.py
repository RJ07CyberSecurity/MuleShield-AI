import subprocess
import sys
import os
import time

print("MuleShield AI - Starting Backend Local Stack (Zero-Dependency SQLite Mode)")

# 1. Install pip dependencies
dependencies = [
    "fastapi",
    "uvicorn",
    "pydantic",
    "pydantic-settings",
    "structlog",
    "sqlalchemy",
    "aiosqlite",
    "httpx",
    "bcrypt",
    "pyjwt",
    "cryptography",
    "python-multipart"
]

print("Installing required Python packages...")
try:
    subprocess.check_call([sys.executable, "-m", "pip", "install"] + dependencies)
    print("Dependencies successfully verified.")
except Exception as e:
    print(f"Error installing dependencies: {e}")
    sys.exit(1)

# 2. Add 'backend/shared' to Python environment path
shared_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "shared"))
print(f"Installing shared library in develop mode from: {shared_dir}")
try:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-e", shared_dir])
    print("Shared library registered successfully.")
except Exception as e:
    print(f"Error installing shared package: {e}")
    sys.exit(1)

# 3. Start services as separate processes
services = [
    {
        "name": "Auth Service",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8001"],
        "cwd": os.path.join("backend", "services", "auth-service")
    },
    {
        "name": "Customer Service",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8002"],
        "cwd": os.path.join("backend", "services", "customer-service")
    },
    {
        "name": "Account Service",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8003"],
        "cwd": os.path.join("backend", "services", "account-service")
    },
    {
        "name": "Ingestion Service",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8004"],
        "cwd": os.path.join("backend", "services", "ingestion-service")
    },
    {
        "name": "Detection Engine",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8005"],
        "cwd": os.path.join("backend", "services", "detection-engine")
    },
    {
        "name": "Reporting Service",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8006"],
        "cwd": os.path.join("backend", "services", "reporting-service")
    },
    {
        "name": "API Gateway",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        "cwd": os.path.join("backend", "services", "gateway")
    }
]

processes = []
print("Launching backend services...")
for s in services:
    cwd_path = os.path.abspath(os.path.join(os.path.dirname(__file__), s["cwd"]))
    print(f"Starting {s['name']} in {cwd_path}...")
    
    env = os.environ.copy()
    env["PYTHONPATH"] = shared_dir
    
    log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), f"{s['name'].lower().replace(' ', '_')}.log"))
    log_file = open(log_path, "w", encoding="utf-8")
    p = subprocess.Popen(
        s["cmd"],
        cwd=cwd_path,
        env=env,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append((s["name"], p))
    time.sleep(1.5)  # Allow port binding buffer

print("\n" + "="*50)
print("All microservices launched successfully!")
print("API Gateway Router: http://localhost:8000")
print("Auth Service Core:   http://localhost:8001")
print("Customer Onboard:   http://localhost:8002")
print("Account Registry:   http://localhost:8003")
print("Ingestion Service:  http://localhost:8004")
print("Detection Engine:   http://localhost:8005")
print("Reporting Service:  http://localhost:8006")
print("="*50)
print("Keep this script running to retain backend connections.")

try:
    while True:
        # Check if any service crashed
        for name, p in processes:
            poll = p.poll()
            if poll is not None:
                print(f"\nWARNING: {name} process exited unexpectedly with code {poll}!")
                log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), f"{name.lower().replace(' ', '_')}.log"))
                if os.path.exists(log_path):
                    with open(log_path, "r", encoding="utf-8") as lf:
                        print(f"Process logs:\n{lf.read()[-3000:]}") # Show last 3000 chars of logs
                sys.exit(poll)
        time.sleep(2)
except KeyboardInterrupt:
    print("\nStopping services...")
    for name, p in processes:
        print(f"Terminating {name}...")
        p.terminate()
        p.wait()
    print("Backend stopped.")
