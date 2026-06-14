"""
Reglas preconfiguradas para clasificación de correos universitarios.

Estructura:
- Por cada profesor: reglas de dominio, nombre, materia, código
- Por cada materia: palabras clave para detectar en asunto/contenido
- Prioridades: urgente > alto > medio > bajo
"""

PROFESSORS = [
    {
        "name": "JORGE ALBERTO JARAMILLO GARZÓN",
        "email": "jorge.jaramillo@ucaldas.edu.co",
        "subject": "Arquitectura de Computadores",
        "code": "51G8F - 5TEO",
        "keywords": ["arquitectura", "computadores", "procesador", "cpu", "memoria"],
    },
    {
        "name": "SANDRA VICTORIA HURTADO GIL",
        "email": "sandra.hurtado@ucaldas.edu.co",
        "subject": "Fundamentos de Ingeniería de Software",
        "code": "9918G8F - 1TEO",
        "keywords": ["software", "ingenieria", "requisitos", "uml", "ciclo de vida"],
    },
    {
        "name": "MARIA FERNANDA PORTILLA BARRERA",
        "email": "maria.portilla@ucaldas.edu.co",
        "subject": "Ciencias para la Salud",
        "code": "354G8H - 8TEO",
        "keywords": ["salud", "ciencias", "biología", "cuerpo humano"],
    },
    {
        "name": "DANIEL ESCOBAR RINCÓN",
        "email": "daniel.escobar@ucaldas.edu.co",
        "subject": "Electricidad y Magnetismo",
        "code": "605G7F - 1LEC",
        "keywords": ["electricidad", "magnetismo", "circuitos", "voltaje", "corriente"],
    },
    {
        "name": "OSCAR MAURICIO BEDOYA HERRERA",
        "email": "oscar.bedoya@ucaldas.edu.co",
        "subject": "Bases de Datos No Relacionales",
        "code": "992G8F - 4TEO",
        "keywords": ["mongodb", "nosql", "redis", "colecciones", "documentos"],
    },
    {
        "name": "SANDRA PATRICIA NUÑEZ IBARRA",
        "email": "sandra.nunez@ucaldas.edu.co",
        "subject": "Razonamiento Lógico III",
        "code": "450G5E - 14TEO",
        "keywords": ["lógica", "razonamiento", "argumentos", "deducción"],
    },
]

URGENT_KEYWORDS = [
    "parcial", "examen", "urgente", "entrega", "deadline",
    "mañana", "último día", "vencimiento", "nota", "calificación",
]

SPAM_KEYWORDS = [
    "no-reply", "noreply", "notificaciones", "newsletter", "publicidad",
    "promoción", "descuento", "oferta", "suscripción", "spam",
    "confirmación de registro", "bienvenido", "cambio de contraseña",
    "código de verificación", "restablecer", "verificar correo",
]

SUBJECT_PRIORITY = {
    "Arquitectura de Computadores": "alto",
    "Fundamentos de Ingeniería de Software": "alto",
    "Bases de Datos No Relacionales": "medio",
    "Electricidad y Magnetismo": "medio",
    "Ciencias para la Salud": "medio",
    "Razonamiento Lógico III": "bajo",
}


def build_default_rules(user_id: str) -> list[dict]:
    rules = []

    for prof in PROFESSORS:
        domain = prof["email"].split("@")[1]
        rules.append({
            "user_id": user_id,
            "name": f"Dominio universidad - {prof['subject']}",
            "description": f"Correos del dominio {domain} para {prof['subject']}",
            "field": "domain",
            "operator": "contains",
            "value": domain,
            "category": "universidad",
            "label": prof["subject"],
            "is_active": True,
            "priority": "medio",
        })

        name_parts = prof["name"].lower().split()
        sender_key = " ".join([name_parts[0], name_parts[-1]])
        rules.append({
            "user_id": user_id,
            "name": f"Profesor {prof['name']}",
            "description": f"Correos del profesor {prof['name']}",
            "field": "sender",
            "operator": "contains",
            "value": sender_key,
            "category": "universidad",
            "label": prof["subject"],
            "is_active": True,
            "priority": "alto",
        })

        for keyword in prof["keywords"]:
            rules.append({
                "user_id": user_id,
                "name": f"Palabra clave '{keyword}' - {prof['subject']}",
                "description": f"Correos con la palabra '{keyword}' en asunto o contenido",
                "field": "subject",
                "operator": "contains",
                "value": keyword,
                "category": "universidad",
                "label": prof["subject"],
                "is_active": True,
                "priority": SUBJECT_PRIORITY.get(prof["subject"], "medio"),
            })
            rules.append({
                "user_id": user_id,
                "name": f"Cuerpo '{keyword}' - {prof['subject']}",
                "description": f"Correos con '{keyword}' en el cuerpo del mensaje",
                "field": "body_plain",
                "operator": "contains",
                "value": keyword,
                "category": "universidad",
                "label": prof["subject"],
                "is_active": True,
                "priority": SUBJECT_PRIORITY.get(prof["subject"], "medio"),
            })

        rules.append({
            "user_id": user_id,
            "name": f"Código materia {prof['code']}",
            "description": f"Correos con el código de materia {prof['code']}",
            "field": "subject",
            "operator": "contains",
            "value": prof["code"].split(" - ")[0],
            "category": "universidad",
            "label": prof["subject"],
            "is_active": True,
            "priority": "alto",
        })

    for kw in URGENT_KEYWORDS:
        rules.append({
            "user_id": user_id,
            "name": f"Urgente: '{kw}'",
            "description": f"Correos con palabra clave urgente '{kw}'",
            "field": "subject",
            "operator": "contains",
            "value": kw,
            "category": "urgente",
            "label": None,
            "is_active": True,
            "priority": "urgente",
        })

    for kw in SPAM_KEYWORDS:
        for field in ["sender", "subject"]:
            rules.append({
                "user_id": user_id,
                "name": f"No deseado - {field}: '{kw}'",
                "description": f"Correo no importante con '{kw}'",
                "field": field,
                "operator": "contains",
                "value": kw,
                "category": "no_deseado",
                "label": None,
                "is_active": True,
                "priority": "bajo",
            })

    return rules
