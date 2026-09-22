import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import logging
from src.pipeline.predict_pipeline import PredictPipeline

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def retrain_model():
    try:
        logger.info("Starting model retraining...")
        
        # Load and validate training data
        train_data = pd.read_csv("artifacts/train.csv")
        logger.info(f"Loaded training data with shape: {train_data.shape}")
        logger.debug(f"Columns in training data: {train_data.columns.tolist()}")
        
        if 'url' not in train_data.columns:
            raise ValueError("Training data missing 'url' column")
        if 'type' not in train_data.columns:
            raise ValueError("Training data missing 'type' column")
            
        # Initialize pipeline
        pred_pipeline = PredictPipeline()
        
        # Transform URLs with detailed logging
        logger.info("Starting URL transformation...")
        transformed_urls = []
        valid_indices = []
        
        # Process first URL to validate transformation
        first_url = train_data['url'].iloc[0]
        logger.debug(f"Testing transformation with first URL: {first_url}")
        test_transform = pred_pipeline.transformURL(first_url)
        logger.debug(f"First URL transformed features: {test_transform}")
        
        # Process all URLs
        for idx, url in enumerate(train_data['url']):
            try:
                if pd.isna(url) or not isinstance(url, str):
                    logger.warning(f"Invalid URL at index {idx}: {url}")
                    continue
                    
                transformed_url = pred_pipeline.transformURL(url)
                if transformed_url is not None and len(transformed_url) > 0:
                    transformed_urls.append(transformed_url)
                    valid_indices.append(idx)
                    
                if (idx + 1) % 100 == 0:
                    logger.info(f"Processed {idx + 1} URLs, valid: {len(transformed_urls)}")
                    
            except Exception as e:
                logger.error(f"Error processing URL at index {idx}: {url}")
                logger.error(f"Error details: {str(e)}")
                continue
        
        logger.info(f"URL transformation complete. Valid URLs: {len(transformed_urls)}")
        
        if not transformed_urls:
            logger.error("No valid URLs were processed")
            logger.error("Sample of first 5 URLs from dataset:")
            logger.error(train_data['url'].head())
            raise ValueError("No valid URLs were processed")
            
        # Convert to numpy array
        X = np.array(transformed_urls)
        logger.info(f"Feature matrix shape: {X.shape}")
        
        # Prepare labels
        valid_data = train_data.iloc[valid_indices]
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(valid_data['type'])
        
        logger.info(f"Training model with {len(X)} samples")
        logger.info(f"Unique classes: {np.unique(valid_data['type']).tolist()}")
        
        # Train model
        model = DecisionTreeClassifier(
            max_depth=10,
            min_samples_leaf=5,
            random_state=42
        )
        model.fit(X, y)
        
        # Save artifacts
        model_path = os.path.join("artifacts", "Best Model")
        os.makedirs(model_path, exist_ok=True)
        
        joblib.dump(model, os.path.join(model_path, 'Decision Tree.pkl'))
        joblib.dump(label_encoder, os.path.join(model_path, 'label_encoder.pkl'))
        
        logger.info("Model trained and saved successfully")
        
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise

if __name__ == "__main__":
    retrain_model()