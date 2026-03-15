#!/usr/bin/env python3
"""
Local HTTP/HTTPS proxy helper for MyBookmarks.

Routes:
- GET  /health
- GET  /proxy?url=https%3A%2F%2Fexample.com
- POST /proxy

The POST /proxy endpoint accepts JSON like:
{
  "url": "https://example.com",
  "method": "GET",
  "headers": { "Accept": "application/json" },
  "bodyText": "...",
  "bodyBase64": "...",
  "returnMode": "auto"
}
"""

from __future__ import annotations

import argparse
import base64
import ipaddress
import json
import os
import socket
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Dict, Iterable, List, Tuple


DEFAULT_TIMEOUT_SEC = 20
DEFAULT_MAX_RESPONSE_BYTES = 10 * 1024 * 1024
CHUNK_SIZE = 64 * 1024
ENV_CA_BUNDLE_VARS = ("SSL_CERT_FILE", "REQUESTS_CA_BUNDLE", "CURL_CA_BUNDLE")
COMMON_CA_BUNDLE_PATHS = (
    "/etc/ssl/cert.pem",
    "/private/etc/ssl/cert.pem",
    "/etc/ssl/certs/ca-certificates.crt",
    "/etc/pki/tls/certs/ca-bundle.crt",
    "/etc/ssl/ca-bundle.pem",
)

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}

TEXTUAL_CONTENT_TYPES = (
    "application/json",
    "application/javascript",
    "application/xml",
    "application/xhtml+xml",
    "application/x-www-form-urlencoded",
    "image/svg+xml",
)


class ProxyError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


@dataclass
class ProxyConfig:
    host: str
    port: int
    timeout_sec: int
    max_response_bytes: int
    allow_private_network: bool
    ca_bundle: str | None
    insecure_skip_tls_verify: bool


class ProxyHTTPServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, server_address: Tuple[str, int], handler_class, config: ProxyConfig) -> None:
        super().__init__(server_address, handler_class)
        self.config = config
        # Ignore system proxy variables. This helper should connect directly.
        self.opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPSHandler(context=build_ssl_context(config)),
        )


def is_textual_content_type(content_type: str) -> bool:
    lowered = (content_type or "").lower()
    if not lowered:
        return False
    if lowered.startswith("text/"):
        return True
    if any(lowered.startswith(item) for item in TEXTUAL_CONTENT_TYPES):
        return True
    if "+json" in lowered or "+xml" in lowered:
        return True
    return False


def get_charset(content_type: str) -> str:
    for part in (content_type or "").split(";")[1:]:
        name, _, value = part.partition("=")
        if name.strip().lower() == "charset" and value.strip():
            return value.strip().strip('"')
    return "utf-8"


def strip_hop_by_hop(headers: Iterable[Tuple[str, str]]) -> List[Tuple[str, str]]:
    cleaned: List[Tuple[str, str]] = []
    for key, value in headers:
        lowered = key.lower()
        if lowered in HOP_BY_HOP_HEADERS:
            continue
        if lowered == "content-length":
            continue
        cleaned.append((key, value))
    return cleaned


