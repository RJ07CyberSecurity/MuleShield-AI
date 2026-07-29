$ports = 8000..8006
foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
        foreach ($conn in $connections) {
            if ($conn.OwningProcess -ne 0) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process $($conn.OwningProcess) on port $port"
            }
        }
    } catch {
        # Port not in use
    }
}
