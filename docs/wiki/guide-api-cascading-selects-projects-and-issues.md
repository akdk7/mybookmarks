# Guide: API Cascading Selects for Projects and Issues

## Purpose

This guide explains the exact setup for a common runtime pattern:

- choose a project first
- then load issues for that project
- both requests use the same API connection
- the second request uses a different endpoint
- the selected project is passed into that second endpoint

Use this guide when you want to build:

- `PROJECT` as a runtime dropdown
- `ISSUE` as a dependent runtime dropdown
- link prompts that react to the project selection immediately

Related pages:

- [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)
- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Cascading Select Examples for Jira Cloud and GitLab](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Cascading-Select-Examples-for-Jira-Cloud-and-GitLab)
- [Guide: API Placeholder Sources and Actions](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Placeholder-Sources-and-Actions)
- [Guide: API Request Bodies and Overrides](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Request-Bodies-and-Overrides)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

## The short model

The working chain is:

```text
Connection
-> projects endpoint
-> projects response mapping
-> projects placeholder source
-> link binding for PROJECT

Connection
-> issues endpoint
-> issues response mapping
-> issues placeholder source
-> link binding for ISSUE

PROJECT value
-> inserted into the issues endpoint request
-> ISSUE options load
```

Important:

- the shared technical access belongs to the `Connection`
- the actual request shape belongs to the `Endpoint`
- runtime dropdown behavior belongs to the `Placeholder Source`
- the link decides which placeholder uses which source

## First decision: where does `PROJECT` come from?

There are two valid patterns.

### Pattern A: `PROJECT` is also loaded from the API

Use this when the user should choose from live project data.

Typical result:

1. prompt opens
2. project list loads
3. user selects a project
4. issue list loads for that project

### Pattern B: `PROJECT` is manual or static

Use this when the project is:

- already stored as a default placeholder value
- typed manually by the user
- chosen from a fixed static option list

Typical result:

1. prompt shows the project field immediately
2. user enters or selects a project
3. issue list loads for that project

The rest of this guide works for both patterns.

## Required placeholder setup

Create two link placeholders first.

### Placeholder 1: `PROJECT`

Recommended type:

```text
select
```

If the user should type it manually, `text` also works.

Recommended baseline:

- name: `PROJECT`
- type: `select` or `text`
- required: `true`
- prompt visible: `true`

### Placeholder 2: `ISSUE`

Recommended type:

```text
select
```

Recommended baseline:

- name: `ISSUE`
- type: `select`
- required: `true`
- prompt visible: `true`

Important:

- if a placeholder source returns an `Options list`, the target placeholder should be `select` or `multiselect`
- `ISSUE` should normally be `select`

## Important runtime rule: the prompt only shows relevant placeholders

The runtime prompt is not a general placeholder dump.

A placeholder is reliably available in the runtime flow when it is included by at least one of these mechanisms:

- it appears in the effective URL template
- it is bound as an API placeholder on the link
- it is referenced by Prompt Flow

For this specific scenario:

- `ISSUE` is naturally relevant because it is usually used in the final URL
- `PROJECT` must also be available in the prompt if it should drive the issue request

Practical rule:

- if `PROJECT` is part of the final URL, you are already fine
- if `PROJECT` is not part of the final URL, still keep it as a real prompt field via link placeholder usage or Prompt Flow

## Step 1: create one shared `Connection`

In `API Integrations`, create one connection for the shared backend.

Typical example:

```text
Name: Issue Tracker API
Base URL: https://api.example.com
Auth: whatever your API requires
```

Rule:

- if both requests talk to the same backend and use the same auth model, use one shared connection

## Step 2: create the `PROJECT` endpoint

Create an endpoint for loading projects.

Typical example:

```text
Method: GET
Path: /projects
```

If the API needs extra request data, use:

- query parameters
- headers
- body

Examples:

```text
GET /projects
```

or:

```text
GET /projects?active=true
```

or:

```text
Header: X-Tenant: {{TENANT}}
```

If `PROJECT` is not API-backed, you can skip this entire step.

## Step 3: create the `PROJECT` response mapping

If the project list should fill a dropdown, use:

```text
Mode: Options list
```

Typical mapping:

- collection path: `projects[*]`
- value path: `id`
- label path: `name`

Important:

- `value` is what MyBookmarks stores in the placeholder
- `label` is what the user sees in the dropdown

This matters for the issues request:

- if the issues endpoint expects a project id, then `PROJECT.value` must be that id
- if the issues endpoint expects a project key or slug, then `PROJECT.value` must be that key or slug

