
"""
Monkey-patching scikit-learn for compatibility with imbalanced-learn in newer versions.
Fixes:
1. ImportError: cannot import name '_is_pandas_df' from 'sklearn.utils.validation'
2. TypeError: AdaBoostClassifier.__init__() got an unexpected keyword argument 'algorithm'
"""

import sys
import logging
import inspect

logger = logging.getLogger(__name__)

def apply_patches():
    # 1. Patch sklearn.utils.validation._is_pandas_df
    try:
        import sklearn.utils.validation
        if not hasattr(sklearn.utils.validation, '_is_pandas_df'):
            def _is_pandas_df(X):
                """Internal helper for scikit-learn compatibility with imbalanced-learn."""
                return hasattr(X, "columns") and hasattr(X, "iloc")
            
            sklearn.utils.validation._is_pandas_df = _is_pandas_df
            # logger.info("Applied monkey-patch: sklearn.utils.validation._is_pandas_df")
    except ImportError:
        pass

    # 2. Patch AdaBoostClassifier to handle removed 'algorithm' argument
    try:
        from sklearn.ensemble import AdaBoostClassifier
        original_init = AdaBoostClassifier.__init__
        
        # Check if 'algorithm' is in the signature
        sig = inspect.signature(original_init)
        if 'algorithm' not in sig.parameters:
            def patched_init(self, *args, **kwargs):
                if 'algorithm' in kwargs:
                    # logger.debug("Removing deprecated/removed 'algorithm' argument from AdaBoostClassifier")
                    kwargs.pop('algorithm')
                return original_init(self, *args, **kwargs)
            
            AdaBoostClassifier.__init__ = patched_init
            # logger.info("Applied monkey-patch: AdaBoostClassifier.__init__")
    except ImportError:
        pass

# Apply immediately on import
apply_patches()
