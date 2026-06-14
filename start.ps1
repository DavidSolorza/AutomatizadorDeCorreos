#Requires -Version 5.1

Write-Host "=== Email Classifier - Inicio Rapido ===" -ForegroundColor Cyan
Write-Host ""

# Kill existing processes
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start backend
Write-Host "[1/2] Iniciando backend (puerto 8000)..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "backend"
$backendLog = Join-Path $PSScriptRoot "backend.log"
Start-Process -WindowStyle Hidden -FilePath "python" -ArgumentList "run.py" -WorkingDirectory $backendDir
Start-Sleep -Seconds 5

# Test backend
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 5
    Write-Host "  Backend OK! (status $($r.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Backend no responde" -ForegroundColor Red
    exit 1
}

# Start frontend
Write-Host "[2/2] Iniciando frontend (puerto 5173)..." -ForegroundColor Yellow
$frontendDir = Join-Path $PSScriptRoot "frontend"
Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c pnpm dev" -WorkingDirectory $frontendDir
Start-Sleep -Seconds 5

try {
    $r = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5
    Write-Host "  Frontend OK! (status $($r.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Frontend no responde" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== LISTO ===" -ForegroundColor Cyan
Write-Host "Abre http://localhost:5173 en tu navegador" -ForegroundColor White
Write-Host ""
Write-Host "Para crear una cuenta de prueba:" -ForegroundColor Yellow
Write-Host "  1. Ir a http://localhost:5173/register" -ForegroundColor Gray
Write-Host "  2. Llenar los datos y crear cuenta" -ForegroundColor Gray
Write-Host "  3. Iniciar sesion con email y contrasena" -ForegroundColor Gray
Write-Host ""
Write-Host "Para login con Google:" -ForegroundColor Yellow
Write-Host "  Registra esta URI en Google Cloud Console > Authorized redirect URIs:" -ForegroundColor Gray
Write-Host "  http://localhost:8000/api/v1/auth/google/callback" -ForegroundColor White
Write-Host "  http://localhost:8000/api/v1/gmail/callback (para conectar Gmail)" -ForegroundColor White
