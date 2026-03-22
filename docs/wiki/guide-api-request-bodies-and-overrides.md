# Guide: API Request Bodies and Overrides

## Purpose

This guide explains how request bodies work in MyBookmarks API integrations.

Use it when you want to understand:

- when an endpoint should send no body at all
- how `JSON`, `Text`, and `Form URL encoded` body modes differ
- how placeholders are inserted into the body
- how link-local request overrides affect the body later

If you need the full reference first, see:

- [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)

Related pages:

- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Placeholder Sources and Actions](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Placeholder-Sources-and-Actions)
- [Guide: API Response Mapping Recipes](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Response-Mapping-Recipes)

## First principle

The request body belongs to the `Endpoint`.

That means:

- the endpoint defines the normal body shape
- placeholder sources and action templates reuse that endpoint
- link-level overrides can adjust the body later without redefining the endpoint itself

Short version:

```text
Connection -> Endpoint body -> Placeholder Source / Action Template -> optional link override
```

## The four body modes

### 1. `No body`

Use this when the request should not send a body at all.

Typical cases:

- most `GET` requests
- `DELETE` endpoints that only use path and query parameters
- simple lookups where the entire request is already described by URL and headers

### 2. `JSON`

Use this when the API expects structured JSON.

Typical cases:

- create or update operations
- POST/PATCH requests with several named fields
- APIs that document `application/json`

Example:

```json
{
  "project": "{{PROJECT}}",
  "environment": "{{ENVIRONMENT}}",
  "force": true
}
```

Important:

- MyBookmarks resolves placeholders first and then sends the final text
- the final result must still be valid JSON
- if no `Content-Type` header is set manually, MyBookmarks adds:

```text
application/json; charset=utf-8
```

### 3. `Text`

Use this when the API wants a raw text body.

Typical cases:

- plain-text command APIs
- custom text payloads
- endpoints that do not expect JSON or form data

Example:

```text
deploy={{PROJECT}}
```

If you do not set `Content-Type` manually, MyBookmarks adds:

```text
text/plain; charset=utf-8
```

### 4. `Form URL encoded`

Use this when the API expects classic form data.

Write one `name=value` pair per line in the body template.

Example:

```text
project={{PROJECT}}
environment={{ENVIRONMENT}}
force=true
```

MyBookmarks converts this into:

```text
project=core-platform&environment=prod&force=true
```

and sends it with:

```text
application/x-www-form-urlencoded; charset=utf-8
```

## How placeholders are resolved inside the body

The body is a template, not a script.

This means:

- `{{PROJECT}}` is replaced with the current placeholder value
- the same placeholder values can also be used in path, query, and headers
- the body does not have its own separate variable system

So if a previous prompt step or workflow step collected:

```text
PROJECT = core-platform
ENVIRONMENT = prod
```

then this JSON body:

```json
{
  "project": "{{PROJECT}}",
  "environment": "{{ENVIRONMENT}}"
}
```

becomes:

```json
{
  "project": "core-platform",
  "environment": "prod"
}
```

## Important rule for JSON bodies

Placeholder substitution is text-based.

That is usually what you want, but it also means:

- for string values, you normally put the placeholder in quotes
- for numbers or booleans, you only omit quotes if the resulting text should really be numeric or boolean JSON

Good:

```json
{
  "name": "{{PROJECT}}",
  "retryCount": 3,
  "enabled": true
}
```

Potentially wrong:

```json
{
  "retryCount": "{{RETRY_COUNT}}"
}
```

This would send `"3"` as a string, not `3` as a number.

Also potentially wrong:

```json
{
  "name": {{PROJECT}}
}
```

If `PROJECT` resolves to `core-platform`, the result is invalid JSON.

## Example patterns

### Pattern 1: create a ticket

Body mode:

```text
JSON
```

Body template:

```json
{
  "title": "{{TITLE}}",
  "description": "{{DESCRIPTION}}",
  "priority": "{{PRIORITY}}"
}
```

Use this when:

- the API expects a structured request object
- the prompt collects the input values first

### Pattern 2: submit a raw command

Body mode:

```text
Text
```

Body template:

```text
restart service={{SERVICE_NAME}}
```

Use this when:

- the remote API is command-oriented
- the server expects the entire payload as one plain string

### Pattern 3: classic form submission

Body mode:

```text
Form URL encoded
```

Body template:

```text
username={{USERNAME}}
token={{TOKEN}}
scope=deploy
```

Use this when:

- the server expects form-style POST fields
- the documentation mentions `application/x-www-form-urlencoded`

### Pattern 4: POST JSON, then write response data back into placeholders

This is a common action pattern:

- the request body sends a structured JSON payload
- the response returns JSON
- the action uses `Response mapping = Action result`
- part of the result should immediately update existing placeholder values at runtime

Example request body:

```json
{
  "project": "{{PROJECT}}",
  "environment": "{{ENVIRONMENT}}"
}
```

Example response body:

```json
{
  "success": true,
  "message": "Deployment queued",
  "data": {
    "jobId": "job-42",
    "status": "queued"
  }
}
```

Typical action setup after the request body:

1. response mapping mode `Action result`
2. data path `body.data`
3. write-back source `mapped.data`
4. write-back placeholders:

```text
LAST_JOB_ID=jobId
LAST_STATUS=status
```

This means:

- the request body still belongs to the endpoint
- the response mapping still belongs to the action template
- the write-back overrides existing placeholder values only for the current runtime session
- if the payload is too nested for direct field mapping, add `Write-back transform` before the final placeholder map

Use this when the UI should immediately reflect the action result without persisting the link itself.

## Link-local body overrides

Both placeholder sources and action templates can receive request overrides later at the link level.

That is useful when:

- one endpoint is shared across many links
- most links use the same base body
- one specific link needs a different body format or extra body values

Examples:

- the endpoint normally uses JSON, but one link disables the body completely
- the endpoint normally uses JSON, but one link supplies a different JSON template
- the endpoint normally uses `inherit`, but one placeholder binding switches to `No body`

Important behavior:

- `Use endpoint body mode` keeps the endpoint definition unchanged
- `No body` clears the body completely
- if the body mode changes but no new body template is provided, the body is intentionally cleared

This protects you from accidentally sending JSON text as form data or vice versa.

## How to decide where body logic belongs

Put it in the endpoint when:

- it is the normal request shape for that API call
- several sources or actions should reuse it

Use a link-level override when:

- only one link needs a different request body
- the base endpoint is still the right shared starting point

Do not create duplicate endpoints too early.

Often one clean endpoint plus a few link-local overrides is easier to maintain than many almost identical endpoints.

## Common mistakes

### Mistake 1: building a JSON body in `Text` mode

This may look correct in the editor, but the request semantics are different.

If the API expects JSON, use `JSON` mode.

### Mistake 2: forgetting that form bodies are line-based

For form mode, use:

```text
name=value
other=value
```

not raw JSON and not query strings with `&`.

### Mistake 3: using body values for data that really belongs in query or path

Do not push everything into the body.

Use:

- path for resource identity
- query for filters and switches
- body for structured request payload

### Mistake 4: invalid JSON after placeholder substitution

Always think about the final result after placeholders are inserted.

## Safe setup order

1. Create the endpoint with the intended body mode.
2. Enter a minimal body template.
3. Test the endpoint directly in `API Integrations`.
4. Only then bind it to a placeholder source or action template.
5. Add link-local overrides only after the base endpoint works.

## Related examples

- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Response Mapping Recipes](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Response-Mapping-Recipes)
- [Guide: API Placeholder Sources and Actions](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Placeholder-Sources-and-Actions)
