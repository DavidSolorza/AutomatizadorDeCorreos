"""Reglas de clasificación automática para operaciones de seguros."""

CATEGORY_ASSIGNEE = {
    "cotizaciones": "paula",
    "cartera": "paula",
    "renovaciones": "cristina",
    "licitaciones": "cristina",
    "emisiones": "marcela",
    "colectivas": "marcela",
}

INSURANCE_RULES = [
    {"name": "Cotizaciones", "field": "subject", "operator": "contains", "value": "cotización", "category": "cotizaciones", "priority": "alto"},
    {"name": "Cotizaciones (variante)", "field": "subject", "operator": "contains", "value": "cotizacion", "category": "cotizaciones", "priority": "alto"},
    {"name": "Renovaciones", "field": "subject", "operator": "contains", "value": "renovación", "category": "renovaciones", "priority": "alto"},
    {"name": "Renovaciones (variante)", "field": "subject", "operator": "contains", "value": "renovacion", "category": "renovaciones", "priority": "alto"},
    {"name": "Emisiones", "field": "subject", "operator": "contains", "value": "emisión", "category": "emisiones", "priority": "alto"},
    {"name": "Emisiones (variante)", "field": "subject", "operator": "contains", "value": "emision", "category": "emisiones", "priority": "alto"},
    {"name": "Cartera", "field": "subject", "operator": "contains", "value": "cartera", "category": "cartera", "priority": "medio"},
    {"name": "Licitaciones", "field": "subject", "operator": "contains", "value": "licitación", "category": "licitaciones", "priority": "alto"},
    {"name": "Licitaciones (variante)", "field": "subject", "operator": "contains", "value": "licitacion", "category": "licitaciones", "priority": "alto"},
    {"name": "Colectivas", "field": "body_plain", "operator": "contains", "value": "colectiva", "category": "colectivas", "priority": "medio"},
]


def build_insurance_rules(user_id: str) -> list[dict]:
    return [
        {
            "user_id": user_id,
            "name": rule["name"],
            "description": f"Clasificación automática: {rule['category']}",
            "field": rule["field"],
            "operator": rule["operator"],
            "value": rule["value"],
            "category": rule["category"],
            "label": rule["category"].replace("_", " ").title(),
            "assigned_to": CATEGORY_ASSIGNEE.get(rule["category"]),
            "is_active": True,
            "priority": rule["priority"],
        }
        for rule in INSURANCE_RULES
    ]
