# Dialog: API Integrations

## Purpose

The `API Integrations` dialog is the central configuration surface for REST-based integrations in MyBookmarks.

If you want a shorter first-setup path before reading the full reference, start here:

- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Request Bodies and Overrides](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Request-Bodies-and-Overrides)
- [Guide: API Response Mapping Recipes](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Response-Mapping-Recipes)
- [Guide: API Placeholder Sources and Actions](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Placeholder-Sources-and-Actions)

It connects six layers:

1. `Connection`
   Technical access to an API.
2. `Endpoint`
   A concrete HTTP request.
3. `Response Mapping`
   A transformation from the raw API response into a usable shape.
4. `Placeholder Source`
   API-backed placeholder loading inside the runtime prompt.
5. `Action Template`
   API-backed link actions that run when opening a link.
6. `Link API Integration`
   Binds sources and actions to a specific link or reference link.

Short version:

```text
Connection -> Endpoint -> Response Mapping -> Placeholder Source / Action Template -> Link binding -> Runtime
```

The dialog is not just a standalone "API client". It is a small configuration system for:

- request building
- authentication
- response parsing
- response normalization
- placeholder population
- link actions with API feedback

## Where the configuration shows up later

The central definitions are created in the `API Integrations` dialog.

The actual usage appears in three places:

