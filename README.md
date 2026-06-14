# AseEsta Ops — Automatizador de Correos

Plataforma de trazabilidad operativa para seguros: casos derivados de correo, dashboard ejecutivo, tablero Kanban por analista y reglas de asignación.

Repositorio: [github.com/DavidSolorza/AutomatizadorDeCorreos](https://github.com/DavidSolorza/AutomatizadorDeCorreos)

---

## Demo en línea (solo frontend)

**Para una demo pública no necesitas backend.** El frontend corre con datos mock en el navegador (`VITE_USE_MOCK=true`).

Demo desplegada (GitHub Pages):  
**https://davidSolorza.github.io/AutomatizadorDeCorreos/**

### Usuarios demo (selector en el header)

| Usuario | Rol |
|---------|-----|
| Administrador | Dashboard ejecutivo, todos los buzones |
| Paula | Tablero Kanban — Comercial & Cartera |
| Cristina | Tablero Kanban — Renovaciones & Licitaciones |
| Marcela | Tablero Kanban — Emisiones & Colectivas |

---

## ¿Cuándo sí necesitas el backend?

| Modo | Backend | Para qué |
|------|---------|----------|
| **Demo / presentación** | No | Mock local, GitHub Pages, Vercel estático |
| **Gmail real + PostgreSQL** | Sí | OAuth, sync de correos, persistencia real |
| **Producción** | Sí | API FastAPI + base de datos |

---

## Desarrollo local

### Solo demo (recomendado para entregar)

```bash
cd frontend
pnpm install
pnpm dev
```

Abre http://localhost:5173 — no hace falta levantar el backend si `frontend/.env` tiene:

```env
VITE_USE_MOCK=true
```

### Full stack (API real)

```bash
# Terminal 1 — Backend
cd backend
copy .env.example .env   # completa credenciales
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
# frontend/.env → VITE_USE_MOCK=false
pnpm dev
```

---

## Desplegar demo tú mismo

### GitHub Pages (automático)

Al hacer push a `main` o **`despliegue`**, el workflow `.github/workflows/deploy-demo.yml` publica en la rama `gh-pages`.

1. En el repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` / root

Variables de build (ya en CI):

- `VITE_STANDALONE=true` — API local en el navegador (sin backend)
- `VITE_USE_MOCK=true`
- `VITE_BASE_PATH=/AutomatizadorDeCorreos/`

### Vercel / Netlify (manual)

1. Root del proyecto: `frontend`
2. Build: `pnpm run build`
3. Output: `dist`
4. Env: `VITE_USE_MOCK=true`

---

## Estructura

```
frontend/   React + Vite + Tailwind (UI)
backend/    FastAPI + PostgreSQL (API opcional en demo)
```
