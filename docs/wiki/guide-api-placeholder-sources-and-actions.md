# Guide: API Placeholder Sources and Actions

## Purpose

This guide explains how API data is used after the technical pieces already exist.

Use it when you want to understand:

- when to create a placeholder source
- when to create an action template
- how link binding works
- how runtime prompts, dependencies, and workflow API load steps reuse the same API setup

Reference:

- [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)

Related pages:

- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Request Bodies and Overrides](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Request-Bodies-and-Overrides)
- [Guide: API Response Mapping Recipes](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Response-Mapping-Recipes)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

## The most important distinction

Use a `Placeholder Source` when the API should provide placeholder values.

Use an `Action Template` when the link execution itself should call the API.

Short rule:

```text
Data before execution -> Placeholder Source
Action during execution -> Action Template
```

## Placeholder source pattern

A placeholder source combines:

- one endpoint
- one response mapping
- one target placeholder name
- one trigger mode

It is used to load data into placeholders at runtime.

Good examples:

- load a project dropdown
- fetch one final token
- enrich several placeholders with customer details

## Action template pattern

An action template combines:

- one endpoint
- optionally one response mapping
- optional runtime placeholders from the action result
- optional success, error, redirect, and confirmation behavior

It is used when opening a link should first execute an API call.

Good examples:

- create a temporary session before opening a URL
- call an approval endpoint first
- ask the API for a redirect target and then use that instead of the normal URL

## How binding works at the link

The central registry objects do nothing by themselves.

They must be bound where the link actually uses them.

### Placeholder source binding

In the link editor:

1. open the placeholder table
2. open the detail row for the placeholder
3. open the `API` tab
4. choose the placeholder source

At that point:

- the placeholder now knows which API source should load it
- the source can use all current placeholder values as request input

### Action template binding

In the link API section:

1. choose the execution mode
2. select the action template
3. optionally add link-local request overrides

## Dependency-driven placeholder loading

A placeholder source can depend on earlier placeholder values.

Example:

- `CUSTOMER_ID` is selected first
- `PROJECTS` source depends on `CUSTOMER_ID`
- endpoint path:

```text
/customers/{{CUSTOMER_ID}}/projects
```

Now the API call only makes sense after `CUSTOMER_ID` exists.

This is how cascading prompts are built:

1. user chooses one input
2. dependent source loads
3. next placeholder shows relevant options

## Case example 1: cascading select fields

Goal:

- choose a customer first
- then load projects for that customer

Setup:

1. placeholder `CUSTOMER_ID` as `select`
2. placeholder `PROJECT` as `select`
3. endpoint path:

```text
/projects/{{CUSTOMER_ID}}
```

4. response mapping:

- mode `Options list`
- value path `id`
- label path `name`

5. placeholder source bound to `PROJECT`
6. source dependency text:

```text
CUSTOMER_ID
```

Result:

- no project request runs until a customer exists
- the project placeholder loads relevant options only after the first choice

## Case example 2: one response fills several placeholders

Goal:

- user enters a customer id
- API loads customer details
- several prompt fields are populated automatically

Setup:

1. endpoint returns one customer object
2. response mapping mode `Object`
3. map several fields:
  - `CUSTOMER_NAME`
  - `CUSTOMER_EMAIL`
  - `CUSTOMER_REGION`

Use this when several placeholders belong to the same backend object.

## Case example 3: action creates runtime data

Goal:

- API action creates a session
- the final URL should use the session id

Setup:

1. action template uses an endpoint such as:

```text
POST /sessions
```

2. response mapping mode `Action result`
3. action result exposes:
  - success
  - message
  - redirect URL or data
4. link execution mode:

```text
Run API action then open URL
```

5. final URL can use action result placeholders if configured

Use this when the execution phase itself must talk to the API.

## Action write-back to placeholders

An action template can now do more than expose runtime placeholders for messages and URLs.

It can also write values back into existing link placeholders for the current session.

This is useful when:

- a `POST` action returns a new status, id, or URL
- the current link text or info area should immediately reflect that result
- a later prompt run should start with the updated runtime value

Important limits:

- write-back is runtime-only
- it does not persist the link itself
- it only targets placeholders that already exist in the link context

### The three write-back source options

#### `mapped.data`

Use this when the action uses `Response mapping = Action result` and the useful payload is inside `data`.

This is usually the cleanest choice.

Example:

```json
{
  "ok": true,
  "message": "Queued",
  "redirectUrl": "",
  "data": {
    "jobId": "42",
    "status": "queued"
  }
}
```

Typical write-back mapping:

