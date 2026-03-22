# Dialog: Link Placeholder Prompt

## Purpose

The Link Placeholder Prompt is the runtime dialog that asks the user for placeholder values immediately before executing a link action.

It is the operational counterpart to:
- placeholder authoring in the editors
- placeholder rules
- static expression authoring in the Expression Editor

In other words:
- editors define the structure
- rules define dynamic prompt behavior
- the runtime prompt collects the final action-specific values

## Typical actions that can trigger it

- open link
- copy resolved URL
- share resolved link
- generate QR code for the resolved URL

The same link can require prompting for some actions and skip it for others.

## When the prompt appears

The dialog appears only if all of the following are true:
- the link has a URL template with placeholders
- placeholder prompting is enabled for the link
- the current action is enabled in the prompt action settings

If a link has no relevant URL placeholders, the prompt does not appear.

## Where it is configured

The prompt is configured in the generic link edit dialog and, where applicable, in reference-link editing flows.

Key settings:
- `Prompt for placeholders before executing link actions`
- action toggles for:
  - `Open`
  - `QR`
  - `Copy`
  - `Share`
- optional focus placeholder

### Current link-editor configuration surface

For normal links, placeholder-prompt setup now lives in the guided link editor flow.

Current behavior:

- the link editor opens in a guided simple mode by default
- the common path is split into `Basics`, `Fields`, `Flow`, and `Execute`
- the action toggles for `Open`, `QR`, `Copy`, and `Share` are shown as a compact action grid
- field rows in simple mode already show whether a value is:
  - `Manual`
  - `API value`
  - `API choice list`
- simple mode can start Prompt Flow from presets such as:
  - ask for values
  - ask, then load API values
  - ask, then execute
- `Show advanced` reveals lower-level authoring surfaces such as:
  - placeholder rules
  - raw flow conditions and branch expressions
  - assign steps
  - API override surfaces

Important:

- the link editor does not replace the full `API Integrations` dialog
- it is the guided binding/orchestration surface for the current link
- deep API editing still happens in:
  - [Dialog: API Integrations](https://github.com/akdk7/mybookmarks/wiki/Dialog:-API-Integrations)

## What the prompt resolves

The prompt works on the current effective placeholder scope.

### Direct links
The available fields come from:
1. global placeholders
2. group placeholders
3. link placeholders
4. temporary prompt overrides for the current run

### Reference links
The available fields come from:
1. global placeholders
2. reference-link group placeholders
3. source-link placeholders
4. reference-link local placeholders
5. temporary prompt overrides for the current run

This means the dialog can present a merged, context-aware field list even if the actual placeholder definitions live in different editors.

## What the runtime dialog shows

The dialog contains:
- the template being resolved
- a live details area for the resulting URL and diagnostic feedback
- one prompt row per relevant placeholder in the current URL template
- type-aware controls
- prompt-rule-driven field behavior
- step description text below the progress area when the active Prompt Flow step has a description

Prompt row controls can include:
- text input
- number input
- boolean select
- single-select dropdown
- multi-select list

## Type-aware field behavior

The runtime input adapts to the placeholder type.

### Text
Best for free-form values.

Example:
```text
PROJECT = alpha
```

### Number
Useful for IDs, counters, build numbers, and numeric comparisons.

Example:
```text
BUILD = 42
```

### Boolean
Useful for yes/no switches such as:
```text
PREVIEW = true
```

### Select
Useful when only one defined option may be chosen.

Example options:
```text
dev
test
prod
```

### Multiselect
Useful when several values may be chosen at once.

Example:
```text
alpha,beta
```

## Prompt rules inside the runtime dialog

The prompt is where placeholder rules become visible to the user.

Rules can:
- hide fields
- make fields required
- replace the available option set
- reset stale values

Example:
- `COUNTRY` selected as `DE`
- `CITY` becomes required
- `CITY` options shrink to German cities only

Detailed rule authoring is documented here:
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)

## Focus placeholder

The prompt can optionally focus a specific placeholder first.

This is useful when:
- one placeholder is the main decision point
- the action should start with the most important input
- a prompt contains many inherited fields but one field is the real driver

Example:
- URL template:
  ```text
  https://example.com/{{ COUNTRY }}/{{ CITY }}
  ```
- focus placeholder:
  ```text
  COUNTRY
  ```

The prompt then starts with the country field even if more placeholders are available.

## Execution behavior

