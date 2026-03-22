# Feature: Placeholder Rules

## Purpose

Placeholder rules control the behavior of interactive placeholder prompts.

They do not directly replace placeholder values and they do not directly rewrite URLs on their own.
Instead, they influence how prompt fields behave before a link action is executed.

Typical rule outcomes:
- show or hide a field
- make a field required or optional
- replace the available options of a `select` or `multiselect`
- reset a field value when upstream inputs change

This makes rules useful for building guided forms on top of bookmark links.

## Where rules can be configured

Rules are available wherever placeholder editing is available:
- global placeholders
- group placeholder editors
- direct link placeholder editors
- reference-link placeholder editors

In practice, that means you can define behavior at several inheritance layers and combine them.

## Mental model

Think of a rule as:
```text
If these conditions match,
then change how another placeholder field behaves.
```

Example:
```text
If COUNTRY == "DE",
then CITY options become:
Berlin
Hamburg
Munich
```

## What rules are for

Rules are ideal when:
- a second field depends on an earlier field
- only some inputs should be required in specific cases
- available options should change dynamically
- an old value should be cleared when an upstream selection changes

Rules are not ideal when:
- you simply need a static default value
- you want to compute text output directly
- you want template logic in labels or URLs

For computed text and URLs, use the Expression Editor:
- [Dialog: Expression Editor](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Expression-Editor)

## Inheritance layers

### Direct links
Effective rule layers for a normal link:
1. global rules
2. group rules
3. link-local rules

### Reference links
Effective rule layers for a reference link:
1. global rules
2. reference-link group rules
3. source-link rules
4. reference-link local rules

This matches the placeholder layer model, but for rules the important point is:
- later layers can add behavior specific to narrower scopes
- inherited rules can be disabled locally
- inherited rules can be overridden locally

## Rule anatomy

Each rule consists of:
- a `target`
- an `effect`
- a `match` mode
- one or more `conditions`
- an effect-specific `payload`

### `target`
The placeholder field that will be changed by the rule.

Example:
```text
CITY
```

This means the rule changes the `CITY` field, not the condition fields.

### `effect`
Supported effects:
- `visibility`
- `required`
- `options`
- `reset`

### `match`
Controls how multiple conditions are combined:
- `all`
  Every condition must match.
- `any`
  At least one condition must match.

### `conditions`
Each condition references another field-like input and compares it with an operator.

A condition contains:
- `field`
- `op`
- optionally `value`

Current behavior:

- the `target` is always a real placeholder field
- condition fields are usually earlier placeholders
- in link-local rule editors, condition fields can also be runtime workflow vars declared by the link's Prompt Flow

## Workflow vars as condition fields

Link-local placeholder rules can now read Prompt Flow workflow vars without turning them into saved placeholders.

Important scope rule:

- this applies only to link-local rules
- global, group, and reference-link rule editors still work with placeholder fields only

Why this is limited to link-local rules:

- workflow vars are declared by the current link's Prompt Flow
- broader scopes do not have a stable local flow context

Practical meaning:

- an earlier `Assign` step can derive a runtime-only value
- a later link-local rule can use that value in its conditions
- the rule can still only change a real placeholder target

Example:

```text
Assign step writes: WF_MODE=MODE
Rule target: DETAIL
Condition field: WF_MODE
Effect: visibility
```

This is useful when:

- one runtime-only intermediate value should drive later prompt behavior
- you do not want to create a saved helper placeholder just for that logic

### `payload`
The result data for the selected effect.

Examples:
- `visibility` uses `booleanValue`
- `required` uses `booleanValue`
- `options` uses `optionsText`
- `reset` uses `resetMode`

## Supported effects in detail

### 1) `visibility`
Changes whether the target field is visible in the prompt.

Example:
```text
Target: ADVANCED_TOKEN
Effect: visibility
Condition: MODE == "advanced"
Result: visible = true
```

Interpretation:
- show `ADVANCED_TOKEN` only when `MODE` is `advanced`

### 2) `required`
Changes whether the target field must be filled in.

Example:
```text
Target: CITY
Effect: required
Condition: COUNTRY == "DE"
Result: required = true
```

Interpretation:
- `CITY` is required only if `COUNTRY` is `DE`

### 3) `options`
Replaces the available options of a selection field.

Example:
```text
Target: CITY
Effect: options
Condition: COUNTRY == "US"
Result options:
New York
San Francisco
Chicago
```

