import os
import json
import pandas as pd
from sentence_transformers import SentenceTransformer, util
from tqdm import tqdm

# Paths to your folders
NAMASTE_FOLDER = r"M:\namaste\data\namaste_codes"
ICD11_FOLDER = r"M:\namaste\data\icd_11_codes"

# Load NAMASTE rows from all Excel files
namaste_rows = []
for file in os.listdir(NAMASTE_FOLDER):
    file_path = os.path.join(NAMASTE_FOLDER, file)
    try:
        if file.endswith('.xlsx'):
            df = pd.read_excel(file_path, engine='openpyxl')
        elif file.endswith('.xls'):
            df = pd.read_excel(file_path, engine='xlrd')
        else:
            continue
        print(f"✅ Loaded {len(df)} rows from {file}")
        namaste_rows.extend(df.to_dict(orient='records'))
    except Exception as e:
        print(f"❌ Failed to load {file}: {e}")

print(f"Total NAMASTE rows loaded: {len(namaste_rows)}")

# Load ICD-11 rows from all JSONs
icd_rows = []
for file in os.listdir(ICD11_FOLDER):
    if file.endswith('.json'):
        with open(os.path.join(ICD11_FOLDER, file), 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                data = data[0]
            icd_rows.append({
                'title': data.get('title'),
                'entity_id': data.get('id'),
                'synonyms': [pv['label'] for pv in data.get('matchingPVs', []) if pv.get('propertyId') == 'Synonym']
            })

print(f"Total ICD-11 rows loaded: {len(icd_rows)}")

# Load the model
print("\n🔍 Loading AI model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model loaded")

# Matching function
def get_best_match(icd_title, icd_synonyms, namaste_batch):
    icd_texts = [icd_title] + icd_synonyms
    icd_embedding = model.encode(icd_texts, convert_to_tensor=True).mean(dim=0)

    best_score = 0
    best_match = None

    for row in namaste_batch:
        candidate_text = row.get('Name English') or row.get('Short_definition') or ''
        if not candidate_text:
            continue
        candidate_embedding = model.encode(candidate_text, convert_to_tensor=True)
        score = util.cos_sim(icd_embedding, candidate_embedding).item()
        if score > best_score:
            best_score = score
            best_match = row

    return best_match, best_score

# Batch matching logic
BATCH_SIZE = 500
MAX_BATCHES = len(namaste_rows) // BATCH_SIZE + 1

mapping = []
matched_icd_ids = set()

for batch_num in range(MAX_BATCHES):
    start = batch_num * BATCH_SIZE
    end = start + BATCH_SIZE
    batch = namaste_rows[start:end]

    print(f"\n🔎 Processing batch {batch_num + 1} ({start} to {end})...")

    for icd in tqdm(icd_rows, desc="Matching ICD-11 entries"):
        if icd['entity_id'] in matched_icd_ids:
            continue

        match, score = get_best_match(icd['title'], icd['synonyms'], batch)
        if match:
            mapping.append({
                'ICD11_Title': icd['title'],
                'ICD11_Entity_ID': icd['entity_id'],
                'NAMC_CODE': match.get('NAMC_CODE'),
                'TM2_Label': match.get('Name English'),
                'Confidence': round(score, 2)
            })
            matched_icd_ids.add(icd['entity_id'])

    print(f"✅ Matches found so far: {len(matched_icd_ids)}")

    if len(matched_icd_ids) == len(icd_rows):
        print(f"\n🎉 All ICD-11 entries matched in batch {batch_num + 1}. Stopping early.")
        break

# Final output
print("\n🧾 Final Mapping:")
for row in mapping:
    print(row)
with open("matched_icd_namaste.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, indent=2, ensure_ascii=False)
print("\n✅ Saved mapping to matched_icd_namaste.json")
with open("M:/namaste/data/matched_icd_namaste.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, indent=2, ensure_ascii=False)
