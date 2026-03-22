# Guide: API Response Mapping Recipes

## Purpose

This guide explains how to turn raw API responses into useful MyBookmarks data.

Use it when you want to understand:

- which mapping mode to choose
- how `rootPath` changes what the mapping sees
- when to use `Scalar`, `Options list`, `Object`, `Array`, or `Action result`
- how to map body fields, status fields, and structured action results

Reference:

- [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)

Related guides:

- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Request Bodies and Overrides](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Request-Bodies-and-Overrides)
- [Guide: API Placeholder Sources and Actions](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Placeholder-Sources-and-Actions)

## What a response mapping really does

A response mapping sits between:

- the parsed API response
- the place where MyBookmarks wants to use the result

The parsed response usually looks like:

```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json"
  },
  "body": {
    "items": [
      { "id": "dev", "name": "Development" },
      { "id": "prod", "name": "Production" }
    ]
  }
}
```

Most mappings default to the response body.

That means:

- empty `rootPath` usually means `response.body`
- `Action result` is special and often uses the full response context

## Choosing the right mapping mode

### `Scalar`

Use this when one request should produce exactly one value.

Examples:

- API returns one token
- API returns one customer name
- API returns one generated URL

### `Options list`

Use this when the result should fill a `select` or `multiselect`.

Examples:

- projects
- environments
- users

### `Object`

Use this when one response should populate several placeholders at once.

Examples:

- `CUSTOMER_NAME`
- `CUSTOMER_EMAIL`
- `CUSTOMER_REGION`

all from one API call

### `Array`

Use this when you want a structured list for preview, testing, or advanced action logic.

Important:

- `Array` is not supported for placeholder sources
- it is useful for inspection and some action-related flows

### `Action result`

Use this only for action templates.

It is the right mode when an API action should return:

- success state
- message
- redirect URL
- extra result data

## Recipe 1: map a single field

API body:

```json
{
  "token": "abc123"
}
```

Mapping:

- mode: `Scalar`
- root path: empty
- scalar path: `token`

Use this when one placeholder needs one final value.

## Recipe 2: fill a dropdown from an array

API body:

```json
{
  "projects": [
    { "id": "dev", "name": "Development" },
    { "id": "prod", "name": "Production" }
  ]
}
```

Mapping:

- mode: `Options list`
- collection path: `projects[*]`
- value path: `id`
- label path: `name`

Result:

- option value `dev`, label `Development`
- option value `prod`, label `Production`

Use this for API-backed `select` and `multiselect` placeholders.

## Recipe 3: populate multiple placeholders from one response

API body:

```json
{
  "customer": {
    "name": "Alice Example",
    "email": "alice@example.com",
    "region": "eu"
  }
}
```

Mapping:

- mode: `Object`
- object fields:
  - `CUSTOMER_NAME` -> `customer.name`
  - `CUSTOMER_EMAIL` -> `customer.email`
  - `CUSTOMER_REGION` -> `customer.region`

Use this when one API call should enrich a whole prompt step.

## Recipe 4: map from a nested body root first

API body:

```json
{
  "data": {
    "items": [
      { "code": "eu", "title": "Europe" },
      { "code": "us", "title": "United States" }
    ]
  }
}
```

Two ways to do it:

### Option A: direct paths

- collection path: `data.items[*]`
- value path: `code`
- label path: `title`

### Option B: set `rootPath`

- root path: `data`
- collection path: `items[*]`
- value path: `code`
- label path: `title`

Use `rootPath` when many later paths share the same prefix.

## Recipe 5: read from the full action response

Sometimes the interesting value is not only in `body`.

Example response context:

```json
{
  "status": 201,
  "statusText": "Created",
  "headers": {
    "location": "/sessions/abc"
  },
  "body": {
    "success": true,
    "message": "Session created",
    "redirect": "https://example.test/session/abc",
    "data": {
      "sessionId": "abc"
    }
  }
}
```

For an action template, `Action result` can map:

- success path: `body.success`
- message path: `body.message`
- redirect URL path: `body.redirect`
- data path: `body.data`

