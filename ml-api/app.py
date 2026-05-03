from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import string

app = Flask(__name__)

# ✅ Enable CORS (important for frontend connection)
CORS(app, resources={r"/*": {"origins": "*"}})

# -------------------------------
# 🔥 TEXT CLEANING (VERY IMPORTANT)
# -------------------------------
def clean_text(text):
    if not text:
        return ""

    text = text.lower()
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>+', '', text)
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'\r', ' ', text)
    text = re.sub(r'\d+', '', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\s+', ' ', text)

    return text.strip()

# -------------------------------
# 🔹 LOAD MODEL
# -------------------------------
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# -------------------------------
# 🔹 HANDLE CORS HEADERS (extra safety)
# -------------------------------
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# -------------------------------
# 🔹 HOME ROUTE (TEST)
# -------------------------------
@app.route("/")
def home():
    return "API Running ✅"

# -------------------------------
# 🔹 OPTIONS ROUTE (fix preflight)
# -------------------------------
@app.route("/predict", methods=["OPTIONS"])
def predict_options():
    return jsonify({"status": "ok"})

# -------------------------------
# 🔥 PREDICT ROUTE
# -------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data or "text" not in data:
            return jsonify({"error": "No text provided"}), 400

        text = data.get("text", "")

        # ✅ CLEAN TEXT (critical fix)
        cleaned_text = clean_text(text)

        # Debug (helps you verify during PPT prep)
        print("\n--- DEBUG INPUT ---")
        print(cleaned_text[:150])

        # Vectorize
        text_vec = vectorizer.transform([cleaned_text])

        # Predict probabilities
        prob = model.predict_proba(text_vec)[0]
        fake_prob = prob[0]
        real_prob = prob[1]

        print(f"Fake: {fake_prob:.4f}, Real: {real_prob:.4f}")

        # Decision (better logic)
        if real_prob > fake_prob:
            result = "REAL"
            confidence = round(real_prob * 100, 2)
        else:
            result = "FAKE"
            confidence = round(fake_prob * 100, 2)

        return jsonify({
            "result": result,
            "confidence": confidence
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": "Server error"}), 500

# -------------------------------
# 🔹 RUN SERVER
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)