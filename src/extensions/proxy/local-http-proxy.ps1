param(
    [string]$HostName = "127.0.0.1",
    [int]$Port = 8788,
    [int]$TimeoutSec = 20,
    [long]$MaxResponseBytes = 10485760,
    [switch]$AllowPrivateNetwork
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:Listener = $null
$script:TextualContentTypes = @(
    "application/json",
    "application/javascript",
    "application/xml",
    "application/xhtml+xml",
    "application/x-www-form-urlencoded",
    "image/svg+xml"
)
$script:HopByHopHeaders = @(
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "content-length"
)

function Throw-ProxyError {
    param(
        [int]$StatusCode,
        [string]$Message
    )

    throw "$StatusCode|$Message"
}

function Set-CorsHeaders {
    param(
        [System.Net.HttpListenerResponse]$Response,
        [System.Net.HttpListenerRequest]$Request
    )

    $origin = ""
    try { $origin = [string]$Request.Headers["Origin"] } catch {}
    if ([string]::IsNullOrWhiteSpace($origin) -or $origin.Trim().ToLowerInvariant() -eq "null") {
        $Response.Headers["Access-Control-Allow-Origin"] = "*"
    }
    else {
        $Response.Headers["Access-Control-Allow-Origin"] = $origin.Trim()
    }

    $requestHeaders = ""
    try { $requestHeaders = [string]$Request.Headers["Access-Control-Request-Headers"] } catch {}

    $Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    $Response.Headers["Access-Control-Allow-Private-Network"] = "true"
    $Response.Headers["Access-Control-Allow-Headers"] = if ([string]::IsNullOrWhiteSpace($requestHeaders)) {
        "Authorization, Cache-Control, Content-Type, Depth, Destination, If-Match, Overwrite, Pragma, X-Requested-With"
    }
    else {
        $requestHeaders.Trim()
    }
    $Response.Headers["Access-Control-Expose-Headers"] = "Content-Length, Content-Type, X-Proxy-Final-Url, X-Proxy-Status, X-Proxy-Status-Text"
    $Response.Headers["Vary"] = "Origin, Access-Control-Request-Headers, Access-Control-Request-Private-Network"
    $Response.Headers["Cache-Control"] = "no-store"
}

function Write-JsonResponse {
    param(
        [System.Net.HttpListenerResponse]$Response,
        [int]$StatusCode,
        [object]$Payload,
        [System.Net.HttpListenerRequest]$Request
    )

    $json = $Payload | ConvertTo-Json -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $Response.StatusCode = $StatusCode
    Set-CorsHeaders -Response $Response -Request $Request
    $Response.ContentType = "application/json; charset=utf-8"
    $Response.ContentLength64 = $bytes.LongLength
    $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Write-TextResponse {
    param(
        [System.Net.HttpListenerResponse]$Response,
        [int]$StatusCode,
        [string]$Body,
        [System.Net.HttpListenerRequest]$Request
    )

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $Response.StatusCode = $StatusCode
    Set-CorsHeaders -Response $Response -Request $Request
    $Response.ContentType = "text/plain; charset=utf-8"
    $Response.ContentLength64 = $bytes.LongLength
    $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Get-Charset {
    param([string]$ContentType)

    if ([string]::IsNullOrWhiteSpace($ContentType)) {
        return "utf-8"
    }

    foreach ($part in $ContentType.Split(";") | Select-Object -Skip 1) {
        $nameValue = $part.Split("=", 2)
        if ($nameValue.Count -eq 2 -and $nameValue[0].Trim().ToLowerInvariant() -eq "charset") {
            $charset = $nameValue[1].Trim().Trim('"')
            if (-not [string]::IsNullOrWhiteSpace($charset)) {
                return $charset
            }
        }
    }

    return "utf-8"
}

function Test-IsTextualContentType {
    param([string]$ContentType)

    if ([string]::IsNullOrWhiteSpace($ContentType)) {
        return $false
    }

    $lower = $ContentType.ToLowerInvariant()
    if ($lower.StartsWith("text/")) {
        return $true
    }
    foreach ($type in $script:TextualContentTypes) {
        if ($lower.StartsWith($type)) {
            return $true
        }
    }
    if ($lower.Contains("+json") -or $lower.Contains("+xml")) {
        return $true
    }
    return $false
}

function Test-IsPrivateAddress {
    param([System.Net.IPAddress]$Address)

    if ($Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork) {
        $bytes = $Address.GetAddressBytes()
        if ($bytes[0] -eq 10) { return $true }
        if ($bytes[0] -eq 127) { return $true }
        if ($bytes[0] -eq 0) { return $true }
        if ($bytes[0] -eq 169 -and $bytes[1] -eq 254) { return $true }
        if ($bytes[0] -eq 172 -and $bytes[1] -ge 16 -and $bytes[1] -le 31) { return $true }
        if ($bytes[0] -eq 192 -and $bytes[1] -eq 168) { return $true }
        if ($bytes[0] -ge 224 -and $bytes[0] -le 239) { return $true }
        return $false
    }

    if ($Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetworkV6) {
        if ($Address.Equals([System.Net.IPAddress]::IPv6Loopback)) { return $true }
        if ($Address.Equals([System.Net.IPAddress]::IPv6None)) { return $true }
        if ($Address.IsIPv6LinkLocal -or $Address.IsIPv6Multicast -or $Address.IsIPv6SiteLocal) { return $true }
        $bytes = $Address.GetAddressBytes()
        if (($bytes[0] -band 0xFE) -eq 0xFC) { return $true }
        return $false
    }

    return $true
}

function Test-TargetAllowed {
    param(
        [uri]$TargetUri,
        [bool]$AllowPrivateTargets
    )

    if ($TargetUri.Scheme -notin @("http", "https")) {
        Throw-ProxyError -StatusCode 400 -Message "Only http:// and https:// URLs are supported"
    }

    if ($AllowPrivateTargets) {
        return
    }

    if ($TargetUri.DnsSafeHost.ToLowerInvariant() -eq "localhost") {
        Throw-ProxyError -StatusCode 403 -Message "Requests to localhost are blocked by default"
    }

    try {
        $addresses = [System.Net.Dns]::GetHostAddresses($TargetUri.DnsSafeHost)
    }
    catch {
        Throw-ProxyError -StatusCode 502 -Message "DNS resolution failed for $($TargetUri.DnsSafeHost): $($_.Exception.Message)"
    }

    foreach ($address in $addresses) {
        if (Test-IsPrivateAddress -Address $address) {
            Throw-ProxyError -StatusCode 403 -Message "Requests to private or local targets are blocked by default ($($TargetUri.DnsSafeHost) -> $($address.IPAddressToString))"
        }
    }
}

function Convert-RequestHeadersToHashtable {
    param([System.Collections.Specialized.NameValueCollection]$Headers)

    $result = @{}
    foreach ($key in $Headers.AllKeys) {
        if ([string]::IsNullOrWhiteSpace($key)) {
            continue
        }
        $result[$key] = $Headers[$key]
    }
    return $result
}

function Get-SanitizedHeaders {
    param([hashtable]$Headers)

    $result = @{}
    foreach ($entry in $Headers.GetEnumerator()) {
        $key = [string]$entry.Key
        $value = [string]$entry.Value
        $lower = $key.ToLowerInvariant()
        if ($script:HopByHopHeaders -contains $lower) { continue }
        if ($lower -in @("host", "accept-encoding")) { continue }
        $result[$key] = $value
    }
    if (-not ($result.Keys | Where-Object { $_.ToLowerInvariant() -eq "user-agent" })) {
        $result["User-Agent"] = "MyBookmarksLocalProxy/1.0"
    }
    return $result
}

function Get-RequestBytes {
    param(
        [System.IO.Stream]$Stream,
        [long]$MaxBytes
    )

    $buffer = New-Object byte[] 65536
    $output = New-Object System.IO.MemoryStream
    try {
        while (($read = $Stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
            if (($output.Length + $read) -gt $MaxBytes) {
                Throw-ProxyError -StatusCode 413 -Message "Payload exceeds limit of $MaxBytes bytes"
            }
            $output.Write($buffer, 0, $read)
        }
        return $output.ToArray()
    }
    finally {
        $output.Dispose()
    }
}

function Get-BodyBytesFromSpec {
    param([pscustomobject]$Spec)

    $hasText = $null -ne $Spec.PSObject.Properties["bodyText"]
    $hasBase64 = $null -ne $Spec.PSObject.Properties["bodyBase64"]
    if ($hasText -and $hasBase64) {
        Throw-ProxyError -StatusCode 400 -Message "Use either bodyText or bodyBase64, not both"
    }

    if ($hasText) {
        return [System.Text.Encoding]::UTF8.GetBytes([string]$Spec.bodyText)
    }
    if ($hasBase64) {
        try {
            return [Convert]::FromBase64String([string]$Spec.bodyBase64)
        }
        catch {
            Throw-ProxyError -StatusCode 400 -Message "bodyBase64 is not valid base64: $($_.Exception.Message)"
        }
    }
    return $null
}

function Invoke-ProxyRequest {
    param(
        [pscustomobject]$Spec,
        [System.Net.Http.HttpClient]$HttpClient,
        [bool]$AllowPrivateTargets,
        [long]$MaxBytes
    )

    $url = [string]$Spec.url
    if ([string]::IsNullOrWhiteSpace($url)) {
        Throw-ProxyError -StatusCode 400 -Message "Missing url parameter"
    }

    try {
        $targetUri = [uri]$url
    }
    catch {
        Throw-ProxyError -StatusCode 400 -Message "Invalid target URL: $url"
    }

    Test-TargetAllowed -TargetUri $targetUri -AllowPrivateTargets $AllowPrivateTargets

    $methodName = [string]($Spec.method)
    if ([string]::IsNullOrWhiteSpace($methodName)) {
        $methodName = "GET"
    }
    $methodName = $methodName.ToUpperInvariant()

    $message = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($methodName), $targetUri)
    $response = $null
    try {
        $headers = @{}
        if ($null -ne $Spec.PSObject.Properties["headers"]) {
            if ($Spec.headers -is [System.Collections.IDictionary]) {
                foreach ($entry in $Spec.headers.GetEnumerator()) {
                    $headers[[string]$entry.Key] = [string]$entry.Value
                }
            }
            else {
                foreach ($property in $Spec.headers.PSObject.Properties) {
                    $headers[[string]$property.Name] = [string]$property.Value
                }
            }
        }
        $headers = Get-SanitizedHeaders -Headers $headers

        $bodyBytes = Get-BodyBytesFromSpec -Spec $Spec
        if ($null -ne $bodyBytes) {
            $content = [System.Net.Http.ByteArrayContent]::new($bodyBytes)
            $message.Content = $content
        }

        foreach ($entry in $headers.GetEnumerator()) {
            if (-not $message.Headers.TryAddWithoutValidation($entry.Key, $entry.Value)) {
                if ($null -eq $message.Content) {
                    $message.Content = [System.Net.Http.ByteArrayContent]::new([byte[]]@())
                }
                $null = $message.Content.Headers.TryAddWithoutValidation($entry.Key, $entry.Value)
            }
        }

        $response = $HttpClient.SendAsync(
            $message,
            [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead
        ).GetAwaiter().GetResult()
    }
    finally {
        if ($null -eq $response) {
            $message.Dispose()
        }
    }

    try {
        $contentLength = $response.Content.Headers.ContentLength
        if ($contentLength -and $contentLength -gt $MaxBytes) {
            Throw-ProxyError -StatusCode 413 -Message "Upstream response exceeds limit of $MaxBytes bytes"
        }

        $bodyBytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        if ($bodyBytes.LongLength -gt $MaxBytes) {
            Throw-ProxyError -StatusCode 413 -Message "Upstream response exceeds limit of $MaxBytes bytes"
        }

        $headers = @{}
        foreach ($header in $response.Headers) {
            $headers[$header.Key] = ($header.Value -join ", ")
        }
        foreach ($header in $response.Content.Headers) {
            $headers[$header.Key] = ($header.Value -join ", ")
        }

        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            ReasonPhrase = [string]$response.ReasonPhrase
            FinalUrl = [string]$response.RequestMessage.RequestUri.AbsoluteUri
            Headers = $headers
            BodyBytes = $bodyBytes
            ContentType = [string]$response.Content.Headers.ContentType
        }
    }
    finally {
        $response.Dispose()
        $message.Dispose()
    }
}

function Write-UpstreamResponse {
    param(
        [System.Net.HttpListenerResponse]$Response,
        [pscustomobject]$Result,
        [System.Net.HttpListenerRequest]$Request
    )

    $Response.StatusCode = [int]$Result.StatusCode
    Set-CorsHeaders -Response $Response -Request $Request
    $Response.Headers["X-Proxy-Final-Url"] = $Result.FinalUrl
    $Response.Headers["X-Proxy-Status"] = [string]$Result.StatusCode
    $Response.Headers["X-Proxy-Status-Text"] = $Result.ReasonPhrase
    if (-not [string]::IsNullOrWhiteSpace($Result.ContentType)) {
        $Response.ContentType = $Result.ContentType
    }

    foreach ($entry in $Result.Headers.GetEnumerator()) {
        $lower = $entry.Key.ToLowerInvariant()
        if ($script:HopByHopHeaders -contains $lower) { continue }
        try {
            $Response.Headers[$entry.Key] = [string]$entry.Value
        }
        catch {
            # Skip invalid response headers.
        }
    }

    $Response.ContentLength64 = $Result.BodyBytes.LongLength
    $Response.OutputStream.Write($Result.BodyBytes, 0, $Result.BodyBytes.Length)
}

function Handle-Context {
    param(
        [System.Net.HttpListenerContext]$Context,
        [System.Net.Http.HttpClient]$HttpClient
    )

    $request = $Context.Request
    $response = $Context.Response
    $targetUrl = ""

    try {
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            Set-CorsHeaders -Response $response -Request $request
            $response.ContentLength64 = 0
            return
        }

        $path = $request.Url.AbsolutePath
        if ($request.HttpMethod -eq "GET" -and $path -eq "/health") {
            Write-JsonResponse -Response $response -Request $request -StatusCode 200 -Payload @{
                ok = $true
                service = "mybookmarks-local-http-proxy"
                host = $HostName
                port = $Port
                timeoutSec = $TimeoutSec
                maxResponseBytes = $MaxResponseBytes
                allowPrivateNetwork = [bool]$AllowPrivateNetwork
                routes = @("GET /health", "GET /proxy?url=...", "POST /proxy")
            }
            return
        }

        if ($request.HttpMethod -eq "GET" -and $path -eq "/proxy") {
            $targetUrl = $request.QueryString["url"]
            $spec = [pscustomobject]@{
                url = $targetUrl
                method = "GET"
                headers = (Convert-RequestHeadersToHashtable -Headers $request.Headers)
            }
            $result = Invoke-ProxyRequest -Spec $spec -HttpClient $HttpClient -AllowPrivateTargets ([bool]$AllowPrivateNetwork) -MaxBytes $MaxResponseBytes
            Write-UpstreamResponse -Response $response -Request $request -Result $result
            return
        }

        if ($request.HttpMethod -eq "POST" -and $path -eq "/proxy") {
            $bodyBytes = Get-RequestBytes -Stream $request.InputStream -MaxBytes $MaxResponseBytes
            if ($bodyBytes.Length -eq 0) {
                Throw-ProxyError -StatusCode 400 -Message "POST /proxy expects a JSON request body"
            }

            $bodyText = [System.Text.Encoding]::UTF8.GetString($bodyBytes)
            try {
                $spec = $bodyText | ConvertFrom-Json
            }
            catch {
                Throw-ProxyError -StatusCode 400 -Message "Invalid JSON body: $($_.Exception.Message)"
            }
            if ($spec -isnot [pscustomobject]) {
                Throw-ProxyError -StatusCode 400 -Message "JSON body must be an object"
            }
            $targetUrl = if ($null -ne $spec.PSObject.Properties["url"]) { [string]$spec.url } else { "" }

            $result = Invoke-ProxyRequest -Spec $spec -HttpClient $HttpClient -AllowPrivateTargets ([bool]$AllowPrivateNetwork) -MaxBytes $MaxResponseBytes
            $returnMode = if ($null -ne $spec.PSObject.Properties["returnMode"]) { [string]$spec.returnMode } else { "auto" }
            $returnMode = $returnMode.ToLowerInvariant()
            if ($returnMode -notin @("auto", "text", "base64")) {
                Throw-ProxyError -StatusCode 400 -Message "returnMode must be one of: auto, text, base64"
            }

            $bodyKind = "base64"
            $payload = @{
                ok = ($result.StatusCode -ge 200 -and $result.StatusCode -lt 300)
                status = $result.StatusCode
                statusText = $result.ReasonPhrase
                finalUrl = $result.FinalUrl
                headers = $result.Headers
            }

            $shouldReturnText = $false
            if ($returnMode -eq "text") {
                $shouldReturnText = $true
            }
            elseif ($returnMode -eq "auto") {
                $shouldReturnText = Test-IsTextualContentType -ContentType $result.ContentType
                if (-not $shouldReturnText -and [string]::IsNullOrWhiteSpace($result.ContentType)) {
                    try {
                        [void][System.Text.Encoding]::UTF8.GetString($result.BodyBytes)
                        $shouldReturnText = $true
                    }
                    catch {
                        $shouldReturnText = $false
                    }
                }
            }

            if ($returnMode -eq "base64" -or -not $shouldReturnText) {
                $payload["bodyKind"] = "base64"
                $payload["bodyBase64"] = [Convert]::ToBase64String($result.BodyBytes)
            }
            else {
                $payload["bodyKind"] = "text"
                $charsetName = Get-Charset -ContentType $result.ContentType
                try {
                    $encoding = [System.Text.Encoding]::GetEncoding($charsetName)
                }
                catch {
                    $encoding = [System.Text.Encoding]::UTF8
                }
                $payload["bodyText"] = $encoding.GetString($result.BodyBytes)
            }

            Write-JsonResponse -Response $response -Request $request -StatusCode 200 -Payload $payload
            return
        }

        Write-JsonResponse -Response $response -Request $request -StatusCode 404 -Payload @{
            ok = $false
            status = 404
            error = "Route not found"
        }
    }
    catch {
        $statusCode = 400
        $errorMessage = $_.Exception.Message
        if ($errorMessage -match '^(\d{3})\|(.*)$') {
            $statusCode = [int]$matches[1]
            $errorMessage = $matches[2].Trim()
        }
        $safeTargetUrl = if ([string]::IsNullOrWhiteSpace($targetUrl)) { "<unknown>" } else { $targetUrl.Trim() }
        Write-Warning ("[proxy] {0} {1} target={2} failed with {3}: {4}" -f $request.HttpMethod, $request.Url.AbsolutePath, $safeTargetUrl, $statusCode, $errorMessage)
        Write-JsonResponse -Response $response -Request $request -StatusCode $statusCode -Payload @{
            ok = $false
            status = $statusCode
            error = $errorMessage
        }
    }
    finally {
        $response.OutputStream.Close()
    }
}

$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $true
$handler.UseProxy = $false
$decompression = [System.Net.DecompressionMethods]::GZip -bor [System.Net.DecompressionMethods]::Deflate
if ([enum]::GetNames([System.Net.DecompressionMethods]) -contains "Brotli") {
    $decompression = $decompression -bor [System.Net.DecompressionMethods]::Brotli
}
$handler.AutomaticDecompression = $decompression
$httpClient = [System.Net.Http.HttpClient]::new($handler)
$httpClient.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)

$prefix = "http://$HostName`:$Port/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$script:Listener = $listener

try {
    $listener.Start()
}
catch {
    Write-Error "Failed to bind $prefix : $($_.Exception.Message)"
    exit 1
}

$null = Register-EngineEvent PowerShell.Exiting -Action {
    if ($script:Listener -and $script:Listener.IsListening) {
        $script:Listener.Stop()
        $script:Listener.Close()
    }
}

$allowPrivateNetworkText = ([bool]$AllowPrivateNetwork).ToString().ToLowerInvariant()
Write-Host "MyBookmarks local proxy listening on $prefix (allow_private_network=$allowPrivateNetworkText)"
Write-Host "Routes: GET /health, GET /proxy?url=..., POST /proxy"
Write-Host "Press Ctrl+C to stop."

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            Handle-Context -Context $context -HttpClient $httpClient
        }
        catch [System.Net.HttpListenerException] {
            break
        }
    }
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
    $httpClient.Dispose()
    $handler.Dispose()
}