Once the dialog opens:
1. the app builds the effective placeholder list
2. it builds and validates the effective rule set
3. prompt rows are sorted in a dependency-aware order
4. the user enters or adjusts values
5. the URL is resolved from the current prompt state
6. the chosen action executes against the resolved URL

Important:
- prompt values are temporary
- they do not overwrite stored placeholder defaults
- required missing values block execution
- unresolved or missing values remain visible in the details area
- if a Prompt Flow step currently has no visible fields because rules hide them, the dialog shows an empty-step message instead of inventing values automatically

## Prompt Flow steps

If the link uses Prompt Flow, the runtime dialog can move through several step types.

Common step types are:

- `Prompt step`
  - shows one or more placeholders for user input
- `Branch step`
  - evaluates an expression and jumps to a `true` or `false` destination
- `API load step`
  - loads API-bound placeholders at one explicit point in the flow
  - reuses the already configured placeholder source binding
- `Assign step`
  - reads from one runtime source
  - optionally transforms the value
  - writes into existing placeholders and/or workflow vars
- `Execution step`
  - shows the final review state
  - is terminal for the current flow run

Important:

- an `Execution step` should be treated as the end of the flow
- steps after it are not reached during normal runtime
- `API load` does not define endpoints or mappings again
- it only orchestrates existing API placeholder bindings

## Prompt Flow editor conveniences

The current step editor is designed for larger flows as well.

Available step controls include:

- move step up
- move step down
- duplicate step
- delete step
- `Insert before`
- `Insert after`
- collapse/expand one step
- `Expand all`
- `Collapse all`

Current behavior:

- existing steps open collapsed when the link dialog is opened
- insertion before/after is grouped in the per-step overflow menu

## Step-specific editor hints

The editor now exposes more runtime-relevant context directly next to the step being edited.

### Prompt and API load steps

- can show `Rules affecting this step`
- this is useful when placeholder rules change the fields that the current step will actually expose

### Assign steps

Assign steps now show:

- available placeholders
- workflow vars written by earlier assign steps
- whether `Last API result` is already available from an earlier API load step
- `Rules affecting this step` for placeholders written by the assign step

### API shortcuts

When the current flow step is tied to existing API definitions, the editor can show shortcut buttons that open the linked configuration directly in `API Integrations`.

Examples:

- `API load` step:
  - placeholder source
  - response mapping
  - endpoint
- `Execution step`:
  - action template
  - response mapping
  - endpoint

## Assign steps and workflow vars

`Assign` steps are useful when the flow should derive temporary values between user-facing steps.

The source can be:

- `Current placeholders`
- `Workflow variable`
- `Last API result`

### What `Write placeholders` does

`Write placeholders` only writes into placeholders that already exist in the effective link context.

That means:

- global placeholders are allowed
- group placeholders are allowed
- link placeholders are allowed
- new placeholder names are not created automatically

Example:

```text
PROJECT_SECOND=PROJECTS
```

This is valid only if `PROJECT_SECOND` already exists as a placeholder.

### What `Write workflow vars` does

`Write workflow vars` creates or updates runtime-only workflow vars for the current prompt run.

Use workflow vars when:

- you need a temporary intermediate value
- the value should be used in a later step condition
- the value should not become a real saved placeholder

Example:

```text
WF_PROJECT=PROJECTS
```

Workflow vars are runtime-only, but they are no longer limited to branch and step expressions.

Current behavior:

- later `Assign` steps can read earlier workflow vars as a source
- later Prompt Flow conditions and branch expressions can read them
- link-local placeholder rules can also use them as condition fields

This makes it possible to:

- derive a runtime-only intermediate value in one step
- keep it out of the saved placeholder set
- still let it influence later field visibility, required state, options, or resets

### Mapping syntax

Both assignment fields use this format:

```text
TARGET=path
```

Important details:

- the right side is always interpreted as a source path
- it is not a literal value syntax
- `TARGET=PROJECTS` reads the current value of `PROJECTS`
- `TARGET=` writes the whole current source
- `TARGET=1` tries to read path `1`; it does not assign the number `1` as a literal

### Availability rules

- `Workflow variable` as a source only works after an earlier `Assign` step already wrote that variable
- `Last API result` only works after an earlier `API load` step has completed
- the same step does not first create and then read a new workflow var; reads happen before writes

## Step conditions and expression values

`Show this step when` and branch conditions use the same custom placeholder expression language as other placeholder expressions.

