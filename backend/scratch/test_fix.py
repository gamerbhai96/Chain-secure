
import sys
import os

# Try to import sklearn.utils.validation
try:
    import sklearn.utils.validation
    print(f"sklearn.utils.validation imported. hasattr(_is_pandas_df): {hasattr(sklearn.utils.validation, '_is_pandas_df')}")
    
    # Check if we can import imblearn
    try:
        from imblearn.over_sampling import SMOTE
        print("imblearn imported successfully")
    except ImportError as e:
        print(f"imblearn import failed as expected: {e}")
        
        # Apply fix for _is_pandas_df
        def _is_pandas_df(X):
            return hasattr(X, "columns") and hasattr(X, "iloc")
        
        sklearn.utils.validation._is_pandas_df = _is_pandas_df
        print("Applied monkey-patch to sklearn.utils.validation._is_pandas_df")
        
        # Apply fix for AdaBoostClassifier algorithm argument
        from sklearn.ensemble import AdaBoostClassifier
        import inspect
        
        original_init = AdaBoostClassifier.__init__
        def new_init(self, *args, **kwargs):
            # Check if 'algorithm' is a valid argument for the original __init__
            sig = inspect.signature(original_init)
            if 'algorithm' in kwargs and 'algorithm' not in sig.parameters:
                print(f"Removing 'algorithm' argument from AdaBoostClassifier.__init__")
                kwargs.pop('algorithm')
            return original_init(self, *args, **kwargs)
        
        AdaBoostClassifier.__init__ = new_init
        print("Applied monkey-patch to AdaBoostClassifier")
        
        # Try importing imblearn again
        try:
            import importlib
            # We might need to clear modules that failed to import correctly
            failed_modules = [m for m in sys.modules if m.startswith('imblearn') and sys.modules[m] is None]
            for m in failed_modules:
                del sys.modules[m]
                
            from imblearn.over_sampling import SMOTE
            print("imblearn.over_sampling imported successfully after patches!")
            
            from imblearn.ensemble import EasyEnsembleClassifier
            print("imblearn.ensemble imported successfully after patches!")
            
        except Exception as e2:
            print(f"imblearn import still failed: {e2}")
            import traceback
            traceback.print_exc()

except ImportError as e:
    print(f"sklearn import failed: {e}")
