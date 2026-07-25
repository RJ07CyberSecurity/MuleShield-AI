from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter(prefix="/models", tags=["Models"])

class ModelDeployRequest(BaseModel):
    model_key: str
    mode: str
    canary_traffic: int

class ModelConstraintRequest(BaseModel):
    # Dummy fields for global constraints
    config_data: dict

@router.get("/metrics")
async def get_model_metrics(ingestion_id: str | None = None):
    """
    Returns metrics for ROC Curve, PR Curve, SHAP Feature Importance, and Covariate Feature Drift.
    """
    # Generating some variance for demonstration purposes
    if ingestion_id:
        random.seed(ingestion_id)
        variance = random.uniform(-0.06, 0.08)
    else:
        variance = random.uniform(-0.02, 0.02)
    
    return {
        "rocData": [
            {"fpr": 0.0, "tpr": 0.0},
            {"fpr": 0.1, "tpr": min(1.0, 0.5 + variance)},
            {"fpr": 0.2, "tpr": min(1.0, 0.8 + variance)},
            {"fpr": 0.4, "tpr": min(1.0, 0.92 + variance)},
            {"fpr": 0.6, "tpr": min(1.0, 0.96 + variance)},
            {"fpr": 0.8, "tpr": min(1.0, 0.98 + variance)},
            {"fpr": 1.0, "tpr": 1.0},
        ],
        "championChallengerData": [
            {"name": "0.0", "champion": 0.0, "challenger": 0.0},
            {"name": "0.2", "champion": min(1.0, 0.62 + variance), "challenger": min(1.0, 0.78 + variance)},
            {"name": "0.4", "champion": min(1.0, 0.84 + variance), "challenger": min(1.0, 0.91 + variance)},
            {"name": "0.6", "champion": min(1.0, 0.92 + variance), "challenger": min(1.0, 0.96 + variance)},
            {"name": "0.8", "champion": min(1.0, 0.96 + variance), "challenger": min(1.0, 0.98 + variance)},
            {"name": "1.0", "champion": 1.0, "challenger": 1.0},
        ],
        "driftData": [
            {"name": "Low Vel", "training": 45, "serving": 12 + int(variance * 100)},
            {"name": "Med Vel", "training": 60, "serving": 32 + int(variance * 100)},
            {"name": "High Vel", "training": 80, "serving": 54 + int(variance * 100)},
            {"name": "Max Vel", "training": 30, "serving": 75 + int(variance * 100)},
        ],
        "shapFeatures": [
            {"name": "TRANS_FREQ", "value": 85, "pts": "+0.24"},
            {"name": "VELOCITY_DELTA", "value": 65, "pts": "+0.18"},
            {"name": "SENDER_AGE_RISK", "value": 45, "pts": "+0.12"},
            {"name": "GEOLOC_ENTROPY", "value": 30, "pts": "+0.09"},
        ],
        "auc": round(0.984 + variance, 3),
        "map": round(0.941 + variance, 3),
        "psi": round(0.082 + abs(variance), 3)
    }

@router.get("/inventory")
async def get_model_inventory():
    """
    Returns the list of available classifiers and their deployment status.
    """
    return {
        "classifiers": [
            {
                "key": "MS-GCN-V4.1",
                "architecture": "Graph Convolutional Network (PyTorch)",
                "f1_score": "0.962",
                "recall": "94.1%",
                "release_date": "2026-06-11",
                "status": "ACTIVE"
            },
            {
                "key": "MS-GBDT-V3.8",
                "architecture": "Gradient Boosted Decision Trees (XGBoost)",
                "f1_score": "0.924",
                "recall": "88.5%",
                "release_date": "2025-12-04",
                "status": "SHADOW"
            }
        ]
    }

@router.post("/deploy")
async def deploy_model(request: ModelDeployRequest):
    """
    Endpoint to update model deployment strategy (e.g. set Canary traffic).
    """
    return {
        "status": "success",
        "message": f"Deployment initiated for {request.model_key} in {request.mode} mode with {request.canary_traffic}% traffic."
    }

@router.post("/constraints")
async def update_constraints(request: ModelConstraintRequest):
    """
    Endpoint to update global constraints.
    """
    return {
        "status": "success",
        "message": "Global constraints configuration successfully archived."
    }