- the normal link editor
- the reference link editor
- the runtime dialog [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

Additionally:

- visible link titles in the main view can now resolve API-backed placeholder values in the background when the title template contains placeholders that are produced by bound `Scalar` or `Object` placeholder sources

Important:

- In the `Resolve placeholders` dialog you normally do **not** choose the API call at runtime.
- That dialog only shows placeholder fields that were already bound to placeholder sources.
- Which source or action is used is stored on the link beforehand.

### Current link-side usage surfaces

The link editor now acts as the guided consumer of these API definitions rather than as a second full API editor.

Current behavior:

- the normal link editor opens in a guided simple mode by default
- placeholder fields in that editor can already show whether they are:
  - manual
  - backed by an API value
  - backed by an API choice list
- per-field `Open in API…` shortcuts can jump directly into the matching API configuration
- advanced mode still exposes the technical binding/override surfaces for the current link

Prompt Flow also exposes direct API shortcuts in context:

- `API load` steps can open the linked:
  - placeholder source
  - response mapping
  - endpoint
- `Execution` steps can open the linked:
  - action template
  - response mapping
  - endpoint

This means:

- the registry stays centralized in `API Integrations`
- the link editor and Prompt Flow only orchestrate or deep-link the definitions already stored there

## Quick decisions

If you only need the high-level decision:

- You want an API-backed choice list for a placeholder:
  Use `Response Mapping = Options list` and a placeholder type of `select` or `multiselect`.
- You want to write exactly one value into one field:
  Use `Response Mapping = Scalar`.
- You want one request to populate multiple placeholders at once:
  Use `Response Mapping = Object`.
- You want one request to return a structured list of records:
  Use `Response Mapping = Array`.
  This is useful for previewing, testing, and action/runtime data processing, but not for placeholder sources.
- You want to run an API action and evaluate success, message, redirect, or additional result data:
  Use `Response Mapping = Action result` inside an `Action Template`.
- You want a `select` field with unique options:
  `Options list` does not deduplicate. The API should already return unique values.

## Mental Model

### 1. Connection

A connection describes the shared technical base:

- base URL
- transport
- auth
- default headers
- default timeout

### 2. Endpoint

An endpoint describes a real request:

- method
- path
- query
- headers
- body
- parser
- cache

### 3. Response Mapping

A mapping translates the response into exactly one of five shapes:

- `scalar`
- `options`
- `object`
- `array`
- `actionResult`

### 4. Placeholder Source

A placeholder source connects:

- one endpoint
- one response mapping
- one placeholder name
- one trigger behavior

Its purpose is to load placeholder data from the API inside the runtime prompt.

### 5. Action Template

An action template connects:

- one endpoint
- optionally one response mapping
- confirm text
- success and error text
- optional runtime placeholders from the action result

Its purpose is to execute an API action when a link is opened.

### 6. Link Binding

Only at the link level is it decided:

- which placeholder is bound to which source
- whether opening the link runs no API, only an API, or API plus URL opening
- which request overrides apply only to that exact link

## Dialog-wide behaviors

Several behaviors are shared across tabs.

### Live validation

The dialog validates the registry across tabs while you edit it.

Typical checks include:

- missing endpoint or response-mapping references
- `Options list` bound to placeholder types that are not `select` or `multiselect`
- `Array` mappings used from placeholder sources
- invalid or empty `Field map` definitions for `Object` or `Array`
- dependency errors in placeholder sources
- dependency cycles
- broken link bindings

Important:

- validation issues appear both in a dialog-level summary and in the selected entry
- save is blocked while validation errors exist
- warnings and errors are grouped per tab and per entry

### Usage Explorer

Most tabs show a `Usage Explorer` block for the selected entry.

It makes references clickable, for example:

- `Connection -> Endpoint`
- `Endpoint -> Placeholder Source`
- `Endpoint -> Action Template`
- `Response Mapping -> Placeholder Source`
- `Response Mapping -> Action Template`
- link bindings and API-enabled links

The main purpose is faster refactoring and troubleshooting.

### Duplicate

The list tabs support:

- `Add`
- `Duplicate`
- `Delete`

`Duplicate` creates a copy with a new internal ID and selects that new item immediately.

## API Vault

Above the tabs there is a vault area.

The `API Vault` stores sensitive values locally in encrypted form, for example:

- Basic Auth passwords
- API keys
- bearer tokens
- OAuth refresh tokens
- stored OAuth access tokens
- client secrets for OAuth2 Client Credentials

What is not stored in the vault:

- connections
- endpoints
- response mappings
- placeholder sources
- action templates
- link bindings

Those definitions remain normal app data. Only the secret values live in the vault.

### Header area

The header shows:

- whether the vault does not exist yet
- whether it is configured and locked
- whether it is unlocked for the current session
- number of stored secrets
- number of unused secrets
- timestamp of the last update

### Available actions

Depending on state, these actions appear:

- `Configure Vault`
- `Unlock Vault`
- `Lock Vault`
- `Change Vault Password`
- `Prune Unused Secrets`
- `Delete Vault`

### What each action does

`Configure Vault`

- creates a new encrypted vault
- is usually needed the first time you want to store a secret

`Unlock Vault`

- unlocks the vault for the current session
- without an unlocked vault, secret-based requests will fail later

`Lock Vault`

- removes decrypted secret values from runtime memory
- the configuration itself remains intact

`Change Vault Password`

- changes only the vault password
- the vault contents remain intact

`Prune Unused Secrets`

- removes secrets that are no longer referenced by any connection
- useful after cleanup or after renaming secret refs

`Delete Vault`

- deletes the entire vault
- all stored passwords, keys, and tokens are lost
- the API configuration remains, but becomes incomplete

### Vault dialogs

The vault has several sub-dialogs:

- `Unlock API Vault`
- `Set API Vault Password`
- `Change API Vault Password`
- `Store Secret`

### When the vault is actually required

A vault is required as soon as a connection needs a secret, for example with:

- `Basic auth`
- `API key`
- `Bearer token`
- `OAuth2 PKCE`
- `OAuth2 Device Code`
- `OAuth2 Client Credentials`

If a connection does not require a secret value, a vault is not mandatory.

## Tab: Settings

## Purpose

The `Settings` tab contains global defaults and high-level runtime summaries for the API integration system.

## Fields

### `Default cache TTL (sec)`

Global default cache duration for cacheable API requests.

The default value is:

```text
300
```

Meaning:

- `0`
  disables caching globally unless a more specific endpoint or placeholder source sets its own positive TTL
- `> 0`
  enables caching for that many seconds

How other tabs use this value:

- `-1` in an endpoint means: use the global default from `Settings`
- `-1` in a placeholder source means: inherit the selected endpoint policy
- `0` means: disable caching at that exact level
- `> 0` means: use that exact TTL in seconds

This gives you a simple three-state model everywhere:

- inherit global default
- disable cache
- use explicit TTL

Important nuance:

- endpoints inherit from the global default
- placeholder sources inherit from the endpoint first
- this means the real resolution chain is:
  `Settings -> Endpoint -> Placeholder Source`

The UI now shows the effective value directly, for example:

- `Effective cache: 300 sec via global default.`
- `Effective cache: 45 sec via endpoint override.`
- `Effective cache: 90 sec via endpoint "Project List".`
- `Effective cache: disabled by placeholder source.`

### `Vault expiry warning (days)`

Global threshold for vault warnings.

Meaning:

- if a vault-backed secret or token is already expired, it is treated as invalid for runtime auth
- if it expires soon, based on this threshold, the UI warns the user before it becomes invalid

This affects:

- connection auth warnings
- the `Vault Auths` tab
- vault-unlock warning summaries

### `Visual refresh runtime`

The `Settings` tab also contains a runtime summary for visible API consumers.

This summarizes:

- currently visible API consumers
- how many are link-title consumers vs. prompt-field consumers
- the last visual refresh run
- how many visible consumers were refreshed

This is the operational view behind the toolbar action that clears API cache and refreshes visible API consumers.

## Tab: Vault Auths

## Purpose

The `Vault Auths` tab is the management view for auth-related secrets and stored OAuth tokens.

Important:

- the tab is only shown when the API vault exists and is currently unlocked
- it does not replace the connection editor
- it only manages the stored auth values

## What it shows

Each row represents one auth-relevant vault entry.

Typical columns are:

- `Connection`
- `Auth`
- `Secret ref`
- `Status`
- `Expiry`
- `Updated`

## Status states

Typical states are:

- valid
- expiring soon
- expired

Expired entries are not usable for runtime auth until they are updated or refreshed.

## Actions

Depending on auth type and state, the tab can show:

- `Edit`
- `Refresh`
- `Clear`

Examples:

- manual secrets such as Basic Auth passwords or API keys can be edited or cleared
- stored OAuth tokens can be refreshed if refresh is supported
- expired entries can be updated or removed

## Tab: Connections

## Purpose

A connection defines shared access to one API system.

Typical examples:

- an internal deployment backend
- a test REST API
- a GitLab or Jenkins endpoint
- an OAuth-protected API gateway

Multiple endpoints can reuse the same connection.

## Fields

### `Name`

Free display name.

Examples:

- `Test API`
- `Deploy Backend`
- `Internal Inventory API`

### `Transport`

Possible values:

- `Use global transport`
- `Extension`
- `Proxy`

Meaning:

- `Use global transport`
  The connection inherits the app's global transport mode.
- `Extension`
  Forces the extension transport path.
- `Proxy`
  Forces the proxy transport path.

Important:

- An endpoint can override the transport again.
- If both the connection and the endpoint are set to `Use global transport`, the app-wide global setting is used.

### `Description`

Free text for humans.

### `Base URL`

The API base address.

Examples:

```text
https://api.example.com
http://127.0.0.1:8790
https://gateway.example.internal/v1
```

The base URL may contain placeholders.

Example:

```text
https://{{HOST}}/api
```

If placeholders in the base URL cannot be resolved when building the request, the request fails.

### `Timeout (ms)`

Default timeout for requests using this connection.

The endpoint can later define its own timeout.

### `Auth type`

Possible values:

- `None`
- `Basic auth`
- `API key`
- `Bearer token`
- `OAuth2 PKCE`
- `OAuth2 Device Code`
- `OAuth2 Client Credentials`

### `Default headers`

Multi-line header field.

Syntax:

```text
Header-Name: value
X-Project: {{PROJECT}}
Accept: application/json
```

Important:

- Header names and header values may contain placeholders.
- Connection headers are merged with endpoint headers.
- Later entries with the same header name overwrite earlier ones.

## Auth types in detail

### `None`

Use `None` when:

- the API is public
- auth is handled outside the app
- you are testing locally without auth first

### `Basic auth`

Visible fields:

- `Username`
- secret stored in the vault via `Store in Vault`

Runtime behavior:

- sets `Authorization: Basic ...`

Good fit for:

- test APIs
- internal legacy APIs
- simple auth scenarios

### `API key`

Visible fields:

- `API key placement`
  - `Header`
  - `Query param`
- `Header name` or `Query name`
- secret in the vault

Runtime behavior:

- for `Header`: a header is set
- for `Query param`: a query parameter is appended to the URL

Good fit for:

- `X-API-Key`
- `api_key=...`
- similar classic REST interfaces

### `Bearer token`

Visible fields:

- `Auth header`
- `Token prefix`
- secret in the vault

The UI also shows some OAuth-like fields here, but for a plain bearer token they are usually not relevant.
In practice you typically only need:

- `Auth header`
- `Token prefix`
- the stored secret value

Typical output:

```text
Authorization: Bearer <token>
```

### `OAuth2 PKCE`

Visible fields:

- `Auth header`
- `Token prefix`
- `Client ID`
- `Auth URL`
- `Token URL`
- `Scopes`
- `Auth params`
- `Token params`
- `Redirect URL`
- `Access token path`
- `Refresh token path`
- `Expires-in path`
- `Token-type path`

Additional auth block actions:

- `Start PKCE sign-in`
- `Refresh token`
- `Clear stored tokens`

Good fit for:

- OAuth providers with browser sign-in
- APIs where user tokens should be stored locally

### `OAuth2 Device Code`

Visible fields:

- `Auth header`
- `Token prefix`
- `Client ID`
- `Auth URL`
- `Token URL`
- `Scopes`
- `Auth params`
- `Token params`
- `Device auth URL`
- `Access token path`
- `Refresh token path`
- `Expires-in path`
- `Token-type path`

Additional actions:

- `Start device flow`
- `Refresh token`
- `Clear stored tokens`

Good fit for:

- OAuth scenarios without a classic redirect flow
- CLI-like or device-code approval flows

### `OAuth2 Client Credentials`

Visible fields:

- `Auth header`
- `Token prefix`
- `Client ID`
- `Token URL`
- `Scopes`
- `Token auth method`
  - `HTTP Basic`
  - `Request body`
- `Token params`
- `Access token path`
- `Expires-in path`
- `Token-type path`

Additional action:

- `Clear cached token`

Runtime behavior:

- MyBookmarks automatically requests an access token when needed
- the token is cached
- later requests reuse the cached token until shortly before expiry

Good fit for:

- machine-to-machine APIs
- technical service integrations without user sign-in

## Secret block

As soon as `Auth type != None`, two additional sections appear:

### 1. Secret storage

The upper block shows:

- which secret is expected
- which `secretRef` is used
- whether a value already exists in the vault

Button:

- `Store in Vault`

### 2. Auth handling

The lower block shows:

- a text description of the auth strategy
- a preview of the resulting auth header or auth handling
- validation warnings
- notes

For OAuth and Client Credentials modes, additional runtime actions appear there.

## Tab: Endpoints

## Purpose

An endpoint defines a concrete HTTP request.

The connection provides the technical base. The endpoint describes the actual call.

## Fields

### `Name`

Free display name.

### `Connection`

Links the endpoint to exactly one connection.

Without a valid connection, the endpoint cannot run.

### `Method`

Possible values:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `HEAD`
- `OPTIONS`

### `Transport`

Possible values:

- `Use global transport`
- `Extension`
- `Proxy`

Rule:

- If the endpoint is not set to `Use global transport`, it overrides the connection transport.
- Otherwise it inherits the connection transport.

### `Parser`

Possible values:

- `Auto`
- `JSON`
- `XML`
- `Text`

Meaning:

- `Auto`
  The parser is inferred from content type or body shape.
- `JSON`
  The response is parsed as JSON.
- `XML`
  The response is parsed as XML.
- `Text`
  The response remains plain text.

Important for XML:

- XML is converted into an object
- attributes appear as `@attr`
- text nodes appear as `#text`
- the root element becomes the top-level object key

Example:

```xml
<project id="42">demo</project>
```

becomes roughly:

```json
{
  "project": {
    "@id": "42",
    "#text": "demo"
  }
}
```

### `Path template`

Path relative to the base URL.

Examples:

```text
/projects/{{PROJECT_ID}}
/deployments
/environments/{{ENV}}
```

The path may contain placeholders.

### `Query params`

Multi-line query field.

Syntax:

```text
page=1
search={{QUERY}}
environment={{ENVIRONMENT}}
```

Important:

- Query names and values may contain placeholders.
- Later entries with the same name overwrite earlier ones.

### `Headers`

Multi-line header field.

Syntax:

```text
Accept: application/json
X-Environment: {{ENVIRONMENT}}
```

Endpoint headers are added on top of connection headers.

### `Body mode`

Possible values:

- `No body`
- `JSON`
- `Text`
- `Form URL encoded`

### `Timeout (ms)`

Endpoint-specific timeout.

### `Cache TTL (sec)`

Request cache for this endpoint.

Important:

- Caching only applies to `GET` and `HEAD`.
- `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` are not cached.
- Placeholder sources can define their own cache TTL and effectively override the endpoint value.
- Action templates always run without runtime cache.
- `-1` means: use the global default from the `Settings` tab.
- `0` means: disable caching for this endpoint.
- `> 0` means: cache this endpoint for that many seconds.

The endpoint editor shows the effective cache result directly below the field.

### `Body template`

Multi-line body template.

Depending on `Body mode`, the text is used differently:

`JSON`

- the text is sent as-is as the request body
- if no `Content-Type` was set, `application/json; charset=utf-8` is added automatically

`Text`

- the text is sent as plain text
- if no `Content-Type` was set, `text/plain; charset=utf-8` is added automatically

`Form URL encoded`

- the text is parsed as a query-like list
- syntax:

```text
project={{PROJECT}}
environment={{ENVIRONMENT}}
```

- the result becomes an `application/x-www-form-urlencoded` body

### `Description`

Free text field.

## Runtime observability

Endpoints also show a `Runtime observability` panel.

This is the main live runtime summary for the selected endpoint.

It includes:

- last status
- last trigger kind
- duration
- HTTP status
- cache result
- total run count
- network count
- cache-hit count
- shared in-flight count
- error count
- last request URL
- configured cache policy
- last execution cache policy

This makes it much easier to see whether a request really hit the network, came from cache, reused an in-flight request, or was run from the `Test` tab.

## How an endpoint is built internally

The order matters:

1. Load the connection.
2. Apply link-level or source-level overrides to the endpoint.
3. Resolve placeholders in base URL and path.
4. Join base URL and path.
5. Merge connection headers and endpoint headers.
6. Apply query parameters.
7. Build the body.
8. Apply connection auth.
9. Pass parser, timeout, and transport into the actual request.

## Link-specific request overrides

Both action templates and placeholder sources can receive per-link request overrides:

- additional query params
- additional headers
- body mode override
- body template override

Important:

- Query and header overrides are appended to the existing definition.
- Matching names therefore overwrite earlier values.
- `Body mode override = Use endpoint body mode` keeps the endpoint unchanged.
- `Body mode override = No body` clears the body.
- If the body mode changes but no new body template is provided, the body is deliberately cleared to avoid inconsistent formats.

## Tab: Response Mappings

## Purpose

A response mapping translates the parsed API response into a form that MyBookmarks can use directly.

There are five modes:

- `Scalar`
- `Options list`
- `Object`
- `Array`
- `Action result`

## Core logic

Internally the response is available as a `responseContext` with:

- `status`
- `statusText`
- `headers`
- `parserMode`
- `body`

`Root path` is always evaluated against this full response context.

If `Root path` is empty:

- for `scalar`, `options`, and `object`, the default root is `response.body`
- for `actionResult`, the default root is the full response context

This matters if you want to map status codes or headers instead of only body fields.

## Path syntax

API paths support:

- property access
- array indexes
- wildcards
- filters
- an optional leading `$`

### Simple properties

```text
body.data.id
status
headers.content-type
project.name
```

### Array index

```text
items[0]
items[1].name
```

### Wildcard

```text
items[*]
items[*].name
```

### Filters

Examples:

```text
items[status=active]
items[count>0]
items[name*=prod]
items[enabled=true]
items[value!=null]
```

Supported operators:

- `=`
- `!=`
- `*=`
- `>`
- `>=`
- `<`
- `<=`

Supported filter values:

- strings
- numbers
- `true`
- `false`
- `null`

### Leading `$`

These forms are also valid:

```text
$.body.data
$
```

## Mapping mode: `Scalar`

`Scalar` returns exactly one value.

The internal shape is:

```json
{ "mode": "scalar", "value": ... }
```

### Fields

- `Value path`
- `Aggregate mode`
- optionally `Aggregate path`
- optionally `Separator`

### When `Scalar` is the right choice

Use `Scalar` when you need:

- one single text value
- one number
- one boolean
- one single selected value
- one API-provided default value to write into a placeholder

Typical examples:

- project name
- internal ID
- current status
- current boolean flag
- one preselected environment from the API

### Aggregate modes

Aggregate modes only apply in `Scalar`.

Available modes:

- `None`
- `First value`
- `Last value`
- `Count`
- `Join`
- `Distinct + join`
- `Sum`
- `Average`
- `Min`
- `Max`
- `JSON`

Meaning:

`None`

- returns the first match from `Value path`

`First value`

- first value from the aggregate result set

`Last value`

- last value from the aggregate result set

`Count`

- number of matched values

`Join`

- all values are stringified and joined with `Separator`

`Distinct + join`

- values are deduplicated first
- then joined with `Separator`

`Sum`, `Average`, `Min`, `Max`

- only meaningful for numeric values
- non-numeric entries are ignored

`JSON`

- returns the result list as a JSON preview string

### Important limitation

`Distinct + join` is **not** a dropdown builder.

It produces one final string.
That is why it normally does **not** fit a `select` placeholder when you want real selectable options.

## Mapping mode: `Options list`

`Options list` returns a list of options.

The internal shape is:

```json
{
  "mode": "options",
  "options": [
    { "value": "...", "label": "...", "detail": "..." }
  ]
}
```

### Fields

- `Collection path`
- `Sort by path`
- `Value path`
- `Label path`
- `Detail path`

### When `Options list` is the right choice

Use `Options list` when the user should choose from multiple API values inside the runtime prompt.

This is the correct mode for:

- `select`
- `multiselect`

Typical examples:

- list of all projects
- list of all environments
- list of all deployment types
- list of teams or people

### Runtime behavior

When a placeholder source mapping returns `options`:

- the prompt field becomes `select`
- unless the original placeholder type was `multiselect`
- in that case it remains `multiselect`

That means:

- `Options list` + `select` = one chosen value from the API list
- `Options list` + `multiselect` = multiple chosen values from the API list

### Sorting

If `Sort by path` is set:

- options are sorted by that path per item
- sorting is lexical, not numeric

### Important limitations

`Options list`:

- ignores `Aggregate mode`
- does not deduplicate values
- is not meant to return one scalar result

If you need unique options:

- the API should already return unique records
- or you should build a dedicated endpoint for the unique list

## Mapping mode: `Object`

`Object` returns multiple named fields.

The internal shape is:

```json
{
  "mode": "object",
  "value": {
    "FIELD_A": "...",
    "FIELD_B": "..."
  }
}
```

### Field

- `Field map`

The dialog now includes a structured `Field map` editor for `Object` and `Array`.

You can:

- add rows with `Add field`
- enter the target `Field key`
- enter the source `Path`
- use `Pick` to write a path from the path picker
- inspect the resolved sample directly per row

The stored format remains:

```text
PROJECT_ID=id
PROJECT_NAME=name
STATUS=meta.status
```

Each line is still:

```text
PLACEHOLDER_NAME=path
```

### When `Object` is the right choice

Use `Object` when one request should populate multiple placeholders at once.

Typical examples:

- selecting a project also fills:
  - `PROJECT_ID`
  - `PROJECT_NAME`
  - `OWNER`
- selecting an environment also fills:
  - `ENVIRONMENT`
  - `CLUSTER`
  - `REGION`

### Runtime behavior

Inside the placeholder prompt, MyBookmarks tries to:

1. match returned object fields to existing placeholders by name
2. write each matched value into the corresponding placeholder row

If no matching field name is found:

- the app falls back to the source field itself
- for a single-key object, that one value is used
- for more complex objects, a stringified representation may be used as fallback

### Typical target types

`Object` works especially well with:

- `text`
- `number`
- `boolean`

It can also populate `select` or `multiselect` if the returned values match the expected option values.
But it is not the correct tool for loading the option set itself.

## Mapping mode: `Array`

`Array` returns a structured list.

The internal shape is:

```json
{
  "mode": "array",
  "value": [
    {
      "FIELD_A": "...",
      "FIELD_B": "..."
    }
  ]
}
```

### Fields

- `Root path`
- `Field map`

Behavior:

- if `Field map` is empty, the raw collection items are returned
- if `Field map` contains rows, each returned item is projected into a smaller object

Typical use cases:

- previewing structured result lists in the dialog
- reusing structured lists in advanced action flows
- debugging and testing API responses without collapsing everything to one scalar or one object

Important limitation:

- `Array` is not supported for placeholder sources
- placeholder sources only support `Scalar`, `Options list`, and `Object`

## Mapping mode: `Action result`

`Action result` is **not** meant for placeholder sources.

It is only meant for `Action Templates`.

The internal shape is:

```json
{
  "mode": "actionResult",
  "ok": true,
  "message": "...",
  "redirectUrl": "...",
  "data": ...
}
```

### Fields

- `Success path`
- `Message path`
- `Redirect URL path`
- `Data path`

### When `Action result` is the right choice

Use it when an API action:

- signals success or failure
- returns a user-facing message
- may return a redirect URL
- should expose additional result data for later runtime placeholders

Typical examples:

- start a deployment
- create a ticket
- request a one-time link
- create a session

### Important limitation

At runtime, a placeholder source only supports:

- `options`
- `scalar`
- `object`

`actionResult` is invalid there.

## Inline preview and path picking

The `Response Mappings` tab now contains its own inline preview workflow.

It no longer depends only on switching to the `Test` tab.

### `Preview source`

The preview block lets you choose:

- an `Endpoint`
- `Placeholder values (JSON)`
- optionally a linked source or action preset

Actions:

- `Run preview`
- `Open full Test tab`

The preview run populates:

- `Root preview`
- `Mapped result`
- `Field previews`
- the `Path picker`

### `Path picker`

The picker is based on the last captured preview/test response.

It lets you:

- target one mapping field at a time
- filter visible paths
- click a suggested path to insert it
- inspect the sample value before inserting it

This is especially useful for:

- root paths
- collection paths
- value/label/detail paths
- action-result paths
- object and array field maps

The `Pick` button on each mapping field does not open a separate modal.
It selects the active target field and moves focus to the path picker.

## Tab: Placeholder Sources

## Purpose

A placeholder source binds a placeholder to an API call.

Later, that source is bound to a specific placeholder on a link.

## Fields

### `Name`

Free display name.

### `Placeholder name`

The placeholder name this source is intended for.

Example:

```text
PROJECT
```

Important:

- In the link editor, sources whose `Placeholder name` matches the actual placeholder are preferred.
- The cleanest setup is therefore:
  Placeholder Source `Placeholder name` = actual target placeholder name

### `Endpoint`

Which request should run.

### `Response mapping`

How the response is interpreted.

For placeholder sources, the meaningful mapping modes are:

- `Scalar`
- `Options list`
- `Object`

`Array` is deliberately invalid here.

### `Trigger`

Possible values:

- `Manual`
- `On prompt open`
- `On dependency change`

### `Cache TTL (sec)`

Cache duration for this source.

Important:

- only matters for cacheable requests, in practice `GET` or `HEAD`
- overrides endpoint caching when the source runs
- `-1` means: inherit the selected endpoint policy
- `0` means: disable caching for this source
- `> 0` means: use that exact TTL in seconds

The UI also shows the effective resolution directly below the field, so you can see whether the source is inheriting from the endpoint or explicitly overriding it.

### `Debounce (ms)`

Only relevant for `On dependency change`.

Effect:

- API reloads are delayed slightly during fast input changes
- typing does not immediately trigger a request on every keystroke

The default is typically `250`.

### `Depends on`

Multi-line list of placeholder names.

Example:

```text
PROJECT
ENVIRONMENT
```

Meaning:

- the source may only load after these placeholders have values
- when these placeholders change, the source can reload

### `Allow manual override`

Meaning:

- `true`
  the user may still change the value after the API result arrived
- `false`
  the API result makes the affected field read-only

Important nuance:

- for `options`, the field remains an interactive selection field
- `Allow manual override` matters most for `scalar` and `object`

### `Description`

Free text field.

## Trigger modes in detail

### `Manual`

Behavior:

- nothing loads automatically
- the runtime prompt shows a `Load from API` button

Good fit for:

- expensive requests
- requests that should only run on demand
- debugging

### `On prompt open`

Behavior:

- the request runs automatically as soon as the placeholder prompt opens

Good fit for:

- initial dropdown lists
- static or lightweight lookup data

### `On dependency change`

Behavior:

- the source can reload automatically when dependent placeholders change

Good fit for:

- cascading dropdowns
- Country -> City
- Project -> Environment
- Cluster -> Namespace

## Dependencies and invalidation

If `Depends on` is set:

- the source waits until all required placeholders are filled
- until then, the prompt shows a waiting state for missing dependencies
- when a dependency field changes, the old value from the dependent source is invalidated

This is important to avoid stale selections.

## Visible link titles

Placeholder sources are no longer limited to the runtime prompt.

If a visible link title contains placeholders and the link has matching placeholder bindings, MyBookmarks can load those values in the background for the rendered title.

Important:

- this currently applies to visible rendered link titles in the main view
- the source must effectively produce values, which in practice means `Scalar` or `Object`
- `Options list` is still primarily for prompt-driven `select` or `multiselect` fields
- loading is runtime-only; it does not write the fetched value back into the stored placeholder data
- the toolbar `Reset API cache` action reloads visible title-based and visible prompt-based API consumers through the shared visual refresh model

## Which mapping modes make sense in placeholder sources

`Options list`

- for selection fields
- usually `select` or `multiselect`

`Scalar`

- for exactly one target value
- usually `text`, `number`, or `boolean`

`Object`

- for multiple target placeholders at once
- ideal for related data fields

`Array`

- not supported for placeholder sources

`Action result`

- do not use it here

## Tab: Actions

## Purpose

An `Action Template` describes an API action that a link can execute later.

Typical examples:

- trigger a deployment
- start a build
- create an issue
- request a login URL or session URL

## Fields

### `Name`

Free display name.

### `Endpoint`

Which request is executed when the action runs.

### `Response mapping`

Optional mapping for the action response.

Typical choices:

- `Action result`
- in some cases also `Object` or `Scalar`, if you only want to build result placeholders

### `Allow redirect URL from mapping`

If enabled:

- a `redirectUrl` from the mapping may later be opened

If disabled:

- a `redirectUrl` present in the mapping is ignored

### `Runtime placeholders`

Multi-line list in this format:

```text
PLACEHOLDER_NAME=path
```

Example:

```text
JOB_ID=mapped.data.jobId
RESULT_URL=mapped.redirectUrl
STATUS=response.status
REQUEST_URL=request.url
```

Available roots for these paths are:

- `mapped`
  the mapped action result
- `request`
  the request that was sent
- `response`
  the response context

These placeholders are available after the API action and can be used in:

- the URL when using `apiThenOpen`
- confirm text
- success message
- error message

### `Write-back source`

This controls whether the action should also write values back into existing link placeholders at runtime.

Important behavior:

- write-back is runtime-local only
- it does not persist the link data
- it only writes to placeholders that already exist in the link context
- it is mainly useful when an API action should immediately influence the current link UI, preview, or a later prompt run

The options mean:

- `Disabled`
  - no runtime placeholder write-back happens
- `mapped.data`
  - use only the `data` payload from an `Action result` mapping
  - this is usually the best default when the action mapping already returns a clean business payload
  - requires a response mapping with mode `Action result`
- `mapped result`
  - use the entire mapped action result
  - useful when the write-back should also see values like `ok`, `message`, or `redirectUrl`
  - also works when the action mapping uses another mode such as `Object` or `Scalar`
- `response body`
  - use the raw parsed response body before the response mapping result
  - useful when you want write-back directly from the server response or when no response mapping should be involved

### `Write-back transform engine`

Optional transform engine applied before placeholder write-back.

Available engines:

- `JMESPath`
- `JSONata`

The transform always runs only against the selected `Write-back source`.

### `Write-back transform`

Optional expression that reshapes the selected write-back source before the final field map runs.

Typical use cases:

- flatten nested JSON
- rename fields
- assemble a smaller object for write-back
- select only one sub-object from a larger response

Example with `JSONata`:

```json
{
  "jobId": id,
  "status": status,
  "ownerName": owner.name
}
```

Example with `JMESPath`:

```text
{jobId: id, status: status, ownerName: owner.name}
```

The transform only creates an intermediate object.
The final placeholder write still happens in `Write-back placeholders`.

### `Write-back placeholders`

Multi-line list in this format:

```text
PLACEHOLDER_NAME=path
```

The paths are resolved against:

- the selected `Write-back source`
- or the transformed object if `Write-back transform` is used

Example without transform:

```text
LAST_JOB_ID=id
LAST_STATUS=status
LAST_URL=url
```

Example with `Write-back source = mapped result`:

```text
LAST_MESSAGE=message
LAST_REDIRECT=redirectUrl
```

Important limitation:

- the target placeholder must already exist in the link
- missing targets are ignored instead of being created automatically
- write-back values override the effective runtime placeholder value for the current session only

### `Confirm text`

Optional confirmation text shown before the action request runs.

Example:

```text
Deploy {{PROJECT}} to {{ENVIRONMENT}}?
```

If it is empty:

- no extra confirmation step is shown

### `Success message`

Optional success text.

If empty, the app falls back to:

- the mapping message
- or a generic success message

### `Error message`

Optional error text.

If empty, the app falls back to:

- the mapping message
- or a generic error message

### `Description`

Free text field.

## Important runtime logic for actions

Actions always run without runtime cache.

After execution, the flow is roughly:

1. Send the request.
2. Optionally map the response.
3. Determine `ok`.
4. Build result placeholders.
5. Optionally write values back into existing placeholders.
6. Resolve success and error text with runtime placeholders.
7. Optionally open a redirect or the final URL.

## Link execution modes

At the link level there are three execution modes:

### `Open URL`

- the default case without API action
- the URL is resolved and opened directly

### `Run API action`

- only the API action runs
- if the mapping returns a redirect and `Allow redirect URL from mapping` is enabled, that redirect may be opened
- otherwise the normal link URL is not opened

### `Run API action then open URL`

- first run the API action
- then:
  - prefer the redirect from the mapping if it exists and is allowed
  - otherwise open the normal link URL
- result placeholders from the action can participate in resolving the final URL

## Tab: Test

## Purpose

The `Test` tab is the main debugging, regression, and verification area.

It allows you to:

- test an endpoint directly
- validate mappings
- test placeholder resolution
- run action templates
- inspect request and response previews
- store reusable test cases
- compare the current mapped result against an expected result

## Fields

### `Saved test cases`

The test tab supports saved cases.

You can:

- select an existing saved case
- `Load`
- `Add current`
- `Save current`
- `Duplicate`
- `Delete`

Saved cases store:

- action template
- endpoint
- response mapping
- placeholder JSON
- request override JSON
- expected mapped result JSON
- name and description

### `Action template`

Optional.

If set:

- `Endpoint` and `Response mapping` are derived from the action template
- those two fields become disabled
- additional action-specific previews appear

### `Endpoint`

Direct endpoint selection if no action template is used.

The UI also shows the effective cache policy for the selected endpoint.

Important:

- normal endpoint execution may use stored response cache
- `Test` runs deliberately bypass the stored response cache
- the note below the field explains both the configured policy and the test-run behavior

### `Response mapping`

Optional mapping for the test run.

So you can test:

- only the request
- request plus parsing
- request plus parsing plus mapping

### `Placeholder values (JSON)`

JSON object with test values.

Example:

```json
{
  "PROJECT": "demo",
  "ENVIRONMENT": "prod",
  "BUILD_ID": 42,
  "PREVIEW": true
}
```

Important:

- it must be a JSON object
- arrays or plain strings are invalid here

### `Request override (JSON)`

Optional JSON object for temporary request overrides during the test run.

This is useful for:

- trying query/header/body changes
- testing without changing the saved endpoint
- simulating link-level overrides

### `Expected mapped result (JSON)`

Optional JSON object used for regression-style comparison.

Behavior:

- if a mapping is selected, the current mapped result is compared to this expected result
- the UI shows `Match` or `Mismatch`
- `Use current mapped result` copies the latest mapped output into the expected-result field

### `Run test`

Runs the test.

## Previews

The right side shows:

- `Request preview`
- `Raw response`
- `Parsed response`
- `Mapped result`

With an action template selected, it also shows:

- `Action runtime placeholders`
- `Success message preview`
- `Error message preview`

These previews are also one basis for the preview system shown in the `Response Mappings` tab.

## Link-side API integration

The central API definitions alone do not do anything yet.
They still have to be activated per link or per reference link.

Inside the link editor there is an `API integration` section for that.

## Fields in the link editor

### `Execution mode`

Possible values:

- `Open URL`
- `Run API action`
- `Run API action then open URL`

### `Action template`

This binds a previously defined action template to the link.

### `Action result placeholders`

If the action template defines runtime placeholders, the link editor shows their names and where they are used.

Typical usage locations:

- URL
- confirm text
- success message
- error message

### `Action request overrides`

Link-local overrides for the action:

- `Query params override`
- `Headers override`
- `Body mode override`
- `Body template override`

These overrides apply only to this one link.

### `Placeholder sources`

For every visible placeholder, a source can be bound.

The placeholder then gets:

- one fixed source ID
- optionally its own request overrides for that exact source usage

### `Source request overrides`

Available per binding:

- `Query params override`
- `Headers override`
- `Body mode override`
- `Body template override`

These are especially useful when the same central endpoint should behave slightly differently in different links.

## Reference links

For reference links, API integration can either:

- be inherited from the source link
- or be overridden locally

The editor explicitly shows whether it is currently using:

- the source link configuration
- or a local override

## Placeholders and API: complete matching guide

This section is the most useful one for daily configuration work.

## Placeholder type `text`

Typical use:

- free-form input
- IDs stored as text
- names
- labels
- URLs
- tokens

Reasonable API combinations:

- `Scalar`
  when exactly one value should be returned
- `Object`
  when this field is one part of a larger returned object
- `Options list`
  technically possible, but only useful if you intentionally want to turn the free text field into a selection field

Recommendation:

- most common choice: `Scalar`

Example:

- placeholder `PROJECT_NAME` of type `text`
- source mapping `Scalar`
- `Value path = name`

## Placeholder type `number`

Typical use:

- numeric IDs
- build numbers
- counters
- thresholds

Reasonable API combinations:

- `Scalar`
- `Object`

Recommendation:

- almost always `Scalar`

Note:

- the numeric value is fetched from the API and written into the placeholder
- for API-side result math, `Scalar + Sum/Average/Min/Max/Count` can also be useful

Example:

- placeholder `OPEN_COUNT`
- mapping `Scalar`
- `Aggregate mode = Count`
- `Aggregate path = items[*]`

## Placeholder type `boolean`

Typical use:

- yes or no
- feature on or off
- preview true or false

Reasonable API combinations:

- `Scalar`
- `Object`

Recommendation:

- `Scalar` when the API returns one boolean-like value

Note:

- runtime normalizes boolean values to the placeholder's expected boolean representation

Example:

- placeholder `PREVIEW`
- mapping `Scalar`
- `Value path = flags.previewEnabled`

## Placeholder type `select`

Typical use:

- exactly one value out of several possible options

Reasonable API combinations:

- `Options list`
- `Scalar`
- `Object`

Which combination is for which case?

`Options list`

- correct when the API should provide the option list itself
- this is the standard pattern for API-backed dropdowns

`Scalar`

- only useful when one final value is already known and should be set directly
- not suitable for building a dropdown option list

`Object`

- useful when one API call fills multiple fields and this select field is only one of them

Recommendation:

- for real dropdowns, always use `Options list`

Example:

- placeholder `ENVIRONMENT` of type `select`
- mapping `Options list`
- `Collection path = items[*]`
- `Value path = id`
- `Label path = name`

## Placeholder type `multiselect`

Typical use:

- multiple selected values in one field

Reasonable API combinations:

- `Options list`
- `Scalar`
- `Object`

Which combination is for which case?

`Options list`

- correct when the API should provide the list of possible options
- the field remains `multiselect`

`Scalar`

- only useful when the API directly returns the current multi-value selection
- not the possible options

`Object`

- useful when a larger returned object contains one multi-value field

Recommendation:

- for real multi-selection, always use `Options list`

Example:

- placeholder `TAGS` of type `multiselect`
- mapping `Options list`
- `Collection path = tags[*]`
- `Value path = code`
- `Label path = displayName`

## Decision matrix: which mapping mode for which placeholder goal?

| Goal | Correct placeholder type | Correct mapping mode | Comment |
| --- | --- | --- | --- |
| User should choose exactly one value from API data | `select` | `Options list` | Standard dropdown pattern |
| User should choose multiple values from API data | `multiselect` | `Options list` | Standard multi-select pattern |
| One API value should be written directly into a field | `text`, `number`, `boolean` | `Scalar` | Most common prefill pattern |
| One API value should prefill a select field | `select` | `Scalar` | Prefill only, not a dropdown builder |
| One request should populate multiple placeholders | mixed | `Object` | Field names should match placeholder names |
| One request should return a structured list | usually not a prompt field | `Array` | Useful for testing, previewing, and advanced runtime data handling |
| An API action should expose success, message, redirect, and extra data | not a placeholder source, but an action | `Action result` | Use only in actions |

## When do I need `Options list`?

You need `Options list` when:

- the user should choose from multiple API values in the prompt
- your placeholder type is `select` and the choices should come from the API
- your placeholder type is `multiselect` and the choices should come from the API

Wrong combinations would be:

- `select` + `Scalar + Distinct + join`
- `multiselect` + `Scalar` when your real goal is to load possible options

Because:

- `Scalar` returns one final value
- `Options list` returns the selectable option set

## When do I need `Scalar`?

`Scalar` is correct when:

- exactly one value is needed
- a text field should be filled
- a number field should be filled
- a boolean field should be filled
- an existing select field should only receive one final value, not a new option set
- an aggregate such as `Count`, `Sum`, or `Join` is required

## When do I need `Object`?

`Object` is correct when:

- one request should populate multiple placeholders at once
- related data from one API record should flow into multiple fields
- you do not want to build multiple nearly identical placeholder sources

## When do I need `Array`?

`Array` is correct when:

- the natural output is a list of structured records
- you want to keep multiple rows instead of collapsing them to one value
- you want to inspect or reuse structured list data in preview or action-related flows

`Array` is wrong when:

- you want to populate a placeholder source
- you want to build a dropdown list
- you need one single scalar value

## When do I need `Action result`?

`Action result` is correct when:

- a link executes an API action
- success or failure should be evaluated
- a redirect should be read from the response
- result data from the action should be reusable later in URLs or messages
- result data may later be written back into existing placeholders

`Action result` is wrong when:

- you only want to populate a prompt field
- you want to build a dropdown list
- you want to prefill normal placeholders when the prompt opens

## Complete list of placeholder-related API patterns

With API integration, these are the main placeholder patterns you can build:

### 1. Static placeholder without API

The placeholder only lives in:

- global placeholders
- group placeholders
- link placeholders

No API behavior involved.

### 2. Manually loaded single value from API

Pattern:

- placeholder source
- trigger `Manual`
- mapping `Scalar`

Runtime:

- user clicks `Load from API`
- one value is written into the field

### 3. Automatically loaded dropdown on prompt open

Pattern:

- placeholder type `select`
- mapping `Options list`
- trigger `On prompt open`

Runtime:

- prompt opens
- API loads the options
- user chooses one

### 4. Dependent dropdown list

Pattern:

- upper field, for example `PROJECT`
- lower field, for example `ENVIRONMENT`
- source for `ENVIRONMENT`
- trigger `On dependency change`
- `Depends on = PROJECT`

Runtime:

- choose project first
- then load environments
- if project changes, the old environment value is invalidated

### 5. One API call fills multiple fields

Pattern:

- mapping `Object`
- `Field map` with multiple target names

Runtime:

- one request
- multiple placeholders are updated

### 6. Technical hidden placeholder used as dependency

It is also possible that:

- one placeholder is hidden in the prompt
- but still acts as a dependency for other sources

This allows technical IDs or preconditions to influence the flow in the background.

### 7. API value is loaded first, user may still edit it

Pattern:

- `Allow manual override = true`

Runtime:

- the value or options come from the API
- the user may still adjust the final choice

### 8. API value is authoritative and read-only

Pattern:

- `Allow manual override = false`

Runtime:

- for `scalar` and `object`, affected fields become read-only

### 9. Link action generates new placeholders for a second step

Pattern:

- `Action Template`
- `Runtime placeholders`
- link mode `Run API action then open URL`

Runtime:

- API returns, for example, a session ID
- that session ID becomes a result placeholder
- the final URL is then resolved with that session ID

### 10. API action returns a redirect instead of using the normal URL

Pattern:

- `Action result`
- `Redirect URL path`
- `Allow redirect URL from mapping = true`

Runtime:

- API returns the final target URL
- the link does not need to know the final URL ahead of time

## Common misconfigurations

### `Select` with `Scalar` instead of `Options list`

Symptom:

- the prompt does not show a real choice list

Cause:

- `Scalar` only returns one value, not options

### `Distinct + join` for a dropdown

Symptom:

- you expect multiple selectable entries
- but only get one combined string

Cause:

- aggregation belongs to `Scalar`, not to `Options list`

### Placeholder source with `Action result`

Symptom:

- the source does not load correctly or fails at runtime

Cause:

- placeholder sources only support `options`, `scalar`, and `object`

### Placeholder source with `Array`

Symptom:

- the source fails validation or runtime execution

Cause:

- placeholder sources do not support `Array`

### Missing `Depends on`

Symptom:

- a dependent choice list loads too early or with empty parameters

Cause:

- the source does not know which fields it depends on

### Wrong `Placeholder name` in the source

Symptom:

- the source does not appear correctly in the link editor

Cause:

- source and actual target placeholder have different names

### API returns duplicate options

Symptom:

- the dropdown shows duplicate entries

Cause:

- `Options list` does not deduplicate

Fix:

- return unique values from the API
- or build a dedicated endpoint that already returns a unique list

## Practical recipes

## Recipe 1: Simple API-backed dropdown

Goal:

- user should choose a project from API data

Configuration:

1. Placeholder `PROJECT` as `select`
2. Endpoint `GET /projects`
3. Mapping `Options list`
   - `Collection path = items[*]`
   - `Value path = id`
   - `Label path = name`
4. Placeholder source for `PROJECT`
   - trigger `On prompt open`

## Recipe 2: Dependent environment list

Goal:

- choose project first
- then only show matching environments

Configuration:

1. Placeholder `PROJECT` as `select`
2. Placeholder `ENVIRONMENT` as `select`
3. Source for `PROJECT` with `Options list`
4. Source for `ENVIRONMENT` with `Options list`
5. `Depends on = PROJECT`
6. Trigger for `ENVIRONMENT = On dependency change`

## Recipe 3: Select one record and fill several fields

Goal:

- user picks a project
- API automatically provides ID, owner, and region

Configuration:

1. Source on the controlling placeholder
2. Mapping `Object`
3. `Field map`:

```text
PROJECT_ID=id
OWNER=owner.name
REGION=region
```

You can build this either directly in the raw text format or through the structured `Field map` editor in the `Response Mappings` tab.

## Recipe 4: API action creates a session and then opens the target URL

Goal:

- API creates a one-time session URL or session ID
- then the actual target page is opened

Configuration:

1. Action template with endpoint `POST /session`
2. Mapping `Action result`
3. Optional `Runtime placeholders`, for example:

```text
SESSION_ID=mapped.data.sessionId
```

4. Link `Execution mode = Run API action then open URL`
5. URL contains something like `{{SESSION_ID}}`

## Interaction with other placeholder features

API integration is only one layer in the placeholder system.

It works together with:

- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

Important combinations:

- default values can come from global, group, or link placeholders
- API sources can extend or override those values inside the runtime prompt
- placeholder rules can additionally control visibility, required state, and option sets dynamically

## Summary

The core rule of thumb is:

- `Options list` builds selectable choices
- `Scalar` returns one final value
- `Object` populates multiple placeholders at once
- `Array` returns a structured list
- `Action result` belongs only to API actions

When configuring API-backed prompt fields, think in this order:

1. Which placeholder type is functionally correct?
2. Should the API return choices or one final value?
3. Is the correct return shape a single value, a list of options, or a multi-field object?
4. Should opening the link run only the URL, only the API, or both?

With that mental model, most setups become straightforward and misconfigurations such as `Select + Scalar + Distinct + join` can be avoided early.

If you need a shorter setup-oriented version of this page, see:

- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
