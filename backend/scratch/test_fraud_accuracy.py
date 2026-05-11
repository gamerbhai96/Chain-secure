"""
Test script to verify fraud detection model accuracy.
Tests known fraud and legitimate wallet patterns to ensure correct risk classification.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.chdir(os.path.join(os.path.dirname(__file__), '..'))

import logging
logging.basicConfig(level=logging.WARNING)  # Suppress verbose logs during test
logger = logging.getLogger(__name__)

print("=" * 70)
print("FRAUD DETECTION ACCURACY TEST")
print("=" * 70)

print("\n[1/2] Initializing EnhancedFraudDetector...")
from ml.enhanced_fraud_detector import EnhancedFraudDetector
detector = EnhancedFraudDetector()
print("      ✅ Detector initialized\n")

# ─── Test Cases ───────────────────────────────────────────────────────
test_cases = []

# === FRAUD WALLETS (should be ELEVATED / HIGH / CRITICAL) ===

test_cases.append({
    'name': 'Exit Scam — massive drain',
    'expected_risk': 'HIGH+',
    'analysis': {
        'address': '1FraudExitScam111111111111111111',
        'basic_metrics': {
            'transaction_count': 250,
            'total_received_btc': 500.0,
            'total_sent_btc': 499.5,
            'balance_btc': 0.5,
        },
        'transaction_patterns': {
            'rapid_movement_count': 30,
            'amount_statistics': {'round_amounts': 15},
        },
        'temporal_analysis': {
            'transaction_frequency': {'time_span_days': 5},
        },
        'fraud_signals': {
            'overall_fraud_score': 0.65,
            'mixing_service_usage': True,
            'rapid_fund_movement': True,
            'high_fan_out': True,
            'detailed_flags': ['Near-complete fund drainage detected', 'High turnover ratio'],
        },
    },
})

test_cases.append({
    'name': 'Ponzi Scheme — high volume, drained',
    'expected_risk': 'HIGH+',
    'analysis': {
        'address': '1FraudPonzi2222222222222222222222',
        'basic_metrics': {
            'transaction_count': 5000,
            'total_received_btc': 1200.0,
            'total_sent_btc': 1199.0,
            'balance_btc': 1.0,
        },
        'transaction_patterns': {
            'rapid_movement_count': 200,
            'amount_statistics': {'round_amounts': 50},
        },
        'temporal_analysis': {
            'transaction_frequency': {'time_span_days': 90},
        },
        'fraud_signals': {
            'overall_fraud_score': 0.70,
            'rapid_fund_movement': True,
            'high_fan_out': True,
            'burst_activity': True,
            'detailed_flags': ['High turnover ratio suggests rapid fund movement', 'Near-complete fund drainage detected'],
        },
    },
})

test_cases.append({
    'name': 'Mixer Service — rapid churn',
    'expected_risk': 'ELEVATED+',
    'analysis': {
        'address': '1FraudMixer33333333333333333333',
        'basic_metrics': {
            'transaction_count': 800,
            'total_received_btc': 50.0,
            'total_sent_btc': 49.5,
            'balance_btc': 0.05,
        },
        'transaction_patterns': {
            'rapid_movement_count': 100,
            'amount_statistics': {'round_amounts': 5},
        },
        'temporal_analysis': {
            'transaction_frequency': {'time_span_days': 30},
        },
        'fraud_signals': {
            'overall_fraud_score': 0.50,
            'mixing_service_usage': True,
            'rapid_fund_movement': True,
            'detailed_flags': ['Extremely low balance retention'],
        },
    },
})

test_cases.append({
    'name': 'Ransomware — small amounts, quick drain',
    'expected_risk': 'ELEVATED+',
    'analysis': {
        'address': '1FraudRansom44444444444444444444',
        'basic_metrics': {
            'transaction_count': 150,
            'total_received_btc': 8.0,
            'total_sent_btc': 7.95,
            'balance_btc': 0.05,
        },
        'transaction_patterns': {
            'rapid_movement_count': 20,
            'amount_statistics': {'round_amounts': 8},
        },
        'temporal_analysis': {
            'transaction_frequency': {'time_span_days': 14},
        },
        'fraud_signals': {
            'overall_fraud_score': 0.45,
            'rapid_fund_movement': True,
            'detailed_flags': ['Near-complete fund drainage detected'],
        },
    },
})

# === LEGITIMATE WALLETS (should be LOW / VERY_LOW / MINIMAL) ===

test_cases.append({
    'name': 'Legitimate Personal Wallet',
    'expected_risk': 'LOW-',
    'analysis': {
        'address': '1LegitPersonal555555555555555555',
        'basic_metrics': {
            'transaction_count': 25,
            'total_received_btc': 2.5,
            'total_sent_btc': 1.0,
            'balance_btc': 1.5,
        },
        'transaction_patterns': {
            'rapid_movement_count': 0,
            'amount_statistics': {'round_amounts': 2},
        },
        'temporal_analysis': {
            'transaction_frequency': {'time_span_days': 500},
        },
        'fraud_signals': {
            'overall_fraud_score': 0.0,
        },
    },
})

test_cases.append({
    'name': 'Legitimate HODLer',
    'expected_risk': 'LOW-',
    'analysis': {
        'address': '1LegitHodler66666666666666666666',
        'basic_metrics': {
            'transaction_count': 5,
            'total_received_btc': 10.0,
            'total_sent_btc': 1.0,
            'balance_btc': 9.0,
        },
        'transaction_patterns': {
            'rapid_movement_count': 0,
            'amount_statistics': {'round_amounts': 1},
        },
        'temporal_analysis': {
            'transaction_frequency': {'time_span_days': 1200},
        },
        'fraud_signals': {
            'overall_fraud_score': 0.0,
        },
    },
})

test_cases.append({
    'name': 'Legitimate Exchange (high volume, retains balance)',
    'expected_risk': 'LOW-',
    'analysis': {
        'address': '1LegitExchange777777777777777777',
        'basic_metrics': {
            'transaction_count': 50000,
            'total_received_btc': 100000.0,
            'total_sent_btc': 85000.0,
            'balance_btc': 15000.0,
        },
        'transaction_patterns': {
            'rapid_movement_count': 500,
            'amount_statistics': {'round_amounts': 100},
        },
        'temporal_analysis': {
            'transaction_frequency': {'time_span_days': 2000},
        },
        'fraud_signals': {
            'overall_fraud_score': 0.1,
            'high_centrality': True,
        },
    },
})

test_cases.append({
    'name': 'Legitimate Merchant',
    'expected_risk': 'LOW-',
    'analysis': {
        'address': '1LegitMerchant8888888888888888',
        'basic_metrics': {
            'transaction_count': 200,
            'total_received_btc': 30.0,
            'total_sent_btc': 20.0,
            'balance_btc': 10.0,
        },
        'transaction_patterns': {
            'rapid_movement_count': 5,
            'amount_statistics': {'round_amounts': 10},
        },
        'temporal_analysis': {
            'transaction_frequency': {'time_span_days': 600},
        },
        'fraud_signals': {
            'overall_fraud_score': 0.05,
        },
    },
})

# ─── Run Tests ────────────────────────────────────────────────────────
HIGH_RISK_LEVELS = {'ELEVATED', 'HIGH', 'CRITICAL'}
LOW_RISK_LEVELS = {'VERY_LOW', 'MINIMAL', 'LOW', 'MEDIUM'}

print("[2/2] Running test cases...\n")
passed = 0
failed = 0

for tc in test_cases:
    result = detector.predict_fraud_probability(tc['analysis'])
    risk_level = result['risk_level']
    prob = result['fraud_probability']
    
    if tc['expected_risk'].endswith('+'):
        # Fraud wallet: must be ELEVATED, HIGH, or CRITICAL
        ok = risk_level in HIGH_RISK_LEVELS
    else:
        # Legitimate wallet: must be LOW, MINIMAL, VERY_LOW, or MEDIUM
        ok = risk_level in LOW_RISK_LEVELS
    
    status = "✅ PASS" if ok else "❌ FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    
    print(f"  {status}  {tc['name']}")
    print(f"         Expected: {tc['expected_risk']}  |  Got: {risk_level} (prob={prob:.3f})")
    print()

print("=" * 70)
print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
if failed == 0:
    print("🎉 ALL TESTS PASSED — Fraud detection is working correctly!")
else:
    print("⚠️  SOME TESTS FAILED — Model needs further tuning.")
print("=" * 70)
