# check.ps1 — Ejecuta los mismos checks que CI antes de push
# Uso: .\scripts\check.ps1
# Requiere: Docker corriendo, pnpm instalado

$ErrorActionPreference = "Continue"
$failed = 0

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CALZADO J&R - Pre-push checks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Migration ID validation ---
Write-Host "[1/5] Validando IDs de migracion (<=32 chars)..." -ForegroundColor Yellow
$versionsDir = "be/alembic/versions"
$longIds = @()
Get-ChildItem "$versionsDir/*.py" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $matches = [regex]::Matches($content, 'revision\s*=\s*"([^"]+)"')
    foreach ($m in $matches) {
        $revId = $m.Groups[1].Value
        if ($revId.Length -gt 32) {
            $name = $_.Name
            $len = $revId.Length
            $longIds += "${name}: revision='${revId}' (${len} chars)"
        }
    }
}
if ($longIds.Count -gt 0) {
    Write-Host "  FAIL - Migration IDs demasiado largos (>32 chars):" -ForegroundColor Red
    $longIds | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    Write-Host "  alembic_version.version_num es VARCHAR(32). Acorta los IDs." -ForegroundColor Red
    $failed++
} else {
    Write-Host "  OK - Todos los revision IDs <= 32 chars" -ForegroundColor Green
}

# --- 2. Ruff check (backend) ---
Write-Host ""
Write-Host "[2/5] Ruff check (backend)..." -ForegroundColor Yellow
$ruffResult = docker compose exec -T be uv run ruff check app/ 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL - ruff check errores:" -ForegroundColor Red
    Write-Host $ruffResult -ForegroundColor Red
    $failed++
} else {
    Write-Host "  OK - ruff check pasa" -ForegroundColor Green
}

# --- 3. Pytest (backend, via Docker) ---
Write-Host ""
Write-Host "[3/5] Pytest (backend, via Docker)..." -ForegroundColor Yellow
$pytestResult = docker compose exec -T be uv run pytest --tb=short -q 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL - pytest fallo:" -ForegroundColor Red
    Write-Host $pytestResult -ForegroundColor Red
    $failed++
} else {
    $passedLine = ($pytestResult | Select-String "passed").ToString().Trim()
    Write-Host "  OK - $passedLine" -ForegroundColor Green
}

# --- 4. TypeScript typecheck (frontend) ---
Write-Host ""
Write-Host "[4/5] TypeScript typecheck (frontend)..." -ForegroundColor Yellow
Push-Location "fe"
$tscResult = npx tsc -b 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL - tsc -b errores:" -ForegroundColor Red
    Write-Host $tscResult -ForegroundColor Red
    $failed++
} else {
    Write-Host "  OK - tsc -b pasa" -ForegroundColor Green
}
Pop-Location

# --- 5. Frontend tests ---
Write-Host ""
Write-Host "[5/5] Frontend tests (vitest)..." -ForegroundColor Yellow
Push-Location "fe"
$testResult = pnpm test 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL - pnpm test fallo:" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
    $failed++
} else {
    Write-Host "  OK - pnpm test pasa" -ForegroundColor Green
}
Pop-Location

# --- Resultado ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($failed -gt 0) {
    $msg = "  $failed check(s) FALLARON - NO hacer push"
    Write-Host $msg -ForegroundColor Red
    Write-Host "  Corrige los errores y vuelve a correr: .\scripts\check.ps1" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "  Todos los checks PASARON - listo para push" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    exit 0
}
