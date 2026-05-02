import pandas as pd
import re
import string
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import joblib

# -------------------------------
# 🔹 TEXT CLEANING FUNCTION
# -------------------------------
def clean_text(text):
    text = text.lower()
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>+', '', text)
    text = re.sub(r'[%s]' % re.escape(string.punctuation), '', text)
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'\w*\d\w*', '', text)
    return text

# -------------------------------
# 🔹 LOAD DATA
# -------------------------------
fake = pd.read_csv("data/Fake.csv")
real = pd.read_csv("data/True.csv")

fake["label"] = 0   # Fake
real["label"] = 1   # Real

# 🔥 Combine title + text (IMPORTANT)
fake["content"] = fake["title"] + " " + fake["text"]
real["content"] = real["title"] + " " + real["text"]

data = pd.concat([fake, real], axis=0)

# -------------------------------
# 🔹 CLEAN TEXT
# -------------------------------
data["content"] = data["content"].apply(clean_text)

# Shuffle
data = data.sample(frac=1, random_state=42)

# -------------------------------
# 🔹 SPLIT DATA
# -------------------------------
X = data["content"]
y = data["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# -------------------------------
# 🔹 VECTORIZATION (IMPROVED)
# -------------------------------
vectorizer = TfidfVectorizer(
    stop_words="english",
    max_df=0.75,
    min_df=2,
    ngram_range=(1, 2)   # 🔥 BIG IMPROVEMENT
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# -------------------------------
# 🔹 MODEL (BALANCED)
# -------------------------------
model = LogisticRegression(
    class_weight="balanced",   # 🔥 FIXES BIAS
    max_iter=300
)

model.fit(X_train_vec, y_train)

# -------------------------------
# 🔹 EVALUATION
# -------------------------------
y_pred = model.predict(X_test_vec)

print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# -------------------------------
# 🔹 SAVE MODEL
# -------------------------------
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("\n✅ Model and vectorizer saved successfully!")