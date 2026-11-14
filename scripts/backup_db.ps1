# ════════════════════════════════════════
# 📄 Backup de PostgreSQL del backend (pg_dump vía Docker)
# ════════════════════════════════════════
# USO:
#   .\scripts\backup_db.ps1                    # backup del entorno dev (docker-compose.yml)
#   .\scripts\backup_db.ps1 -Env prod          # backup del entorno prod (docker-compose.prod.yml)
#   .\scripts\backup_db.ps1 -Keep 14           # conservar los últimos 14 backups (default 7)
#
# Qué hace:
#   1. Ejecuta pg_dump dentro del contenedor de BD (formato custom, comprimido).
#   2. Guarda el dump en ./backups/calzado_jyr_db_YYYYMMDD_HHmmss.dump
#   3. Elimina backups antiguos, conservando los -Keep más recientes.
#
# Restaurar un backup:
#   docker compose exec -T db pg_restore -U jyr_user -d calzado_jyr_db --clean < backups\archivo.dump

param(
    [ValidateSet("dev", "prod")]
    [string]$Env = "dev",

    [ValidateRange(1, 90)]
    [int]$Keep = 7
)

$ErrorActionPreference = "Stop"

$composeFile = if ($Env -eq "prod") { "docker-compose.prod.yml" } else { "docker-compose.yml" }
$repoRoot = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $repoRoot "backups"

# Leer credenciales del .env (POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB)
$envFile = Join-Path $repoRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Error "No existe $envFile — copia .env.example a .env primero."
}
$dbUser = $null; $dbPass = $null; $dbName = $null
foreach ($line in Get-Content $envFile) {
    if ($line -match '^POSTGRES_USER=(.+)$') { $dbUser = $Matches[1].Trim() }
    if ($line -match '^POSTGRES_PASSWORD=(.+)$') { $dbPass = $Matches[1].Trim() }
    if ($line -match '^POSTGRES_DB=(.+)$') { $dbName = $Matches[1].Trim() }
}
if (-not $dbUser -or -not $dbName) {
    Write-Error "POSTGRES_USER y POSTGRES_DB deben estar definidos en .env."
}

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $backupDir "calzado_jyr_db_$timestamp.dump"

Write-Host "🗄️  Creando backup ($Env) → $outFile" -ForegroundColor Cyan

# pg_dump en formato custom (-Fc) comprime y permite restore selectivo.
# Se dumpea DENTRO del contenedor y se copia con docker cp: la tubería de
# PowerShell corrompe salida binaria, nunca redirigir pg_dump directo a consola.
$tmpName = "backup_$timestamp.dump"
docker compose -f $composeFile exec -T db sh -c "pg_dump -U $dbUser -Fc $dbName > /tmp/$tmpName"
if ($LASTEXITCODE -ne 0) { Write-Error "pg_dump falló (código $LASTEXITCODE)." }
docker compose -f $composeFile cp "db:/tmp/$tmpName" $outFile
docker compose -f $composeFile exec -T db rm "/tmp/$tmpName" | Out-Null

$size = (Get-Item $outFile).Length / 1MB
Write-Host ("✅ Backup creado: {0} ({1:N2} MB)" -f $outFile, $size) -ForegroundColor Green

# Validar que el dump no esté vacío (un pg_dump fallido puede producir un archivo mínimo)
if ($size -lt 0.01) {
    Write-Warning "⚠️  El dump parece vacío — revisa los logs del contenedor de BD."
}

# Rotación: conservar los -Keep más recientes
$old = Get-ChildItem $backupDir -Filter "calzado_jyr_db_*.dump" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $Keep
foreach ($f in $old) {
    Remove-Item $f.FullName -Force
    Write-Host "🧹 Backup antiguo eliminado: $($f.Name)"
}

Write-Host ("📋 Backups conservados: {0} en {1}" -f ((Get-ChildItem $backupDir -Filter "calzado_jyr_db_*.dump").Count), $backupDir)
