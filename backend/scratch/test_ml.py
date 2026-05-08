import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from ml.enhanced_fraud_detector import EnhancedFraudDetector
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)

def test_init():
    print("Testing EnhancedFraudDetector initialization...")
    try:
        detector = EnhancedFraudDetector()
        print("Success!")
        
        # Test feature extraction
        dummy_result = {
            'basic_metrics': {
                'total_received_btc': 1.0,
                'total_sent_btc': 0.8,
                'balance_btc': 0.2,
                'transaction_count': 10
            },
            'transaction_patterns': {
                'rapid_movement_count': 1,
                'amount_statistics': {'round_amounts': 2}
            },
            'temporal_analysis': {
                'transaction_frequency': {'time_span_days': 5}
            }
        }
        features = detector._extract_features(dummy_result)
        print(f"Extracted features shape: {features.shape}")
        print(f"Features: {features}")
        assert features.shape[0] == 20
        print("Feature extraction test passed!")
        
    except Exception as e:
        print(f"Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_init()
