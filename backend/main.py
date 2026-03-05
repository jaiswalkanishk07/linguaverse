import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Router imports (Commented out until we build the respective files)
from routes import inventory, sales, khata, suppliers, reports, agent

app = FastAPI(
    title="MSME Management API",
    description="Backend API for B2B Inventory, Sales, and AI Agent parsing",
    version="1.0.0"
)

# CORS Configuration — open for hackathon demo
# In production, restrict to specific domains via FRONTEND_URL env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root / Health Check Endpoint
@app.get("/")
def health_check():
    return {
        "status": "online", 
        "message": "MSME Backend API is running securely."
    }

# Register Routers (To be uncommented as we complete Steps 3-8)
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(sales.router, prefix="/sales", tags=["Sales"])
app.include_router(khata.router, prefix="/khata", tags=["Khata"])
app.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(agent.router, prefix="/agent", tags=["AI Agent"])