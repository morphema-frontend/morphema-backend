$base = "http://127.0.0.1:3000/api"

function Login($email, $password) {
  $payload = @{ email=$email; password=$password } | ConvertTo-Json -Compress
  $resp = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $payload
  return @{ Authorization = "Bearer $($resp.accessToken)" }
}

function Http($method, $url, $headers=$null, $body=$null) {
  if ($body -ne $null) {
    $json = $body | ConvertTo-Json -Depth 20
    Invoke-RestMethod -Method $method -Uri $url -Headers $headers -ContentType "application/json" -Body $json
  } else {
    Invoke-RestMethod -Method $method -Uri $url -Headers $headers
  }
}

"== login =="
$hdrHoreca = Login "venue@test.com" "password123"
$hdrAdmin  = Login "admin@test.com" "password123"

"== create venue =="
$venue = Http POST "$base/horeca-venues" $hdrHoreca @{
  name="Smoke Venue"
  address="Via Roma 10"
  city="Milano"
  zipCode="20100"
  province="MI"
  country="IT"
  legalName="Smoke Venue SRL"
  vatNumber="IT12345678901"
}
$venue | Format-List
$venueId = $venue.id

"== my venues =="
Http GET "$base/horeca-venues/me" $hdrHoreca | Format-Table id,publicId,name,city,ownerId,status

"== create gig =="
$gig = Http POST "$base/gigs" $hdrHoreca @{
  venueId = $venueId
  title = "Smoke gig"
  description = "Smoke test"
  startTime = "2026-01-20T18:00:00.000Z"
  endTime   = "2026-01-20T23:00:00.000Z"
  payAmount = 80
  currency  = "EUR"
}
$gig | Format-List

"== admin can read venue =="
Http GET "$base/horeca-venues/$venueId" $hdrAdmin | Select-Object id,publicId,name,ownerId,status | Format-List

"== insurance products =="
Http GET "$base/insurance/products" $hdrHoreca | Select-Object -First 2