This is the correct choice when the action result should drive link execution behavior.

### What happens after `Action result`

After an action uses `Action result`, there are now two different follow-up paths:

- `Runtime placeholders`
  - expose values for URL resolution and action messages
- `Write-back`
  - can override existing link placeholders at runtime for the current session

This distinction matters:

- runtime placeholders are extra values
- write-back changes the effective value of placeholders that already exist in the link

### Write-back source choices

When an action template uses write-back, the source can be:

- `mapped.data`
  - use the `data` payload from `Action result`
  - best default when `data` is the real business payload
- `mapped result`
  - use the full mapped object
  - includes `ok`, `message`, `redirectUrl`, and `data`
- `response body`
  - use the raw parsed server response body
  - bypasses the mapped object for write-back purposes

### Recipe 5b: write action data back into existing placeholders

Action result after mapping:

```json
{
  "ok": true,
  "message": "Deployment queued",
  "redirectUrl": "",
  "data": {
    "jobId": "job-42",
    "status": "queued",
    "detailsUrl": "https://example.test/jobs/job-42"
  }
}
```

Action template write-back setup:

- write-back source: `mapped.data`
- write-back placeholders:

```text
LAST_JOB_ID=jobId
LAST_STATUS=status
LAST_DETAILS_URL=detailsUrl
```

Result:

- the link now sees updated runtime values for `LAST_JOB_ID`, `LAST_STATUS`, and `LAST_DETAILS_URL`
- those values are not persisted to the saved link data

### Recipe 5c: transform nested action data before write-back

Raw `data`:

```json
{
  "deployment": {
    "id": "job-42",
    "state": "queued"
  },
  "owner": {
    "name": "Platform Team"
  }
}
```

Write-back setup:

- source: `mapped.data`
- transform engine: `JSONata`
- transform:

```json
{
  "jobId": deployment.id,
  "status": deployment.state,
  "ownerName": owner.name
}
```

- write-back placeholders:

```text
LAST_JOB_ID=jobId
LAST_STATUS=status
LAST_OWNER=ownerName
```

This is useful when the original response is too nested for a simple direct field map.

Important:

- the transform only creates the intermediate object
- the actual placeholder update still happens through `write-back placeholders`
- write-back targets must already exist in the link context

## Recipe 6: use expression mode for special reshaping

Use expression mode when simple field paths are not enough.

Typical reasons:

- filtering items before building options
- composing fields
- aggregating multiple parts into one output shape

Available engines:

- `JMESPath`
- `JSONata`

Use expression mode carefully.

If a normal `Scalar`, `Options list`, or `Object` mapping is enough, it is usually easier to maintain.

## How placeholder sources and actions differ here

### Placeholder sources support:

- `Scalar`
- `Options list`
- `Object`

### Placeholder sources do not support:

- `Array`
- `Action result`

### Action templates can use:

- `Scalar`
- `Options list`
- `Object`
- `Array`
- `Action result`

`Action result` exists specifically because actions need success, message, redirect, and result data semantics.

## Common mistakes

### Mistake 1: using `Array` for a placeholder source

That is the wrong level.

If the result should fill a placeholder, use:

- `Scalar`
- `Options list`
- `Object`

### Mistake 2: using `Action result` for a placeholder source

`Action result` belongs to actions, not placeholder loading.

### Mistake 3: overusing expression mode

If a plain path works, prefer the plain path.

### Mistake 4: forgetting what `rootPath` changed

When a mapping suddenly stops working, check whether the later field paths are still relative to the same root.

## Safe setup order

1. Test the endpoint first.
2. Inspect the actual parsed response.
3. Start with the simplest mapping mode that fits.
4. Only add `rootPath` when repeated prefixes become noisy.
5. Use expression mode only when normal field paths are insufficient.

## Related examples

- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Request Bodies and Overrides](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Request-Bodies-and-Overrides)
- [Guide: API Placeholder Sources and Actions](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Placeholder-Sources-and-Actions)
