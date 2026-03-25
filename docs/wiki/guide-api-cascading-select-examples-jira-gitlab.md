# Guide: API Cascading Select Examples for Jira Cloud and GitLab

## Purpose

This guide provides ready-to-enter example setups for two common backends:

- Jira Cloud
- GitLab

It is the practical companion to:

- [Guide: API Cascading Selects for Projects and Issues](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Cascading-Selects-for-Projects-and-Issues)

Use this page when you do not want another abstract explanation and instead need:

- exact example placeholder names
- concrete example endpoints
- concrete response mappings
- concrete trigger and dependency settings
- final URL examples

Related pages:

- [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)
- [Guide: API Integration Quick Start](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Integration-Quick-Start)
- [Guide: API Placeholder Sources and Actions](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Placeholder-Sources-and-Actions)
- [Guide: API Request Bodies and Overrides](https://github.com/akdk7/mybookmarks/wiki/Guide:-API-Request-Bodies-and-Overrides)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

Official vendor references used for the examples below, checked on 2026-03-24:

- Jira Cloud Projects API:
  - https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-projects/
- Jira Cloud Issue Search API:
  - https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/
- GitLab Projects API:
  - https://docs.gitlab.com/api/projects/
- GitLab Issues API:
  - https://docs.gitlab.com/api/issues/

## Before you start

These examples assume:

- you already know how to open `API Integrations`
- you already know how to bind a placeholder source to a link field
- you want `PROJECT` to drive a dependent `ISSUE` field

All examples below use this runtime target pattern:

1. load project choices
2. user selects a project
3. load issue choices for that project
4. user selects an issue
5. open the final resolved URL

## Example 1: Jira Cloud

## Why this Jira example is designed this way

For Jira Cloud, the cleanest project-to-issue setup is usually:

- store the project `key` in `PROJECT`
- search issues with JQL
- store the issue `key` in `ISSUE`
- open the final issue in the normal browser URL

This avoids needing extra transformation placeholders just to build the final issue link.

## Resulting runtime behavior

The user flow becomes:

1. load Jira projects
2. choose a Jira project key such as `CORE`
3. load issues with a JQL search for that project
4. choose an issue such as `CORE-123`
5. open:

```text
https://your-domain.atlassian.net/browse/CORE-123
```

## Recommended placeholders

Create these link placeholders:

### `PROJECT`

```text
Name: PROJECT
Type: select
Required: true
Prompt visible: true
```

### `ISSUE`

```text
Name: ISSUE
Type: select
Required: true
Prompt visible: true
```

## Recommended final URL template

```text
https://your-domain.atlassian.net/browse/{{ISSUE}}
```

## Jira connection

Example:

```text
Name: Jira Cloud
Base URL: https://your-domain.atlassian.net
```

Authentication depends on your Jira setup.

Common Jira Cloud choices are:

- Basic auth with email plus API token
- OAuth

Configure that at the connection level as required by your tenant.

## Jira endpoint 1: projects

Create this endpoint:

```text
Name: Jira Projects
Method: GET
Path: /rest/api/3/project/search
Body mode: none
```

Optional query example:

```text
maxResults=100
```

## Jira response mapping 1: projects options

Create this response mapping:

```text
Name: Jira Projects Options
Mode: Options list
Collection path: values[*]
Value path: key
Label path: name
Detail path: id
```

Why this mapping:

- `value = key` gives you `CORE`, `OPS`, `WEB`
- JQL works naturally with project keys
- the final issue URL does not need the project id

## Jira placeholder source 1: project source

Create this placeholder source:

```text
Name: Jira Project Source
Placeholder name: PROJECT
Endpoint: Jira Projects
Response mapping: Jira Projects Options
Trigger mode: onPromptOpen
Depends on: empty
```

## Jira endpoint 2: issues by project

For Jira issue loading, use a POST search endpoint.

Recommended example:

```text
Name: Jira Issues by Project
Method: POST
Path: /rest/api/3/search
Body mode: json
```

Body template:

```json
{
  "jql": "project = {{PROJECT}} ORDER BY updated DESC",
  "fields": ["summary", "status"],
  "maxResults": 50
}
```

Important:

- this example uses the classic search endpoint that Atlassian still documents
- if your Jira tenant already requires the enhanced search endpoint, switch the path to:

```text
/rest/api/3/search/jql
```

and keep the same basic search body structure

## Jira response mapping 2: issues options

Create this response mapping:

```text
Name: Jira Issues Options
Mode: Options list
Collection path: issues[*]
Value path: key
Label path: fields.summary
Detail path: fields.status.name
```

Why this mapping:

- `value = key` gives you issue keys such as `CORE-123`
- `label = fields.summary` gives a user-friendly dropdown
- `detail = fields.status.name` is optional but helpful in previews

## Jira placeholder source 2: issue source

Create this placeholder source:

```text
Name: Jira Issue Source
Placeholder name: ISSUE
Endpoint: Jira Issues by Project
Response mapping: Jira Issues Options
Trigger mode: onDependencyChange
Depends on:
PROJECT
```

## Jira link bindings

On the link, bind:

```text
PROJECT -> Jira Project Source
ISSUE -> Jira Issue Source
```

## Jira prompt settings

Enable:

```text
Prompt for placeholders before executing link actions
Open
```

That is enough for the reactive two-step dropdown behavior.

## Jira finished summary

If you only want the compact recipe:

### URL

```text
https://your-domain.atlassian.net/browse/{{ISSUE}}
```

### `PROJECT` field

```text
select
```

### `ISSUE` field

```text
select
```

### Projects endpoint

```text
GET /rest/api/3/project/search
```

### Projects mapping

```text
values[*]
value = key
label = name
```

### Issues endpoint

```text
POST /rest/api/3/search
```

### Issues request body

```json
{
  "jql": "project = {{PROJECT}} ORDER BY updated DESC",
  "fields": ["summary", "status"],
  "maxResults": 50
}
```

### Issues mapping

```text
issues[*]
value = key
label = fields.summary
detail = fields.status.name
```

### Trigger chain

```text
PROJECT source -> onPromptOpen
ISSUE source -> onDependencyChange, depends on PROJECT
```

## Example 2: GitLab

## Why this GitLab example is designed this way

GitLab gives you a few valid project identifiers:

- numeric project id
- URL-encoded project path

MyBookmarks API template resolution does not automatically URL-encode API path placeholder values.

Because of that, the safest GitLab example is:

- store the numeric project `id` in `PROJECT`
- call:

```text
/projects/{{PROJECT}}/issues
```

- store the issue `web_url` directly in `ISSUE`
- use the final URL:

```text
{{ISSUE}}
```

This keeps the configuration simple and avoids path-encoding problems.

## Resulting runtime behavior

The user flow becomes:

1. load GitLab projects
2. choose a project such as `Platform / Core Web`
3. load issues for the selected numeric project id
4. choose an issue by title
5. open the issue web URL directly

## Recommended placeholders

Create these link placeholders:

### `PROJECT`

```text
Name: PROJECT
Type: select
Required: true
Prompt visible: true
```

### `ISSUE`

```text
Name: ISSUE
Type: select
Required: true
Prompt visible: true
```

## Recommended final URL template

```text
{{ISSUE}}
```

Because the issue mapping stores the final `web_url`, the URL template can stay minimal.

## GitLab connection

Example:

```text
Name: GitLab
Base URL: https://gitlab.example.com/api/v4
```

Typical authentication approaches:

- `PRIVATE-TOKEN` header
- Bearer token

Configure auth at the connection level according to your GitLab instance.

## GitLab endpoint 1: projects

Create this endpoint:

```text
Name: GitLab Projects
Method: GET
Path: /projects
Body mode: none
```

Recommended query parameters:

```text
membership=true
simple=true
order_by=last_activity_at
sort=desc
```

These are optional, but they usually make the project list more useful.

## GitLab response mapping 1: projects options

Create this response mapping:

```text
Name: GitLab Projects Options
Mode: Options list
Collection path: [*]
Value path: id
Label path: name_with_namespace
Detail path: path_with_namespace
```

Why this mapping:

- `value = id` is safe for the dependent issues API path
- `label = name_with_namespace` is much clearer than a plain project name

## GitLab placeholder source 1: project source

Create this placeholder source:

```text
Name: GitLab Project Source
Placeholder name: PROJECT
Endpoint: GitLab Projects
Response mapping: GitLab Projects Options
Trigger mode: onPromptOpen
Depends on: empty
```

## GitLab endpoint 2: issues by project

Create this endpoint:

```text
Name: GitLab Issues by Project
Method: GET
Path: /projects/{{PROJECT}}/issues
Body mode: none
```

Recommended query parameters:

```text
state=opened
order_by=updated_at
sort=desc
```

Optional search example:

```text
search={{ISSUE_QUERY}}
```

Only add that if you also want a separate query placeholder.

## GitLab response mapping 2: issues options

Create this response mapping:

```text
Name: GitLab Issues Options
Mode: Options list
Collection path: [*]
Value path: web_url
Label path: title
Detail path: references.full
```

Why this mapping:

- `value = web_url` means the selected issue is already the final browser URL
- `label = title` makes the dropdown readable
- `detail = references.full` shows a familiar issue reference such as `group/project#14`

Alternative:

If you prefer to store the issue IID instead, use:

```text
Value path: iid
```

but then your final URL can no longer be just `{{ISSUE}}`.

## GitLab placeholder source 2: issue source

Create this placeholder source:

```text
Name: GitLab Issue Source
Placeholder name: ISSUE
Endpoint: GitLab Issues by Project
Response mapping: GitLab Issues Options
Trigger mode: onDependencyChange
Depends on:
PROJECT
```

## GitLab link bindings

On the link, bind:

```text
PROJECT -> GitLab Project Source
ISSUE -> GitLab Issue Source
```

## GitLab prompt settings

Enable:

```text
Prompt for placeholders before executing link actions
Open
```

## GitLab finished summary

If you only want the compact recipe:

### URL

```text
{{ISSUE}}
```

### `PROJECT` field

```text
select
```

### `ISSUE` field

```text
select
```

### Projects endpoint

```text
GET /projects
```

### Projects query

```text
membership=true
simple=true
order_by=last_activity_at
sort=desc
```

### Projects mapping

```text
[*]
value = id
label = name_with_namespace
detail = path_with_namespace
```

### Issues endpoint

```text
GET /projects/{{PROJECT}}/issues
```

### Issues query

```text
state=opened
order_by=updated_at
sort=desc
```

### Issues mapping

```text
[*]
value = web_url
label = title
detail = references.full
```

### Trigger chain

```text
PROJECT source -> onPromptOpen
ISSUE source -> onDependencyChange, depends on PROJECT
```

## Practical comparison

If you are unsure which pattern is cleaner, use this rule:

### Jira Cloud

Prefer:

- `PROJECT = project key`
- `ISSUE = issue key`
- final URL assembled from the issue key

### GitLab

Prefer:

- `PROJECT = numeric project id`
- `ISSUE = issue web_url`
- final URL taken directly from the issue value

Reason:

- Jira browser URLs naturally use issue keys
- GitLab issue list responses naturally expose `web_url`
- GitLab project paths are more annoying if you do not explicitly handle URL encoding

## If your GitLab setup prefers project paths instead of ids

GitLab also accepts a URL-encoded project path as the project identifier.

Example:

```text
group%2Fmy-project
```

Only use this approach if you are sure the value is already URL-encoded before it reaches the endpoint path.

Otherwise, the safer choice in MyBookmarks is still:

```text
PROJECT = numeric id
```

## Troubleshooting by backend

## Jira Cloud

### Project list loads, issue list stays empty

Check:

- does `PROJECT` store the Jira project key and not the project name?
- is the JQL body still valid after placeholder substitution?
- does your tenant require `/rest/api/3/search/jql` instead of `/rest/api/3/search`?

### Issue dropdown loads, but the final link is wrong

Check:

- does `ISSUE` store the issue key?
- is the final URL:

```text
https://your-domain.atlassian.net/browse/{{ISSUE}}
```

and not a URL that still expects a numeric id?

## GitLab

### Project list looks fine, but issue loading fails

Check:

- does `PROJECT` store the numeric project id?
- is the issues endpoint path exactly:

```text
/projects/{{PROJECT}}/issues
```

- is the GitLab connection base URL already ending in `/api/v4`?

### Issue dropdown loads, but opening the link fails

Check:

- does `ISSUE` store `web_url`?
- is the final link template simply:

```text
{{ISSUE}}
```

and not:

```text
https://gitlab.example.com/{{ISSUE}}
```

## Final recommendation

If you want the least fragile first implementation:

- use the Jira example exactly as written
- use the GitLab example exactly as written
- only introduce request overrides, alternate identifiers, or Prompt Flow after the basic two-select chain works
