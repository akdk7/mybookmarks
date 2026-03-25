# Local Proxy Scripts

This folder contains a second integration path next to the browser extensions:

- `local-http-proxy.py`
- `local-http-proxy.ps1`

Both scripts start a small local HTTP proxy that exposes the same routes:

- `GET /health`
- `GET /proxy?url=https%3A%2F%2Fexample.com`
- `POST /proxy`

The goal is to let `MyBookmarks` reach external HTTP/HTTPS targets through a local port without requiring a browser extension for those network requests.

Both proxies can also read local files through `file://` URLs, but only when you enable that explicitly and restrict access to allowed root directories.

## Important limitation

This proxy does **not** replace browser-extension features that depend on browser APIs, especially:

- reading browser bookmarks
- direct extension messaging
- privileged browser-side APIs

It is meant as an alternative for outbound web requests, metadata fetches, DAV/CardDAV requests, imports, and similar HTTP-based integrations.

## Security defaults

By default both scripts:

- bind to `127.0.0.1`
- only allow `http://` and `https://` targets
- block requests to `localhost`, loopback, RFC1918/private, link-local, multicast, and similar internal targets
- block `file://` targets entirely

If you explicitly need private/internal targets, start the script with the matching allow flag:

- Python: `--allow-private-network`
- PowerShell: `-AllowPrivateNetwork`

Only use that mode if you trust the client side that can access the proxy port.

If you explicitly need local file access, start the proxy with:

- Python: `--allow-file-scheme --file-root /absolute/path`
- PowerShell: `-AllowFileScheme -FileRoot /absolute/path`

For multiple directories:

- Python: repeat `--file-root`
- PowerShell: pass multiple values to `-FileRoot`

## Start

### Python

```bash
python3 local2/extensions/proxy/local-http-proxy.py --port 8788
```

Example with multiple allowed file roots:

```bash
python3 local2/extensions/proxy/local-http-proxy.py \
  --port 8788 \
  --allow-file-scheme \
  --file-root /tmp/data \
  --file-root /Volumes/4TB/git/mybookmarks/local2
```

### PowerShell

```powershell
pwsh -File local2/extensions/proxy/local-http-proxy.ps1 -Port 8788
```

Example with multiple allowed file roots:

```powershell
pwsh -File local2/extensions/proxy/local-http-proxy.ps1 `
  -Port 8788 `
  -AllowFileScheme `
  -FileRoot /tmp/data,/Volumes/4TB/git/mybookmarks/local2
```

Both scripts support:

- host override: `--host` / `-HostName`
- port override: `--port` / `-Port`
- timeout override: `--timeout-sec` / `-TimeoutSec`
- max response size: `--max-response-bytes` / `-MaxResponseBytes`
- local file access: `--allow-file-scheme --file-root ...` / `-AllowFileScheme -FileRoot ...`

Python also supports HTTPS trust configuration:

- `--ca-bundle /path/to/cacert.pem`
- `--insecure-skip-tls-verify`

For the Python proxy, the environment variables `SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE`, and `CURL_CA_BUNDLE` are also honored automatically when present.

## Configure in MyBookmarks

After the proxy is running, open the app and go to:

- `Options`
- `Transport`
- `Web request transport` -> `Manual proxy`
- `Proxy base URL` -> e.g. `http://127.0.0.1:8788`

This switches metadata fetches, remote imports, DAV/CardDAV requests, and similar web requests to the local proxy transport.

## Endpoints

### `GET /health`

Example:

```bash
curl http://127.0.0.1:8788/health
```

### `GET /proxy?url=...`

For simple GET passthrough requests. The upstream response body is returned directly, with CORS headers added by the local proxy.

Example:

```bash
curl "http://127.0.0.1:8788/proxy?url=https%3A%2F%2Fexample.com"
```

Local file example after starting the proxy with `--allow-file-scheme` and an allowed root:

```bash
curl "http://127.0.0.1:8788/proxy?url=file%3A%2F%2F%2Fabsolute%2Fpath%2Fto%2Fexample.csv"
```

### `POST /proxy`

For custom methods, headers, and bodies. The response is wrapped as JSON.

Request body:

```json
{
  "url": "https://example.com",
  "method": "GET",
  "headers": {
    "Accept": "application/json"
  },
  "returnMode": "auto"
}
```

Supported request fields:

- `url` required
- `method` optional, default `GET`
- `headers` optional object
- `bodyText` optional UTF-8 request body
- `bodyBase64` optional binary request body
- `returnMode` optional: `auto`, `text`, `base64`

For `file://` targets:

- only `GET` and `HEAD` are supported
- request bodies are rejected
- the resolved file must be inside one of the configured file roots

Response body:

```json
{
  "ok": true,
  "status": 200,
  "statusText": "OK",
  "finalUrl": "https://example.com/",
  "headers": {
    "Content-Type": "text/html"
  },
  "bodyKind": "text",
  "bodyText": "<!doctype html>..."
}
```

## Browser example

```js
const res = await fetch("http://127.0.0.1:8788/proxy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://example.com",
    method: "GET",
    headers: { Accept: "text/html" },
    returnMode: "text"
  })
});

const data = await res.json();
console.log(data.status, data.bodyKind, data.bodyText);
```

## DAV/CardDAV example

```js
const res = await fetch("http://127.0.0.1:8788/proxy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://cloud.example.com/remote.php/dav/addressbooks/users/demo/",
    method: "PROPFIND",
    headers: {
      Authorization: "Basic ...",
      Depth: "1",
      "Content-Type": "application/xml; charset=utf-8"
    },
    bodyText: "<?xml version=\"1.0\"?><d:propfind xmlns:d=\"DAV:\"><d:allprop/></d:propfind>",
    returnMode: "text"
  })
});
```

## Notes

- The proxy is intentionally local-first. Exposing it on `0.0.0.0` or opening the port beyond localhost should be a deliberate decision.
- Enabling `file://` access is sensitive because it exposes local files through HTTP. Keep file roots as narrow as possible.
- PowerShell uses `HttpListener`. Depending on the host OS and port, URL ACL or elevated rights may be required.
- The scripts are dependency-free and only use the Python / PowerShell standard libraries.

## Troubleshooting

### `CERTIFICATE_VERIFY_FAILED` in the Python proxy

If the proxy logs an error like this:

```text
[proxy] POST /proxy target=https://... failed with 502: TLS certificate verification failed: ...
```

then Python cannot validate the HTTPS certificate chain of the upstream target.

Preferred fixes:

- start the proxy with an explicit CA bundle:

```bash
python3 local2/extensions/proxy/local-http-proxy.py --port 8788 --ca-bundle /path/to/cacert.pem
```

- or export a CA bundle path before starting the proxy:

```bash
export SSL_CERT_FILE=/path/to/cacert.pem
python3 local2/extensions/proxy/local-http-proxy.py --port 8788
```

Last resort for local debugging only:

```bash
python3 local2/extensions/proxy/local-http-proxy.py --port 8788 --insecure-skip-tls-verify
```

That disables HTTPS certificate verification and should not be used as a normal setup.

If you are on Windows or already trust the target certificate in the OS, the PowerShell proxy can also be a useful alternative because it relies on the platform trust store.
