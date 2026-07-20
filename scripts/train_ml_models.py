import os
import pickle
import random
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.ensemble import IsolationForest

def generate_synthetic_data(num_normal=2000, num_mules=500):
    data = []
    labels = []
    
    # feature order MUST match ml_service.py
    feature_names = [
        "txn_count_24h", "incoming_amt_24h", "outgoing_amt_24h",
        "avg_balance_7d", "avg_holding_time_minutes", "unique_senders_30d",
        "unique_receivers_30d", "pct_night_txns", "device_change_count_7d",
        "new_device_flag", "location_change_flag", "kyc_mismatch_flag",
        "income_to_txn_ratio", "days_since_account_open", "dormancy_then_spike_flag"
    ]
    
    # Generate Normal Accounts (Class 0)
    for _ in range(num_normal):
        row = [
            random.randint(1, 10),                            # txn_count_24h
            round(random.uniform(100, 1000), 2),              # incoming_amt_24h
            round(random.uniform(50, 900), 2),                # outgoing_amt_24h
            round(random.uniform(500, 5000), 2),              # avg_balance_7d
            round(random.uniform(1440, 10000), 1),            # avg_holding_time_minutes
            random.randint(1, 3),                             # unique_senders_30d
            random.randint(1, 5),                             # unique_receivers_30d
            round(random.uniform(0.0, 0.1), 3),               # pct_night_txns
            random.randint(0, 1),                             # device_change_count_7d
            0,                                                # new_device_flag
            0,                                                # location_change_flag
            0,                                                # kyc_mismatch_flag
            round(random.uniform(0.01, 0.1), 3),              # income_to_txn_ratio
            random.randint(100, 1000),                        # days_since_account_open
            0                                                 # dormancy_then_spike_flag
        ]
        data.append(row)
        labels.append(0)
        
    # Generate Mule Accounts (Class 1)
    for _ in range(num_mules):
        row = [
            random.randint(10, 50),                           # txn_count_24h
            round(random.uniform(5000, 20000), 2),            # incoming_amt_24h
            round(random.uniform(5000, 20000), 2),            # outgoing_amt_24h
            round(random.uniform(10, 100), 2),                # avg_balance_7d
            round(random.uniform(1, 30), 1),                  # avg_holding_time_minutes
            random.randint(5, 20),                            # unique_senders_30d
            random.randint(5, 20),                            # unique_receivers_30d
            round(random.uniform(0.3, 0.8), 3),               # pct_night_txns
            random.randint(2, 10),                            # device_change_count_7d
            random.choice([0, 1]),                            # new_device_flag
            1,                                                # location_change_flag
            1,                                                # kyc_mismatch_flag
            round(random.uniform(1.0, 10.0), 3),              # income_to_txn_ratio
            random.choice([random.randint(1, 10), random.randint(500, 1000)]), # days_since_account_open
            random.choice([0, 1])                             # dormancy_then_spike_flag
        ]
        data.append(row)
        labels.append(1)
        
    df = pd.DataFrame(data, columns=feature_names)
    y = np.array(labels)
    
    return df, y

def train_and_save_models():
    print("Generating synthetic data...")
    X, y = generate_synthetic_data(num_normal=5000, num_mules=1000)
    print(f"Data shape: {X.shape}, Labels shape: {y.shape}")
    
    # 1. Train XGBoost Supervised Classifier
    print("Training XGBoost Classifier...")
    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    xgb_model.fit(X, y)
    print(f"XGBoost Training Accuracy: {xgb_model.score(X, y):.4f}")
    
    # 2. Train Isolation Forest (Unsupervised Anomaly Detector)
    print("Training Isolation Forest Anomaly Detector...")
    # Train only on normal data for isolation forest
    X_normal = X[y == 0]
    iforest = IsolationForest(
        n_estimators=100,
        contamination=0.05, # Expecting 5% anomalies
        random_state=42
    )
    iforest.fit(X_normal)
    
    # Create models directory
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ai", "models"))
    os.makedirs(model_dir, exist_ok=True)
    
    xgb_path = os.path.join(model_dir, "xgb_mule_detector.pkl")
    iforest_path = os.path.join(model_dir, "iforest_anomaly.pkl")
    
    print(f"Saving models to {model_dir}...")
    with open(xgb_path, "wb") as f:
        pickle.dump(xgb_model, f)
    
    with open(iforest_path, "wb") as f:
        pickle.dump(iforest, f)
        
    print("Models trained and saved successfully!")

if __name__ == "__main__":
    train_and_save_models()
