import base64
import io
import json
import os
import re

import requests
from openai import OpenAI
from PIL import Image

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

USDA_API_KEY = os.environ.get("USDA_API_KEY", "DEMO_KEY")
USDA_BASE = "https://api.nal.usda.gov/fdc/v1"
OPEN_FOOD_FACTS_BASE = "https://world.openfoodfacts.org/api/v2"

SYSTEM_PROMPT = """You are a nutrition expert AI. When given a food image, identify the food items and estimate nutritional content.
Return ONLY valid JSON with this structure:
{
  "food_name": "string",
  "serving_size": "string",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "fiber": number,
  "confidence": number (0-1),
  "items": [{"name": "string", "portion": "string"}]
}
All macros in grams. Be conservative with estimates."""


def analyze_food_image(image_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this food image and return nutritional data as JSON."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                ],
            },
        ],
        max_tokens=500,
        temperature=0.2,
    )

    raw = response.choices[0].message.content.strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"Could not parse AI response: {raw}")


def lookup_barcode(barcode: str) -> dict | None:
    url = f"{OPEN_FOOD_FACTS_BASE}/product/{barcode}.json"
    try:
        r = requests.get(url, timeout=8)
        data = r.json()
        if data.get("status") != 1:
            return None
        product = data["product"]
        nutriments = product.get("nutriments", {})
        return {
            "food_name": product.get("product_name", "Unknown"),
            "serving_size": product.get("serving_size", "100g"),
            "calories": float(nutriments.get("energy-kcal_serving") or nutriments.get("energy-kcal_100g") or 0),
            "protein": float(nutriments.get("proteins_serving") or nutriments.get("proteins_100g") or 0),
            "carbs": float(nutriments.get("carbohydrates_serving") or nutriments.get("carbohydrates_100g") or 0),
            "fats": float(nutriments.get("fat_serving") or nutriments.get("fat_100g") or 0),
            "fiber": float(nutriments.get("fiber_serving") or nutriments.get("fiber_100g") or 0),
            "confidence": 1.0,
        }
    except Exception:
        return None


def search_food_text(query: str) -> list[dict]:
    url = f"{USDA_BASE}/foods/search"
    params = {"query": query, "api_key": USDA_API_KEY, "pageSize": 5, "dataType": "SR Legacy,Survey (FNDDS)"}
    try:
        r = requests.get(url, params=params, timeout=8)
        foods = r.json().get("foods", [])
        results = []
        for food in foods:
            nutrients = {n["nutrientName"]: n["value"] for n in food.get("foodNutrients", [])}
            results.append({
                "food_name": food.get("description", ""),
                "serving_size": "100g",
                "calories": nutrients.get("Energy", 0),
                "protein": nutrients.get("Protein", 0),
                "carbs": nutrients.get("Carbohydrate, by difference", 0),
                "fats": nutrients.get("Total lipid (fat)", 0),
                "fiber": nutrients.get("Fiber, total dietary", 0),
                "confidence": 0.9,
            })
        return results
    except Exception:
        return []
