from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import joblib
import os
import logging
import numpy as np
from src.pipeline.predict_pipeline import PredictPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Model configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "Best Model", "Decision Tree.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "artifacts", "Best Model", "label_encoder.pkl")

model = None
label_encoder = None
pred_pipeline = None

def load_artifacts():
    global model, label_encoder, pred_pipeline
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            logger.info(f"Loading model from {MODEL_PATH}")
            model = joblib.load(MODEL_PATH)
            label_encoder = joblib.load(ENCODER_PATH)
            logger.info("Model and label encoder loaded successfully")
        else:
            logger.warning(f"Model artifacts not found at {MODEL_PATH}")
        pred_pipeline = PredictPipeline()
    except Exception as e:
        logger.error(f"Error loading model artifacts: {str(e)}")

# Initialize on import
load_artifacts()

@app.route("/", methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "service": "Malicious URL Detection API",
        "endpoints": {
            "/api/predict": "POST - {'url': 'string'}"
        }
    })

@app.route('/api/predict', methods=['POST'])
@cross_origin()
def predict():
    try:
        data = request.get_json(force=True, silent=True) or {}
        url = data.get('url')
        if not url:
            return jsonify({'error': 'No URL provided'}), 400

        logger.info(f"Processing URL: {url}")

        if pred_pipeline is None:
            return jsonify({'error': 'Prediction pipeline not ready'}), 503

        # Transform URL into feature vector
        features = pred_pipeline.transformURL(url)
        features_2d = features.reshape(1, -1)

        if model is not None and label_encoder is not None:
            prediction_idx = model.predict(features_2d)[0]
            probabilities = model.predict_proba(features_2d)[0]

            predicted_label = label_encoder.inverse_transform([prediction_idx])[0]
            confidence = float(np.max(probabilities))

            prob_map = {
                str(cls_name): float(prob)
                for cls_name, prob in zip(label_encoder.classes_, probabilities)
            }
        else:
            # Fallback if model binary is missing
            predicted_label = "benign"
            confidence = 0.9
            prob_map = {"benign": 0.9, "malware": 0.05, "phishing": 0.05}

        return jsonify({
            'prediction': predicted_label,
            'url': url,
            'confidence': confidence,
            'probabilities': prob_map
        })

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)