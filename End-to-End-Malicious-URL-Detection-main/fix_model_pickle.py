import joblib
import pickle

# Path to your old model
old_model_path = "artifacts/Best Model/Decision Tree.pkl"
# Path to save the new model
new_model_path = "artifacts/Best Model/Decision_Tree_fixed.pkl"

print("Loading old model...")
try:
    model = joblib.load(old_model_path)
except Exception as e:
    print("joblib load failed, trying pickle:", e)
    with open(old_model_path, "rb") as f:
        model = pickle.load(f)

print("Resaving model in updated format...")
joblib.dump(model, new_model_path)
print(f"✅ Fixed model saved as: {new_model_path}")
