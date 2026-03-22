# Guide: API Integration Quick Start

## Purpose

This page is the shortest path from:

```text
I have an API endpoint
```

to:

```text
MyBookmarks uses it in a placeholder or link action
```

Use this guide if:

- this is your first API integration in MyBookmarks
- you want a safe setup order
- you do not want to read the full reference first

This page is intentionally setup-oriented.

For the full model and all advanced options, see:
- [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)

Related pages:

- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)
- [Dialog: Expression Editor](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Expression-Editor)
- [Dialog: Link Templates](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Templates)
- [Guide: API Request Bodies and Overrides](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Request-Bodies-and-Overrides)
- [Guide: API Response Mapping Recipes](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Response-Mapping-Recipes)
- [Guide: API Placeholder Sources and Actions](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Placeholder-Sources-and-Actions)

## The one decision that matters first

Before creating anything, decide what the API should produce.

- `Options list`
  The API returns choices for a `select` or `multiselect` placeholder.
- `Scalar`
  The API returns one final value for one placeholder.
- `Object`
  One API response fills several placeholders at once.
- `Action result`
  The API call belongs to a link action, not to a placeholder source.

If this decision is wrong, the rest of the setup usually becomes confusing.

## Recommended setup order

### 1. Create the placeholder shape first

Start in the normal placeholder editor:

- global placeholders
- group placeholders
- link placeholders
- reference-link placeholders

Background:

- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)

Define the placeholder name and type first.

Examples:

- `PROJECT` as `select`
- `ENVIRONMENT` as `select`
- `TOKEN` as `text`
- `CUSTOMER_ID` as `number`

Important:

- for API choice lists, the placeholder type should already be `select` or `multiselect`
- for a single resolved value, use the actual final type

### 2. Create a `Connection`

In `API Integrations`, start with the shared technical access:

- base URL
- authentication
- default headers
- timeout

Rule of thumb:

- if several endpoints talk to the same API, they should usually share one connection

Reference:

- [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)

### 3. Create an `Endpoint`

Then define the real request:

- method
- path
- query
- headers
- body
- parser
- cache behavior

Keep the first endpoint simple.
Do not start with per-link request overrides unless the base endpoint already works.

### 4. Test the raw request

Before building mappings, make sure the endpoint returns the data shape you expect.

Check:

- does the request succeed?
- is authentication correct?
- is the response JSON shape stable?
- are the fields present that you want to map later?

This is the point where most setup problems should be solved.

### 5. Create a `Response Mapping`

Now convert the raw response into the shape MyBookmarks needs.

Typical first setups:

- `Options list` for dropdown choices
- `Scalar` for one value
- `Object` for several placeholders from one response

Do not over-model the first mapping.
If one request only needs one value, start with `Scalar`.

If you are unsure how placeholder values are later consumed in text or URLs, it also helps to read:

- [Dialog: Expression Editor](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Expression-Editor)

### 6. Decide between `Placeholder Source` and `Action Template`

Use a `Placeholder Source` when:

- the API should provide placeholder values
- the runtime prompt or visible link title should resolve data from the API

Related runtime page:

- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

Use an `Action Template` when:

- opening the link should actively run an API call
- the API result belongs to the execution step
- success, error, redirect, or runtime action data matter

Short rule:

```text
Data for placeholders -> Placeholder Source
API call during link execution -> Action Template
```

### 7. Bind the setup at the link

The central registry objects do nothing by themselves.
They must be bound where they are used.

For placeholder-based setup:

- open the link or reference-link dialog
- go to the placeholder table
- open the placeholder detail row
- in the `API` tab, select the source for that placeholder

For action-based setup:

- open the link API section
- choose the execution mode
- select the action template

Only add request overrides after the normal binding works.

If the placeholder is later shown to the user at execution time, the runtime behavior is documented here:

- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

### 8. Test the real runtime behavior

Finally test the actual user flow:

- open the placeholder prompt
- open the link
- check visible title refresh if relevant
- verify that values land in the correct placeholders

At this stage, also verify that:

- required placeholders are still valid
- placeholder rules still make sense
- prompt visibility is correct
- Prompt Flow, if used, still loads and assigns values in the intended order

Prompt Flow reminder:

- `API load` steps reuse existing placeholder source bindings
- `Assign` steps can write to existing placeholders or to runtime-only workflow vars
- those workflow vars can now also feed later link-local placeholder rules
- `Assign` does not create new placeholders automatically

Related:

- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

## Three good starter patterns

### Pattern 1: API-backed select field

Use this when the user should choose one value from API data.

Useful companion pages:

- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)

Minimal setup:

1. Placeholder type = `select`
2. Endpoint returns a list
3. Response Mapping = `Options list`
4. Placeholder Source uses that mapping
5. Link binding connects the placeholder to the source

Typical example:

```text
PROJECT -> choose one project from the API
```

### Pattern 2: One request fills one technical value

Use this when the user does not need to choose, but the API should resolve one value.

Minimal setup:

1. Placeholder type = usually `text` or `number`
2. Endpoint returns one field
3. Response Mapping = `Scalar`
4. Placeholder Source binds that result to the placeholder

Typical example:

```text
SESSION_TOKEN -> resolved automatically from the API
```

### Pattern 3: Run API first, then open the link

Use this when the API must create or fetch runtime data before the URL opens.

Minimal setup:

1. Endpoint for the action
2. Response Mapping = usually `Action result`
3. Action Template
4. Link execution mode = API first, then open URL
5. URL uses action result placeholders if needed

Typical example:

```text
Create one-time session, then open target URL with that session ID
```

Optional extension:

- if the action response should also update existing placeholders at runtime, configure action template write-back
- use `mapped.data` when the useful payload lives inside the `data` part of `Action result`
- use `mapped result` when values like `message`, `redirectUrl`, or `ok` should also be available for write-back
- use `response body` when the raw parsed API response should drive the write-back directly
- if you need to reshape nested action data first, use `Write-back transform`, then map the final fields in `Write-back placeholders`

If you later want to reuse such a setup across many links, also see:

- [Dialog: Link Templates](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Templates)

## Good beginner rules

- Start with one placeholder and one endpoint.
- Prefer `Scalar` over `Object` until you really need several fields.
- Prefer no request overrides at the beginning.
- Test the endpoint before building response mappings.
- Test the binding before adding placeholder rules.
- Only after the basic flow works should you add dependency chains or advanced actions.

## Common first-time mistakes

- `Options list` used with a placeholder that is not `select` or `multiselect`
- `Action result` expected to behave like a placeholder source
- building overrides before the base endpoint works
- creating too many endpoints before testing one successful end-to-end flow
- mixing “user chooses a value” with “API resolves a final value”

## What to read next

- [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)
- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)
