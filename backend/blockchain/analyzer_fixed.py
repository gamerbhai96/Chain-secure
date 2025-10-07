"""
Fixed version of fraud detection with adjusted thresholds to reduce false positives
"""

class FixedBlockchainAnalyzer:
    
    async def _detect_fraud_signals(self, analysis_data: Dict) -> Dict:
        """
        Detect fraud signals with adjusted thresholds
        """
        fraud_signals = {
            'burst_activity': False,
            'high_fan_out': False,
            'round_amount_transactions': False,
            'high_centrality': False,
            'overall_fraud_score': 0.0,
            'risk_level': 'LOW'
        }
        
        # Updated thresholds
        if analysis_data.get('burst_count', 0) > 5:  # Increased from 2
            fraud_signals['burst_activity'] = True
            
        if analysis_data.get('unique_outputs', 0) > 100:  # Increased from 50
            fraud_signals['high_fan_out'] = True
            
        if analysis_data.get('round_amounts', 0) / max(analysis_data.get('tx_count', 1), 1) > 0.5:  # Increased from 0.3
            fraud_signals['round_amount_transactions'] = True
            
        if analysis_data.get('betweenness', 0) > 0.25:  # Increased from 0.1
            fraud_signals['high_centrality'] = True
            
        return fraud_signals
