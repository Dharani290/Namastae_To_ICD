import json
import uuid
from datetime import datetime
import json

# Load FHIR resources
with open("fhir_conditions.json", "r", encoding="utf-8") as f:
    fhir_data = json.load(f)

search_term = input("🔍 Enter ICD entity ID, TM2 label, or NAMC code: ").strip().lower()

results = []
for cond in fhir_data:
    for coding in cond['code']['coding']:
        if search_term in coding['code'].lower() or search_term in coding['display'].lower():
            results.append(cond)
            break

# Output
if results:
    print(f"\n✅ Found {len(results)} match(es):")
    for cond in results:
        print(json.dumps(cond, indent=2))
else:
    print("❌ No matches found.")

# Load matched mappings
with open("matched_icd_namaste.json", "r", encoding="utf-8") as f:
    mapping = json.load(f)

# FHIR formatter
def to_fhir_condition(mapping_row):
    return {
        "resourceType": "Condition",
        "id": str(uuid.uuid4()),
        "clinicalStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                "code": "active",
                "display": "Active"
            }]
        },
        "verificationStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                "code": "confirmed",
                "display": "Confirmed"
            }]
        },
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                "code": "problem-list-item",
                "display": "Problem List Item"
            }]
        }],
        "code": {
            "coding": [{
                "system": "http://id.who.int/icd",
                "code": mapping_row['ICD11_Entity_ID'],
                "display": mapping_row['ICD11_Title']
            }]
        },
        "subject": {
            "reference": "Patient/example"
        },
        "recordedDate": datetime.now().isoformat(),
        "note": [{
            "text": f"Mapped to NAMC_CODE {mapping_row['NAMC_CODE']} with TM2 label '{mapping_row['TM2_Label']}' (confidence {mapping_row['Confidence']})"
        }]
    }

# Search logic
search_term = input("🔍 Enter ICD entity ID, TM2 label, or NAMC code: ").strip().lower()

results = []
for row in mapping:
    if (
        search_term in row['ICD11_Entity_ID'].lower()
        or search_term in row['ICD11_Title'].lower()
        or search_term in row['TM2_Label'].lower()
        or search_term in row['NAMC_CODE'].lower()
    ):
        results.append(to_fhir_condition(row))

# Output
if results:
    print(f"\n✅ Found {len(results)} match(es):")
    for cond in results:
        print(json.dumps(cond, indent=2))
else:
    print("❌ No matches found.")