```text
LAST_JOB_ID=jobId
LAST_STATUS=status
```

#### `mapped result`

Use this when you need the whole mapped result, not only `data`.

Typical cases:

- write back `message`
- write back `redirectUrl`
- use `ok` as a status flag

Example:

```text
LAST_MESSAGE=message
LAST_REDIRECT=redirectUrl
```

#### `response body`

Use this when the raw parsed API response body should drive the write-back directly.

Typical cases:

- the response already has the right shape
- no action mapping should be required for the write-back
- you want the write-back to use raw server fields before any `Action result` reshaping

### Optional transform before write-back

Before the final placeholder field map runs, the selected write-back source can be transformed with:

- `JMESPath`
- `JSONata`

Use this when the response is nested or needs reshaping first.

Example with `JSONata`:

```json
{
  "jobId": data.id,
  "status": data.state,
  "ownerName": data.owner.name
}
```

Then the write-back field map can stay simple:

```text
LAST_JOB_ID=jobId
LAST_STATUS=status
LAST_OWNER=ownerName
```

In practice, it is often even cleaner to build a small object in the transform and then map the final field names one to one.

Important:

- the transform does not write placeholders by itself
- it only produces the intermediate object used by the final write-back field map

### Difference from runtime placeholders

`Runtime placeholders` and write-back are related, but they are not the same thing.

- `Runtime placeholders`
  - are extra action result values exposed for URLs and messages
- `Write-back`
  - overrides existing placeholder values in the effective runtime layer

That means:

- runtime placeholders are additive
- write-back changes what the link currently sees as the effective placeholder value

## Interaction with Prompt Flow API load steps

Prompt Flow API load steps do not duplicate API integration setup.

They reuse existing placeholder source bindings.

That means:

- the workflow step does not define endpoints again
- it does not define mappings again
- it only says which already bound API placeholders should be loaded now

This is useful when:

- you want prompt step 1 to collect input
- then explicitly load API-backed placeholders
- then continue to the next prompt step

Example:

1. Prompt step collects `CUSTOMER_ID`
2. API load step loads `PROJECT`
3. Prompt step shows `PROJECT`

The endpoint can still use:

```text
/projects/{{CUSTOMER_ID}}
```

because the current prompt values are reused automatically.

## Interaction with Prompt Flow assign steps

Prompt Flow `Assign` steps can reuse API-driven runtime data without redefining the API setup.

Typical uses:

- copy an API-backed placeholder value into a workflow var
- take the `Last API result` from an earlier `API load` step and extract one smaller value
- prepare one derived value for a later condition or execution step

Important behavior:

- `Assign` can write to existing placeholders
- it can also create runtime-only workflow vars
- workflow vars exist only during the current prompt run
- link-local placeholder rules can use those workflow vars as later condition inputs
- placeholder targets must already exist in the effective link context

Example:

1. `Prompt step` collects `CUSTOMER_ID`
2. `API load step` loads `PROJECTS`
3. `Assign step` writes:

```text
WF_PROJECT=PROJECTS
```

Now later steps can use `WF_PROJECT` without turning it into a real saved placeholder.

When conditions read API-backed `select` values, compare against the stored option value, not the label.

Example:

```text
PROJECTS == "batch-worker"
```

not:

```text
PROJECTS == "Batch Worker"
```

## How to decide between auto-loading and explicit flow loading

Use normal placeholder source trigger modes when:

- the source should load automatically on prompt open
- the source should reload on dependency changes
- the flow does not need strict step control

Use an explicit Prompt Flow API load step when:

- the API call should happen only at one specific point in the flow
- you want a visible loading/retry step
- you want to prevent early automatic loads for workflow-managed API placeholders

## Common mistakes

### Mistake 1: creating action templates for normal prompt data

If the value should simply populate a placeholder, use a placeholder source.

### Mistake 2: creating duplicate endpoints for each link

Usually:

- endpoint = shared request definition
- link binding = local usage decision

### Mistake 3: forgetting that binding happens on the link

Creating a source or action template in the API dialog does not activate it anywhere yet.

### Mistake 4: trying to rebuild API logic inside the workflow

The workflow should orchestrate.

The API dialog should keep the technical request setup.

## Safe setup order

1. Create placeholders first.
2. Create connection and endpoint.
3. Test the endpoint.
4. Create the response mapping.
5. Create the placeholder source or action template.
6. Bind it to the link.
7. Only then add prompt flow orchestration or request overrides.

## Related examples

- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Request Bodies and Overrides](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Request-Bodies-and-Overrides)
- [Guide: API Response Mapping Recipes](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Response-Mapping-Recipes)