Interpretation:
- the city field becomes a narrowed option list for the selected country

### 4) `reset`
Clears the target value when the rule matches.

Example:
```text
Target: CITY
Effect: reset
Condition: COUNTRY notEquals "DE"
Result: clear
```

Interpretation:
- if the country changes away from `DE`, a stale city selection is removed

## Supported condition operators

### `equals`
Exact match.

Examples:
```text
COUNTRY equals "DE"
MODE equals "beta"
ENABLED equals "true"
```

### `notEquals`
Inverse of `equals`.

Example:
```text
ENV notEquals "prod"
```

### `isEmpty`
Matches when the referenced field has no value.

Example:
```text
CITY isEmpty
```

### `notEmpty`
Matches when the referenced field has a value.

Example:
```text
TOKEN notEmpty
```

### `contains`
Checks whether a text or multiselect value contains the comparison value.

Examples:
```text
FLAGS contains "beta"
TAGS contains "prod"
```

### `notContains`
Inverse of `contains`.

Example:
```text
FLAGS notContains "legacy"
```

## Effect order and dependency order

Rules are evaluated top-down across inheritance layers.
For the same field effect, later matching rules win.

Practical meaning:
- a link-local rule can refine or replace a broader group rule
- a reference-link local rule can refine the source-link behavior

Prompt rows are also dependency-aware:
- fields that other rules depend on are kept earlier
- dependent fields are sorted later when possible

This helps the prompt behave like a guided form instead of a flat field list.

## Inherited rules, local overrides, and disable states

The rule editor distinguishes between:
- local rules
- inherited active rules
- inherited rules disabled in the current scope

### Disable locally
You can disable an inherited rule in a narrower scope without deleting it from its source layer.

Example:
- group rule makes `CITY` required for `COUNTRY = DE`
- one special link should not force `CITY`
- disable that inherited rule on the link

### Override locally
Instead of only disabling a rule, you can create a local override.

Example:
- group rule narrows `CITY` options for `COUNTRY = DE`
- one link needs a smaller list
- create a local override on the link and replace the options

### Restore inherited
If an inherited rule was disabled or overridden locally, you can restore the inherited behavior.

## Validation rules

The rule system validates both structure and dependencies.

Important validation types:
- `targetMissing`
  The target placeholder is not available in the current scope.
- `conditionsMissing`
  A rule has no conditions.
- `fieldMissing`
  A condition references a placeholder or workflow variable that is not available in the current scope.
- `selfReference`
  A rule cannot depend on the same placeholder it changes.
- `backwardDependency`
  Conditions may only reference placeholders that appear earlier in the prompt form.
  Workflow vars are excluded from this ordering rule.
- `valueMissing`
  The selected operator requires a comparison value, but none is present.
- `optionsMissing`
  An `options` rule has no replacement options.
- `cycle`
  The effective placeholder dependency graph contains a loop.

## Why backward dependencies matter

Rules should guide the prompt from earlier decisions to later decisions.

Good example:
```text
COUNTRY -> CITY
```

Bad example:
```text
CITY -> COUNTRY
```

The second case is confusing because the user would need to choose a downstream field before the upstream field that controls it.

## Runtime behavior

Rules are primarily relevant when the interactive placeholder prompt opens.

At runtime, the app:
1. builds the effective placeholder layer set
2. builds the effective rule layer set
3. validates the effective rule graph
4. filters rules down to the prompt fields actually used in the current template
5. applies the remaining valid rules in dependency order

For link-local Prompt Flow runs this also means:

- declared workflow vars are treated as valid condition inputs
- rules are re-evaluated when an earlier assign step changes one of those workflow vars

Practical consequence:
- if a field is hidden, it disappears from the current prompt
- if a field becomes required, the prompt blocks execution until it is filled
- if the available options change, the field switches to the new option list
- if a reset rule matches, stale values are cleared

## Important limitation

Rules affect prompt field behavior, not template syntax itself.

They do not:
- create new placeholders
- rewrite the URL template string
- replace Expression Editor logic
- force static values into a field outside the prompt

## Detailed examples

### Example 1: country controls city options

Placeholders:
```text
COUNTRY (select): DE, US
CITY (select): Berlin, Hamburg, New York, San Francisco
```

Rule A:
```text
Target: CITY
Effect: options
Match: all
Condition: COUNTRY equals "DE"
Options:
Berlin
Hamburg
Munich
```

