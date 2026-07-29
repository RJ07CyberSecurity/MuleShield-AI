$ports = 8000..8006
foreach ($port in $ports) {
    try {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
        if ($connection) {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "Killed process $($connection.OwningProcess) on port $port"
        }
    } catch {
        # Port not in use
    }
}
