import json
import uuid
from datetime import datetime

# Load matched mappings
with open("matched_icd_namaste.json", "r", encoding="utf-8") as f:
    mapping = json.load(f)

# Convert to FHIR R4 Condition resources
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
            "coding": [
                {
                    "system": "http://id.who.int/icd",
                    "code": mapping_row['ICD11_Entity_ID'],
                    "display": mapping_row['ICD11_Title']
                },
                {
                    "system": "https://namaste.gov.in/codes",
                    "code": mapping_row['NAMC_CODE'],
                    "display": "NAMASTE Code"
                },
                {
                    "system": "https://namaste.gov.in/tm2",
                    "code": mapping_row['TM2_Label'],
                    "display": "TM2 Label"
                }
            ]
        },
        "subject": {
            "reference": "Patient/example"
        },
        "recordedDate": datetime.now().isoformat(),
        "note": [{
            "text": f"Mapped from ICD-11 to NAMASTE code {mapping_row['NAMC_CODE']} with TM2 label '{mapping_row['TM2_Label']}'. Confidence: {mapping_row['Confidence']}"
        }]
    }

# Generate and print FHIR resources
fhir_conditions = [to_fhir_condition(row) for row in mapping]

print("\n📦 FHIR R4 Condition Resources:")
for cond in fhir_conditions:
    print(json.dumps(cond, indent=2))
# Save to file
with open("fhir_conditions.json", "w", encoding="utf-8") as f:
    json.dump(fhir_conditions, f, indent=2, ensure_ascii=False)

print("\n✅ FHIR resources saved to fhir_conditions.json")
with open("M:/namaste/data/fhir_conditions.json", "w", encoding="utf-8") as f:
    json.dump(fhir_conditions, f, indent=2, ensure_ascii=False)