Rule B:
```text
Target: CITY
Effect: options
Match: all
Condition: COUNTRY equals "US"
Options:
New York
San Francisco
Chicago
```

Prompt behavior:
- choose `DE` -> city options become German cities
- choose `US` -> city options become US cities

### Example 2: optional advanced token

Placeholders:
```text
MODE (select): basic, advanced
ADVANCED_TOKEN (text)
```

Rule:
```text
Target: ADVANCED_TOKEN
Effect: visibility
Condition: MODE equals "advanced"
Result: visible = true
```

Interpretation:
- in `basic` mode the advanced token is hidden
- in `advanced` mode the field appears

### Example 3: required only in one branch

Placeholders:
```text
DEPLOY_TARGET (select): staging, production
APPROVAL_CODE (text)
```

Rule:
```text
Target: APPROVAL_CODE
Effect: required
Condition: DEPLOY_TARGET equals "production"
Result: required = true
```

Interpretation:
- approval code is mandatory only for production deployments

### Example 4: reset stale child value

Placeholders:
```text
COUNTRY (select): DE, US
CITY (select)
```

Rule:
```text
Target: CITY
Effect: reset
Condition: COUNTRY notEmpty
Result: clear
```

Interpretation:
- whenever the country selection changes to another valid value, the city can be cleared so the user does not keep an outdated city from a different country branch

### Example 5: group default with link-specific override

Group rule:
```text
Target: CITY
Effect: options
Condition: COUNTRY equals "DE"
Options:
Berlin
Hamburg
Munich
```

Link-local override:
```text
Target: CITY
Effect: options
Condition: COUNTRY equals "DE"
Options:
Berlin
Hamburg
```

Interpretation:
- most links in the group get the full German city set
- one link narrows the options even further

### Example 6: reference-link refinement

Source-link rule:
```text
Target: LANG
Effect: required
Condition: COUNTRY equals "DE"
Result: required = true
```

Reference-link local rule:
```text
Target: LANG
Effect: visibility
Condition: COUNTRY equals "DE"
Result: visible = true
```

Interpretation:
- the source link defines the general business logic
- the reference link can refine how that field is exposed in its own context

### Example 7: workflow var controls a later prompt field

Prompt Flow:

1. prompt step collects `MODE`
2. assign step writes:
   ```text
   WF_MODE=MODE
   ```
3. later prompt step contains `DETAIL`

Link-local rule:

```text
Target: DETAIL
Effect: visibility
Condition: WF_MODE equals "advanced"
Result: visible = true
```

Interpretation:

- the flow derives one runtime-only flag
- the rule reads that workflow var
- the later prompt field reacts without introducing another saved placeholder

## Troubleshooting

### A rule does not show any effect
Check:
- is the link action configured to open the interactive placeholder prompt?
- is the target placeholder visible in the current prompt?
- do the conditions reference placeholders or workflow vars that are actually available in the current scope?
- is the rule disabled locally?

### The wrong options appear
Check:
- whether a later inherited or local rule overrides an earlier one
- whether multiple `options` rules target the same field
- whether the current condition branch really matches

### A field stays hidden or optional unexpectedly
Check:
- later layers may win for the same effect
- a reset/visibility/required combination may interact across inheritance layers

### Validation blocks saving
Typical causes:
- target field no longer exists
- condition references a missing placeholder or workflow var
- self-reference
- backward dependency
- cycle in the effective graph

## Best practices

- Put generic business rules into global scope only if they truly apply broadly.
- Put customer-, team-, or region-specific rules into group scope.
- Put exceptional one-off behavior into link or reference-link scope.
- Prefer narrow, clear dependencies such as `COUNTRY -> CITY` over large cross-field webs.
- Keep rule chains shallow to avoid cycles and confusing prompt behavior.
- Use `reset` when downstream selections become invalid after an upstream change.
- Prefer `select` and `multiselect` placeholders for rule-driven branching instead of free-form text.

## Relationships to other pages

- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)
- [Dialog: Expression Editor](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Expression-Editor)

## Technical
- Global rule storage: `data.options.links.globalPlaceholderRules`
- Group rule storage: `group.urlPlaceholderRules`
- Link rule storage: `link.urlPlaceholderRules`
- Rule merger: `buildEffectivePlaceholderPromptRuleEntries(...)`
- Rule validator: `validatePlaceholderPromptRules(...)`
- Effective prompt rule builder: `buildInteractiveLinkPromptEffectiveRules(...)`
