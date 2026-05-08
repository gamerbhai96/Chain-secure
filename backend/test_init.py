import sys
import traceback
sys.path.append('d:/bitscan/backend')

from ml.enhanced_fraud_detector import EnhancedFraudDetector

try:
    detector = EnhancedFraudDetector()
    print('Init success')
except Exception as e:
    print('Init failed:', e)
    traceback.print_exc()