## Step 4: create the `PROJECT` placeholder source

Only do this if the project dropdown itself is API-backed.

Recommended setup:

- placeholder name: `PROJECT`
- endpoint: your projects endpoint
- response mapping: your projects options mapping
- trigger mode: `onPromptOpen`

Why `onPromptOpen`:

- the project list is usually needed as soon as the dialog opens

Good example:

```text
Name: Project Source
Placeholder name: PROJECT
Trigger: On prompt open
Depends on: empty
```

If the project source should only load on demand, use:

```text
manual
```

instead.

## Step 5: create the `ISSUE` endpoint

This is the key part.

Create a second endpoint that uses the same connection, but a different request path or request shape.

Typical path-based example:

```text
Method: GET
Path: /projects/{{PROJECT}}/issues
```

Typical query-based example:

```text
Method: GET
Path: /issues
Query:
project={{PROJECT}}
```

Typical header-based example:

```text
Method: GET
Path: /issues
Headers:
X-Project: {{PROJECT}}
```

Typical JSON-body example:

```json
{
  "project": "{{PROJECT}}"
}
```

Use whichever shape your backend expects.

Important:

- the placeholder token must match the runtime placeholder name exactly
- `{{PROJECT}}` is resolved from the current prompt state before the request is sent

## Step 6: create the `ISSUE` response mapping

For a dependent issue dropdown, use:

```text
Mode: Options list
```

Typical mapping:

- collection path: `issues[*]`
- value path: `key`
- label path: `summary`

Alternative mapping:

- value path: `id`
- label path: `title`

Choose the mapping based on what the final link should store.

Examples:

- use `key` if the final URL needs something like `PROJ-123`
- use `id` if the backend expects an internal numeric id later

## Step 7: create the `ISSUE` placeholder source

This source is what turns the second request into a cascading dropdown.

Recommended setup:

- placeholder name: `ISSUE`
- endpoint: your issues endpoint
- response mapping: your issues options mapping
- trigger mode: `onDependencyChange`
- depends on:

```text
PROJECT
```

This is the critical dependency definition.

Meaning:

- no issue request should run until `PROJECT` has a value
- when `PROJECT` changes, the old issue state becomes stale
- the issue field is cleared
- the issue request runs again with the new project value

## Step 8: bind both sources on the link

The central registry entries do nothing until the current link binds them.

In the link editor:

1. open the placeholder table
2. open the detail row for `PROJECT`
3. in the `API` tab, choose the project source
4. open the detail row for `ISSUE`
5. in the `API` tab, choose the issue source

Result:

```text
PROJECT -> projects source
ISSUE -> issues source
```

Important:

- the source has its own `placeholderName`
- the link binding is still the real consumer-side attachment
- the link decides which placeholder actually uses which source at runtime

## Step 9: define prompt behavior

Enable the runtime prompt on the link.

Recommended minimum:

- `Prompt for placeholders before executing link actions` = enabled
- `Open` action = enabled

This is enough for the normal runtime flow.

### When you do not need Prompt Flow

You do not need Prompt Flow if:

- `PROJECT` and `ISSUE` are both normal prompt fields
- the issue source should react immediately when `PROJECT` changes

This is the simplest setup.

### When Prompt Flow may help

Prompt Flow is optional but useful when you want stricter sequencing:

1. `Prompt step` for `PROJECT`
2. `API load step` for `ISSUE`
3. `Execution step`

Use this when you want the user journey to feel explicitly staged instead of reactive.

## Exact recommended setup for the common case

Assume:

- one API connection
- one live project dropdown
- one dependent issue dropdown
- final URL uses both values

### Placeholders

```text
PROJECT  -> select
ISSUE    -> select
```

### URL template

Example:

```text
https://app.example.com/projects/{{PROJECT}}/issues/{{ISSUE}}
```

### Connection

```text
Issue Tracker API
Base URL: https://api.example.com
```

### Endpoint 1

```text
Name: Projects Endpoint
Method: GET
Path: /projects
```

### Mapping 1

```text
Name: Projects Mapping
Mode: Options list
Collection path: projects[*]
Value path: id
Label path: name
```

### Source 1

```text
Name: Project Source
Placeholder name: PROJECT
Endpoint: Projects Endpoint
Response mapping: Projects Mapping
Trigger mode: On prompt open
Depends on: empty
```

### Endpoint 2

```text
Name: Issues Endpoint
Method: GET
Path: /projects/{{PROJECT}}/issues
```

