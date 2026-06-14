# Email Classifier

Sistema profesional de automatización y clasificación de correos electrónicos.

## Stack Tecnológico

- **Backend:** Python 3.12+, FastAPI, Uvicorn
- **Base de Datos:** Supabase PostgreSQL + SQLAlchemy 2.0 async
- **Migraciones:** Alembic
- **Autenticación:** JWT + Google OAuth2
- **Gmail API:** Google API Client
- **Testing:** Pytest
- **Calidad:** Ruff, Black, isort
- **Contenedores:** Docker, Docker Compose

## Instalación

### 1. Clonar repositorio

```bash
git clone <repo-url>
cd backend
```

### 2. Entorno virtual

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate
```

### 3. Dependencias

```bash
pip install -r requirements/dev.txt
# o
pip install -e ".[dev]"
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

## Configuración Google Cloud Console

### 1. Crear proyecto
1. Ir a https://console.cloud.google.com
2. Crear nuevo proyecto
3. Nombrarlo (ej: "email-classifier")

### 2. Activar Gmail API
1. Ir a APIs & Services > Library
2. Buscar "Gmail API"
3. Habilitar

### 3. Crear OAuth 2.0 Credentials
1. Ir a APIs & Services > Credentials
2. Crear > OAuth client ID
3. Application type: "Web application"
4. Authorized redirect URIs: `http://localhost:8000/api/v1/auth/google/callback`
5. Copiar Client ID y Client Secret al `.env`

### 4. Configurar pantalla de consentimiento
1. User Type: "External"
2. Añadir scopes: `.../auth/gmail.readonly`, `.../auth/gmail.modify`, `.../auth/gmail.labels`
3. Añadir test users (tu correo)

## Configuración Supabase

1. Crear proyecto en https://supabase.com
2. Ir a Project Settings > Database
3. Copiar Connection string (URI)
4. Pegar en `.env` como `DATABASE_URL`
5. Reemplazar `[YOUR-PASSWORD]` con la contraseña de la base de datos

## Migraciones

```bash
# Inicializar
alembic init alembic

# Crear migración
alembic revision --autogenerate -m "initial"

# Ejecutar
alembic upgrade head
```

## Ejecutar

### Local

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

```bash
docker-compose up --build
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registrar usuario |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/refresh` | Refrescar token |
| GET | `/api/v1/auth/me` | Perfil actual |
| GET | `/api/v1/auth/google/url` | URL login Google |
| GET | `/api/v1/users/me` | Obtener perfil |
| PUT | `/api/v1/users/me` | Actualizar perfil |
| DELETE | `/api/v1/users/me` | Eliminar cuenta |
| GET | `/api/v1/gmail/auth/url` | URL auth Gmail |
| GET | `/api/v1/gmail/callback` | Callback OAuth2 |
| GET | `/api/v1/gmail/accounts` | Cuentas conectadas |
| POST | `/api/v1/gmail/accounts/{id}/sync` | Sincronizar correos |
| GET | `/api/v1/emails` | Listar correos |
| GET | `/api/v1/emails/{id}` | Detalle correo |
| PATCH | `/api/v1/emails/{id}` | Actualizar correo |
| DELETE | `/api/v1/emails/{id}` | Eliminar correo |
| POST | `/api/v1/rules` | Crear regla |
| GET | `/api/v1/rules` | Listar reglas |
| GET | `/api/v1/rules/{id}` | Detalle regla |
| PUT | `/api/v1/rules/{id}` | Actualizar regla |
| DELETE | `/api/v1/rules/{id}` | Eliminar regla |
| GET | `/api/v1/notifications` | Listar notificaciones |
| PATCH | `/api/v1/notifications/{id}/read` | Marcar leída |
| PATCH | `/api/v1/notifications/read-all` | Marcar todas leídas |
| GET | `/health` | Health check |

## Motor de Reglas

Campos disponibles: `sender`, `sender_name`, `subject`, `body_plain`, `recipient`, `domain`

Operadores: `contains`, `not_contains`, `equals`, `starts_with`, `ends_with`, `regex`

Ejemplos:
- Dominio `@universidad.edu.co` → categoría "universidad"
- Asunto contiene "parcial" → categoría "profesor"
- Remitente contiene "factura" → categoría "pagos"

## Tests

```bash
pytest -v --cov=app
```

## Variables de Entorno

Ver `.env.example` para todas las variables disponibles.