def read_limited(stream, max_bytes: int) -> bytes:
    chunks: List[bytes] = []
    total = 0
    while True:
        chunk = stream.read(CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise ProxyError(413, f"Upstream response exceeds limit of {max_bytes} bytes")
        chunks.append(chunk)
    return b"".join(chunks)


def read_request_body(stream, content_length: int, max_bytes: int) -> bytes:
    if content_length > max_bytes:
        raise ProxyError(413, f"Request body exceeds limit of {max_bytes} bytes")
    payload = stream.read(content_length)
    if len(payload) != content_length:
        raise ProxyError(400, "Incomplete request body")
    return payload


def normalize_existing_file_path(raw_path: str, description: str) -> str:
    candidate = os.path.abspath(os.path.expanduser(str(raw_path).strip()))
    if not os.path.isfile(candidate):
        raise ValueError(f"{description} not found: {raw_path}")
    return candidate


def auto_detect_ca_bundle_path() -> str | None:
    candidates: List[Tuple[str, str]] = []
    for env_name in ENV_CA_BUNDLE_VARS:
        env_value = os.getenv(env_name)
        if env_value and env_value.strip():
            candidates.append((env_value, f"${env_name}"))
    for path in COMMON_CA_BUNDLE_PATHS:
        candidates.append((path, path))

    try:
        import certifi  # type: ignore
    except ImportError:
        certifi = None

    if certifi is not None:
        candidates.append((certifi.where(), "certifi"))

    seen: set[str] = set()
    for candidate, label in candidates:
        try:
            normalized = normalize_existing_file_path(candidate, label)
        except ValueError:
            continue
        if normalized in seen:
            continue
        seen.add(normalized)
        return normalized
    return None


def build_ssl_context(config: ProxyConfig) -> ssl.SSLContext:
    context = ssl.create_default_context()
    if config.insecure_skip_tls_verify:
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        return context
    if config.ca_bundle:
        context.load_verify_locations(cafile=config.ca_bundle)
    return context


def format_upstream_url_error(reason: object, config: ProxyConfig) -> str:
    current = reason
    seen_ids: set[int] = set()
    while current is not None and id(current) not in seen_ids:
        seen_ids.add(id(current))
        if isinstance(current, ssl.SSLCertVerificationError) or (
            isinstance(current, ssl.SSLError) and "CERTIFICATE_VERIFY_FAILED" in str(current)
        ):
            detail = str(current).strip() or "certificate verification failed"
            if config.ca_bundle:
                hint = (
                    f"Configured CA bundle: {config.ca_bundle}. "
                    "Verify that the bundle contains the required issuer certificate, "
                    "or use --insecure-skip-tls-verify only for local debugging."
                )
            else:
                hint = (
                    "Provide a CA bundle with --ca-bundle /path/to/cacert.pem, "
                    "or set SSL_CERT_FILE / REQUESTS_CA_BUNDLE / CURL_CA_BUNDLE. "
                    "Use --insecure-skip-tls-verify only for local debugging."
                )
            return f"TLS certificate verification failed: {detail}. {hint}"
        if isinstance(current, ssl.SSLError):
            return f"TLS/SSL handshake failed: {current}"
        current = getattr(current, "reason", None) or getattr(current, "__cause__", None)

    return f"Upstream request failed: {reason}"


def validate_target_url(raw_url: str, allow_private_network: bool) -> urllib.parse.ParseResult:
    if not raw_url:
        raise ProxyError(400, "Missing url parameter")

    parsed = urllib.parse.urlparse(raw_url)
    if parsed.scheme not in {"http", "https"}:
        raise ProxyError(400, "Only http:// and https:// URLs are supported")
    if not parsed.hostname:
        raise ProxyError(400, "Target URL must include a hostname")

    if allow_private_network:
        return parsed

    hostname = parsed.hostname
    if hostname.lower() == "localhost":
        raise ProxyError(403, "Requests to localhost are blocked by default")

    try:
        addr_infos = socket.getaddrinfo(
            hostname,
            parsed.port or (443 if parsed.scheme == "https" else 80),
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        raise ProxyError(502, f"DNS resolution failed for {hostname}: {exc}") from exc

    addresses = {info[4][0] for info in addr_infos}
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise ProxyError(
                403,
                f"Requests to private or local targets are blocked by default ({hostname} -> {address})",
            )

    return parsed


class ProxyRequestHandler(BaseHTTPRequestHandler):
    server_version = "MyBookmarksLocalProxy/1.0"
    protocol_version = "HTTP/1.1"

    @property
    def config(self) -> ProxyConfig:
        return self.server.config

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write(
            "%s - - [%s] %s\n"
            % (self.client_address[0], self.log_date_time_string(), fmt % args)
        )

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._write_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/health":
            self._send_json(
                200,
                {
                    "ok": True,
                    "service": "mybookmarks-local-http-proxy",
                    "host": self.config.host,
                    "port": self.config.port,
                    "timeoutSec": self.config.timeout_sec,
                    "maxResponseBytes": self.config.max_response_bytes,
                    "allowPrivateNetwork": self.config.allow_private_network,
                    "tlsVerification": not self.config.insecure_skip_tls_verify,
                    "caBundle": self.config.ca_bundle,
                    "routes": ["GET /health", "GET /proxy?url=...", "POST /proxy"],
                },
            )
            return

        if parsed.path == "/proxy":
            self._handle_proxy_get(parsed)
            return

        self._send_error_json(404, "Route not found")

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/proxy":
            self._send_error_json(404, "Route not found")
            return
        target_url = ""

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_error_json(400, "Invalid Content-Length header")
            return

        if content_length <= 0:
            self._send_error_json(400, "POST /proxy expects a JSON request body")
            return

        try:
            payload = read_request_body(self.rfile, content_length, self.config.max_response_bytes)
        except ProxyError as exc:
            self._send_error_json(exc.status_code, exc.message)
            return

        try:
            spec = json.loads(payload.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            self._send_error_json(400, f"Invalid JSON body: {exc}")
            return

        if not isinstance(spec, dict):
            self._send_error_json(400, "JSON body must be an object")
            return
        target_url = str(spec.get("url") or "").strip()

        try:
            result = self._perform_proxy_request(spec)
        except ProxyError as exc:
            self._log_proxy_error("POST /proxy", target_url, exc)
            self._send_error_json(exc.status_code, exc.message)
            return

        content_type = result["content_type"]
        return_mode = str(spec.get("returnMode") or "auto").lower()
        if return_mode not in {"auto", "text", "base64"}:
            self._send_error_json(400, "returnMode must be one of: auto, text, base64")
            return

        body_bytes = result["body"]
        body_kind = "base64"
        body_text = None
        body_base64 = None

        if return_mode == "base64":
            body_base64 = base64.b64encode(body_bytes).decode("ascii")
        else:
            should_return_text = return_mode == "text" or is_textual_content_type(content_type)
            if not should_return_text and not content_type:
                try:
                    body_text = body_bytes.decode("utf-8")
                    should_return_text = True
                except UnicodeDecodeError:
                    should_return_text = False
            if should_return_text:
                body_kind = "text"
                try:
                    body_text = body_bytes.decode(get_charset(content_type), errors="replace")
                except LookupError:
                    body_text = body_bytes.decode("utf-8", errors="replace")
            else:
                body_base64 = base64.b64encode(body_bytes).decode("ascii")

        response_payload = {
            "ok": 200 <= result["status"] < 300,
            "status": result["status"],
            "statusText": result["status_text"],
            "finalUrl": result["final_url"],
            "headers": result["headers"],
            "bodyKind": body_kind,
        }
        if body_text is not None:
            response_payload["bodyText"] = body_text
        if body_base64 is not None:
            response_payload["bodyBase64"] = body_base64

        self._send_json(200, response_payload)

    def _handle_proxy_get(self, parsed_request: urllib.parse.ParseResult) -> None:
        query = urllib.parse.parse_qs(parsed_request.query)
        target_url = (query.get("url") or [""])[0]

        try:
            result = self._perform_proxy_request(
                {
                    "url": target_url,
                    "method": "GET",
                    "headers": self._headers_to_dict(self.headers.items()),
                }
            )
        except ProxyError as exc:
            self._log_proxy_error("GET /proxy", target_url, exc)
            self._send_error_json(exc.status_code, exc.message)
            return

        self.send_response(result["status"])
        self._write_cors_headers()
        self.send_header("X-Proxy-Final-Url", result["final_url"])
        self.send_header("X-Proxy-Status", str(result["status"]))
        self.send_header("X-Proxy-Status-Text", result["status_text"])
        for key, value in result["raw_headers"]:
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(result["body"])))
        self.end_headers()
        self.wfile.write(result["body"])

    def _perform_proxy_request(self, spec: Dict[str, object]) -> Dict[str, object]:
        url = str(spec.get("url") or "").strip()
        method = str(spec.get("method") or "GET").upper()
        body_text = spec.get("bodyText")
        body_base64 = spec.get("bodyBase64")
        header_map = spec.get("headers") or {}

        if body_text is not None and body_base64 is not None:
            raise ProxyError(400, "Use either bodyText or bodyBase64, not both")
        if not isinstance(header_map, dict):
            raise ProxyError(400, "headers must be an object")

        validate_target_url(url, self.config.allow_private_network)

        body_bytes = None
        if body_text is not None:
            body_bytes = str(body_text).encode("utf-8")
        elif body_base64 is not None:
            try:
                body_bytes = base64.b64decode(str(body_base64), validate=True)
            except (base64.binascii.Error, ValueError) as exc:
                raise ProxyError(400, f"bodyBase64 is not valid base64: {exc}") from exc

        outgoing_headers = self._sanitize_outgoing_headers(self._headers_to_dict(header_map.items()))
        request = urllib.request.Request(url=url, data=body_bytes, headers=outgoing_headers, method=method)

        try:
            with self.server.opener.open(request, timeout=self.config.timeout_sec) as response:
                status = getattr(response, "status", response.getcode())
                status_text = getattr(response, "reason", "") or ""
                final_url = response.geturl()
                raw_headers = strip_hop_by_hop(response.headers.items())
                headers = self._headers_to_dict(raw_headers)
                body = read_limited(response, self.config.max_response_bytes)
        except urllib.error.HTTPError as exc:
            try:
                body = read_limited(exc, self.config.max_response_bytes)
            except ProxyError:
                raise
            raw_headers = strip_hop_by_hop(exc.headers.items())
            headers = self._headers_to_dict(raw_headers)
            status = exc.code
            status_text = str(exc.reason or "")
            final_url = exc.geturl() or url
        except (socket.timeout, TimeoutError) as exc:
            raise ProxyError(504, f"Upstream request timed out after {self.config.timeout_sec}s") from exc
        except ssl.SSLError as exc:
            raise ProxyError(502, format_upstream_url_error(exc, self.config)) from exc
        except urllib.error.URLError as exc:
            reason = exc.reason if hasattr(exc, "reason") else exc
            raise ProxyError(502, format_upstream_url_error(reason, self.config)) from exc

        return {
            "status": status,
            "status_text": status_text,
            "final_url": final_url,
            "headers": headers,
            "raw_headers": raw_headers,
            "body": body,
            "content_type": headers.get("Content-Type", headers.get("content-type", "")),
        }

    def _sanitize_outgoing_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        clean: Dict[str, str] = {}
        for key, value in headers.items():
            lowered = key.lower()
            if lowered in HOP_BY_HOP_HEADERS:
                continue
            if lowered in {"host", "content-length", "accept-encoding"}:
                continue
            clean[key] = value
        if not any(key.lower() == "user-agent" for key in clean):
            clean["User-Agent"] = "MyBookmarksLocalProxy/1.0"
        return clean

    def _headers_to_dict(self, pairs: Iterable[Tuple[str, str]]) -> Dict[str, str]:
        normalized: Dict[str, List[str]] = {}
        original_case: Dict[str, str] = {}
        for key, value in pairs:
            if value is None:
                continue
            lowered = str(key).lower()
            if lowered not in normalized:
                normalized[lowered] = []
                original_case[lowered] = str(key)
            normalized[lowered].append(str(value))
        return {
            original_case[lowered]: ", ".join(values)
            for lowered, values in normalized.items()
        }

    def _write_cors_headers(self) -> None:
        origin = str(self.headers.get("Origin") or "").strip()
        allow_origin = origin if origin and origin.lower() != "null" else "*"
        request_headers = str(self.headers.get("Access-Control-Request-Headers") or "").strip()
        allow_headers = request_headers or "Authorization, Cache-Control, Content-Type, Depth, Destination, If-Match, Overwrite, Pragma, X-Requested-With"
        self.send_header("Access-Control-Allow-Origin", allow_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Allow-Headers", allow_headers)
        self.send_header(
            "Access-Control-Expose-Headers",
            "Content-Length, Content-Type, X-Proxy-Final-Url, X-Proxy-Status, X-Proxy-Status-Text",
        )
        self.send_header("Vary", "Origin, Access-Control-Request-Headers, Access-Control-Request-Private-Network")
        self.send_header("Cache-Control", "no-store")

    def _log_proxy_error(self, route: str, target_url: str, exc: ProxyError) -> None:
        safe_route = str(route or "").strip() or "proxy"
        safe_target = str(target_url or "").strip() or "<unknown>"
        safe_message = str(exc.message or "").strip() or "Unknown proxy error"
        sys.stderr.write(f"[proxy] {safe_route} target={safe_target} failed with {exc.status_code}: {safe_message}\n")

    def _send_json(self, status_code: int, payload: Dict[str, object]) -> None:
        data = json.dumps(payload, ensure_ascii=True, indent=2).encode("utf-8")
        self.send_response(status_code)
        self._write_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_error_json(self, status_code: int, message: str) -> None:
        self._send_json(status_code, {"ok": False, "error": message, "status": status_code})


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start the MyBookmarks local HTTP proxy")
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8788, help="Bind port (default: 8788)")
    parser.add_argument(
        "--timeout-sec",
        type=int,
        default=DEFAULT_TIMEOUT_SEC,
        help=f"Upstream timeout in seconds (default: {DEFAULT_TIMEOUT_SEC})",
    )
    parser.add_argument(
        "--max-response-bytes",
        type=int,
        default=DEFAULT_MAX_RESPONSE_BYTES,
        help=f"Maximum upstream response size in bytes (default: {DEFAULT_MAX_RESPONSE_BYTES})",
    )
    parser.add_argument(
        "--allow-private-network",
        action="store_true",
        help="Allow requests to localhost, RFC1918 and other private/internal targets",
    )
    tls_group = parser.add_mutually_exclusive_group()
    tls_group.add_argument(
        "--ca-bundle",
        help="Path to a PEM bundle used for HTTPS certificate verification",
    )
    tls_group.add_argument(
        "--insecure-skip-tls-verify",
        action="store_true",
        help="Disable HTTPS certificate verification for upstream requests (debugging only)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.insecure_skip_tls_verify:
            ca_bundle = None
        elif args.ca_bundle:
            ca_bundle = normalize_existing_file_path(args.ca_bundle, "CA bundle")
        else:
            ca_bundle = auto_detect_ca_bundle_path()
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    config = ProxyConfig(
        host=args.host,
        port=args.port,
        timeout_sec=args.timeout_sec,
        max_response_bytes=args.max_response_bytes,
        allow_private_network=args.allow_private_network,
        ca_bundle=ca_bundle,
        insecure_skip_tls_verify=args.insecure_skip_tls_verify,
    )

    try:
        server = ProxyHTTPServer((config.host, config.port), ProxyRequestHandler, config)
    except OSError as exc:
        print(f"Failed to bind {config.host}:{config.port}: {exc}", file=sys.stderr)
        return 1

    print(
        f"MyBookmarks local proxy listening on http://{config.host}:{config.port} "
        f"(allow_private_network={str(config.allow_private_network).lower()})"
    )
    if config.insecure_skip_tls_verify:
        print("HTTPS certificate verification: disabled (--insecure-skip-tls-verify)")
    elif config.ca_bundle:
        print(f"HTTPS certificate verification: enabled (ca_bundle={config.ca_bundle})")
    else:
        print("HTTPS certificate verification: enabled (system trust store)")
    print("Routes: GET /health, GET /proxy?url=..., POST /proxy")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping proxy...")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