Important rules:

- use `==`, not `=`
- equality is type-sensitive
- `number` placeholders compare as numbers
- `text` placeholders compare as strings
- `select` and API-backed `select` values are compared by stored value, not by visible label

Examples:

```text
PROOF == 1
PROJECTS == "batch-worker"
OK in "1|3"
```

For API-backed choices, compare against the stored option value, not the human-readable label.

Current behavior:

- if the first flow step has a `Show this step when` condition that evaluates to `false`, that first step is currently kept visible and blocks the primary action instead of being auto-skipped
- later conditional steps are skipped normally when their condition is `false`

## Missing vs unresolved values

The prompt distinguishes between two different problems.

### Unresolved
The template refers to a placeholder name that does not exist in the effective scope.

Example:
```text
URL template: https://example.com/{{ UNKNOWN_TOKEN }}
```

Result:
- unresolved placeholder warning
- action blocked if the URL cannot be fully resolved

### Missing
The placeholder exists, but its required value is empty.

Example:
```text
TOKEN exists but is required and empty
```

Result:
- missing value warning
- action blocked until the value is provided

## Detailed examples

### Example 1: action-specific prompting

Configuration:
- `Open`: prompt enabled
- `Copy`: prompt disabled
- `Share`: prompt enabled
- `QR`: prompt enabled

Behavior:
- clicking the normal link opens the prompt
- copying the link uses stored values directly
- sharing opens the prompt first
- QR generation opens the prompt first

This is useful when:
- the copied URL usually uses defaults
- but share and open should still allow a last-moment confirmation

### Example 2: country/city guided input

Template:
```text
https://portal.example.com/{{ COUNTRY }}/{{ CITY }}
```

Placeholders:
- `COUNTRY` as `select`
- `CITY` as `select`

Rules:
- if `COUNTRY == DE`, city options become:
  ```text
  Berlin
  Hamburg
  Munich
  ```
- if `COUNTRY == US`, city options become:
  ```text
  New York
  San Francisco
  Chicago
  ```

Prompt flow:
1. choose country
2. city options update immediately
3. choose city
4. execute action with the resolved URL

### Example 3: optional branch

Template:
```text
https://api.example.com/items?mode={{ MODE }}&token={{ ADVANCED_TOKEN }}
```

Rules:
- show `ADVANCED_TOKEN` only when `MODE == advanced`

Prompt flow:
- choose `basic` -> token field stays hidden
- choose `advanced` -> token field appears

### Example 4: temporary runtime value without overwriting defaults

Stored global default:
```text
ENV = prod
```

During one prompt execution:
```text
ENV = test
```

Action result:
- only the current execution uses `test`
- the stored default remains `prod`

### Example 5: workflow var drives a later prompt-step rule

Flow:

1. prompt step collects `MODE`
2. assign step writes:
   ```text
   WF_MODE=MODE
   ```
3. later rule uses `WF_MODE`

Rule:

```text
Target: DETAIL
Effect: visibility
Condition: WF_MODE equals "advanced"
Result: visible = true
```

Meaning:

- the prompt flow can derive one runtime-only flag
- the later step does not need another saved placeholder just to drive its prompt behavior

## Typical use cases

- customer- or environment-specific URLs
- share/copy flows where the final URL should be reviewed first
- QR generation that depends on a location, tenant, or mode
- guided prompts for deployment, support, or reporting links
- reference links that inherit most values but allow local refinement

## Best practices

- keep prompt-facing placeholders typed whenever possible
- use `select` and `multiselect` to reduce user mistakes
- use rules to guide the prompt instead of forcing the user to understand the full template
- choose one clear focus placeholder for larger prompts
- keep technical placeholders hidden if the user should not edit them directly
- test the prompt for every enabled action, not only `Open`

## Common mistakes

- enabling the prompt for links without relevant placeholders
- exposing too many low-level technical placeholders to the user
- using free text where a controlled option list would be safer
- forgetting that prompt values are temporary and not persisted
- assuming prompt rules change the underlying saved placeholder definitions

## Relationships to other pages

- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)
- [Dialog: Expression Editor](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Expression-Editor)

## Technical
- Runtime modal container: `#interactiveLinkPromptModal`
- Link config field: `placeholderPrompt`
- Prompt rule builder: `buildInteractiveLinkPromptEffectiveRules(...)`
- Prompt rule applier: `applyInteractiveLinkPromptRules(...)`
