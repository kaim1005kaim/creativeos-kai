#!/usr/bin/env python3
"""
Embedding API server using sentence-transformers
Provides semantic embeddings for text content
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import numpy as np
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model = None

def load_model():
    global model
    try:
        logger.info("Loading sentence-transformers model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        model = None

@app.route('/embedding', methods=['POST'])
def generate_embedding():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    try:
        embedding = model.encode(text)
        embedding_list = embedding.tolist()
        
        logger.info(f"Generated embedding for text: {text[:50]}...")
        return jsonify({'embedding': embedding_list})
    
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return jsonify({'error': 'Failed to generate embedding'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

if __name__ == '__main__':
    load_model()
    app.run(host='0.0.0.0', port=8001, debug=False)