### Mapping 2

```text
Name: Issues Mapping
Mode: Options list
Collection path: issues[*]
Value path: key
Label path: summary
```

### Source 2

```text
Name: Issue Source
Placeholder name: ISSUE
Endpoint: Issues Endpoint
Response mapping: Issues Mapping
Trigger mode: On dependency change
Depends on:
PROJECT
```

### Link bindings

```text
PROJECT -> Project Source
ISSUE -> Issue Source
```

### Prompt

```text
Prompt enabled: yes
Open action enabled: yes
```

## Exact recommended setup when `PROJECT` is static

If `PROJECT` does not need live API data:

- keep `PROJECT` as a normal placeholder
- give it either:
  - a stored default value
  - manual user input
  - a static option list

Then only `ISSUE` needs an API source.

### Minimal setup

#### Placeholder `PROJECT`

Example static options:

```text
core
platform
ops
```

#### Placeholder `ISSUE`

```text
Type: select
```

#### Issues endpoint

```text
/projects/{{PROJECT}}/issues
```

#### Issues source

```text
Placeholder name: ISSUE
Trigger mode: On dependency change
Depends on:
PROJECT
```

This is the shortest working path if only the second dropdown should be live.

## When to use request overrides

Normally:

- define the stable request shape on the endpoint
- keep link-local overrides empty

Use a link binding request override only when this exact link needs extra request details.

Examples:

- add a fixed query flag
- add a tenant-specific header
- replace the body only on one link

Example override on the `ISSUE` binding:

```text
Query:
scope=linked

Headers:
X-Project: {{PROJECT}}
```

This does not replace the endpoint itself.

It extends or overrides request details for this one binding.

## What should happen at runtime

With the recommended setup, the expected behavior is:

1. the user opens the link
2. the prompt appears
3. project options load on prompt open
4. the user selects a project
5. the issue source sees that `PROJECT` changed
6. the old issue state is cleared
7. the issues endpoint runs with the selected `PROJECT`
8. the issue dropdown is repopulated
9. the user selects an issue
10. the resolved URL executes

## Validation checklist

If the setup does not work, check these items in order.

### 1. Is `ISSUE` really a `select`?

If not, an `Options list` source is the wrong fit.

### 2. Is `PROJECT` available in the link context?

The issue source dependency:

```text
PROJECT
```

only works when `PROJECT` exists as a real runtime placeholder.

### 3. Does the issues endpoint use the correct placeholder token?

Example:

```text
/projects/{{PROJECT}}/issues
```

If the actual placeholder is called `PROJECT_ID`, then `{{PROJECT}}` is wrong.

### 4. Does `PROJECT.value` contain what the endpoint expects?

If the API expects:

```text
project id
```

but the project mapping stores:

```text
project label
```

then the second request will be wrong.

### 5. Is the issue source trigger mode correct?

For cascading behavior it should normally be:

```text
onDependencyChange
```

### 6. Is the dependency text correct?

It should be:

```text
PROJECT
```

not:

```text
{{PROJECT}}
```

and not a label such as:

```text
Project
```

### 7. Is the binding attached to the link?

Creating registry entries is not enough.

The link must bind:

```text
ISSUE -> issue source
```

and, if needed:

```text
PROJECT -> project source
```

### 8. Is `PROJECT` missing from the prompt because it is not relevant?

If `PROJECT` is not part of the URL and not otherwise included in the prompt flow, the user cannot select it there.

## Recommended naming

To keep the setup maintainable, use clear names.

Example:

- connection: `Issue Tracker API`
- endpoint: `Projects Endpoint`
- endpoint: `Issues by Project Endpoint`
- mapping: `Projects Options`
- mapping: `Issues Options`
- source: `Project Source`
- source: `Issue Source`

Avoid generic names such as:

- `Source 1`
- `Mapping A`
- `Endpoint Test`

## Example summary

If you only want the final recipe:

```text
Placeholder PROJECT = select
Placeholder ISSUE = select

Projects source:
- endpoint /projects
- mapping Options list
- trigger On prompt open

Issues source:
- endpoint /projects/{{PROJECT}}/issues
- mapping Options list
- trigger On dependency change
- depends on PROJECT

Link bindings:
- PROJECT -> Projects source
- ISSUE -> Issues source

Prompt:
- enabled
- open action enabled
```

That is the exact setup for:

- same API connection
- different endpoints
- selected project passed into the second endpoint
- issue dropdown updated immediately after project selection
