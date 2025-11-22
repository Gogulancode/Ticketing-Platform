Get-Service | Where-Object { $_.Name -like '*SQL*' -and $_.Status -eq 'Running' } | Select-Object Name, DisplayName, Status | Format-Table -AutoSize
