$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:3000/api"

function J($obj) { ($obj | ConvertTo-Json -Depth 20) }
function Step($title) { Write-Host "`n==== $title ====" -ForegroundColor Cyan }
function PostJson($url, $body, $headers=@{}) {
  Invoke-RestMethod -Method Post -Uri $url -Headers $headers -ContentType "application/json" -Body (J $body)
}
function GetJson($url, $headers=@{}) { Invoke-RestMethod -Method Get -Uri $url -Headers $headers }
function Bearer($token) { @{ Authorization = "Bearer $token" } }
function MakeEmail($prefix) { "$prefix+$((Get-Date).ToString('yyyyMMddHHmmss'))@morphema.local" }

Step "Health"
$health = GetJson "$base/health"
Write-Host (J $health)
if ($health.status -ne "ok") { throw "Health check failed" }

Step "Create users (admin / horeca / worker)"
$pwd = "Password123!"
$adminEmail = MakeEmail "admin"
$horecaEmail = MakeEmail "horeca"
$workerEmail = MakeEmail "worker"

$adminUser  = PostJson "$base/users" @{ email=$adminEmail;  password=$pwd; role="admin" }
$horecaUser = PostJson "$base/users" @{ email=$horecaEmail; password=$pwd; role="horeca" }
$workerUser = PostJson "$base/users" @{ email=$workerEmail; password=$pwd; role="worker" }

Write-Host "adminUser.id=$($adminUser.id) horecaUser.id=$($horecaUser.id) workerUser.id=$($workerUser.id)"

Step "Login users"
$adminLogin  = PostJson "$base/auth/login" @{ email=$adminEmail;  password=$pwd }
$horecaLogin = PostJson "$base/auth/login" @{ email=$horecaEmail; password=$pwd }
$workerLogin = PostJson "$base/auth/login" @{ email=$workerEmail; password=$pwd }

$adminHdr  = Bearer $adminLogin.accessToken
$horecaHdr = Bearer $horecaLogin.accessToken
$workerHdr = Bearer $workerLogin.accessToken

Write-Host "admin token ok: $([bool]$adminLogin.accessToken)"
Write-Host "horeca token ok: $([bool]$horecaLogin.accessToken)"
Write-Host "worker token ok: $([bool]$workerLogin.accessToken)"

Step "Admin seed (contract templates + insurance)"
$seedContracts = PostJson "$base/admin/seed/contract-templates" @{} $adminHdr
$seedInsurance = PostJson "$base/admin/seed/insurance" @{} $adminHdr
Write-Host "seedContracts: $(J $seedContracts)"
Write-Host "seedInsurance: $(J $seedInsurance)"

Step "Create Horeca venue"
$venue = PostJson "$base/horeca-venues" @{
  name="Demo Venue";
  legalName="Demo Venue S.R.L.";
  vatNumber="IT12345678901";
  address="Via Demo 1";
  city="Roma";
  province="RM";
  zipCode="00100";
  country="IT"
} $horecaHdr
Write-Host (J $venue)
$venueId = $venue.id
if (-not $venueId) { throw "Venue creation failed" }

Step "Pick a JobType"
$jobTypes = GetJson "$base/job-types"
if (-not $jobTypes -or $jobTypes.Count -lt 1) { throw "No job types in DB" }
$jobType = $jobTypes[0]
Write-Host (J $jobType)

Step "Create Gig (draft)"
$start = (Get-Date).AddDays(2).Date.AddHours(19)
$end = $start.AddHours(4)

$gigCreate = PostJson "$base/gigs" @{
  title="Cameriere serale";
  description="Demo gig";
  venueId=$venueId;
  jobTypeId=$jobType.id;
  startTime=$start.ToString("o");
  endTime=$end.ToString("o");
  payAmount=60.00;
  currency="EUR"
} $horecaHdr

Write-Host (J $gigCreate)
$gigId = $gigCreate.id
if (-not $gigId) { throw "Gig creation failed" }

Step "Preauthorize gig (creates paymentSnapshot)"
$gigPreauth = PostJson "$base/gigs/$gigId/preauthorize" @{} $horecaHdr
Write-Host (J $gigPreauth)
if ($gigPreauth.publishStatus -ne "preauthorized") { throw "Preauthorize failed" }
if (-not $gigPreauth.paymentSnapshot) { throw "paymentSnapshot missing" }

Step "Publish gig"
$gigPub = PostJson "$base/gigs/$gigId/publish" @{} $horecaHdr
Write-Host (J $gigPub)
if ($gigPub.publishStatus -ne "published") { throw "Publish failed" }

Step "Worker feed (should include gig)"
$feed = GetJson "$base/gigs" $workerHdr
Write-Host "feedCount=$($feed.Count)"

Step "Worker apply -> booking pending"
$booking = PostJson "$base/bookings" @{ gigId=$gigId } $workerHdr
Write-Host (J $booking)
$bookingId = $booking.id
if (-not $bookingId) { throw "Booking creation failed" }
if ($booking.status -ne "pending") { throw "Booking should be pending" }

Step "Horeca accept booking -> confirmed"
$accepted = PostJson "$base/bookings/$bookingId/accept" @{} $horecaHdr
Write-Host (J $accepted)
if ($accepted.status -ne "confirmed") { throw "Booking should be confirmed" }

Step "Worker confirms attendance"
$conf = PostJson "$base/bookings/$bookingId/confirm-attendance" @{} $workerHdr
Write-Host (J $conf)

Step "Verify audit (gig + booking)"
$auditGig = GetJson "$base/audit?entityType=gig&entityId=$gigId&limit=50" $horecaHdr
$auditBooking = GetJson "$base/audit?entityType=booking&entityId=$bookingId&limit=50" $horecaHdr

Write-Host "gigAuditCount=$($auditGig.Count) bookingAuditCount=$($auditBooking.Count)" -ForegroundColor Green

$gigActions = $auditGig | Select-Object -ExpandProperty action
$bookingActions = $auditBooking | Select-Object -ExpandProperty action

Write-Host "gig actions: $($gigActions -join ', ')"
Write-Host "booking actions: $($bookingActions -join ', ')"

if (-not ($gigActions -contains "JOB_CREATED")) { throw "Missing JOB_CREATED audit" }
if (-not ($gigActions -contains "JOB_PREAUTHORIZED")) { throw "Missing JOB_PREAUTHORIZED audit" }
if (-not ($gigActions -contains "JOB_PUBLISHED")) { throw "Missing JOB_PUBLISHED audit" }

if (-not ($bookingActions -contains "BOOKING_APPLIED")) { throw "Missing BOOKING_APPLIED audit" }
if (-not ($bookingActions -contains "BOOKING_ACCEPTED")) { throw "Missing BOOKING_ACCEPTED audit" }
if (-not ($bookingActions -contains "ATTENDANCE_CONFIRMED")) { throw "Missing ATTENDANCE_CONFIRMED audit" }

Step "DONE"
Write-Host "Happy path completed." -ForegroundColor Green
