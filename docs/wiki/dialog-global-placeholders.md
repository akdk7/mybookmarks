# Dialog: Global Placeholders

## Purpose
The Global Placeholders dialog is the central entry point for managing reusable placeholder defaults across the app.

Global placeholders are the lowest shared layer in the placeholder system. They can be inherited and overridden by:
- groups
- direct links
- reference links
- runtime prompt values during a one-off execution

This makes the dialog more than a simple key-value list. It is the base registry for placeholder-driven URLs, labels, notes, expressions, and interactive placeholder prompts.

## Mental model

Think of a placeholder as a named input slot that can be reused in multiple places.

Example token:
```text
{{ PROJECT }}
```

If `PROJECT = alpha`, then:
```text
https://portal.example.com/{{ PROJECT }}
```
resolves to:
```text
https://portal.example.com/alpha
```

Global placeholders are especially useful when:
- the same value is used in many groups or links
- a value should have one default but still allow local overrides
- the same placeholder name should be available throughout the bookmark set

## Where placeholders can be used

Placeholders are not limited to one field type.

Typical locations:
- link URLs
- link text
- note text
- group names
- group info HTML
- reference-link alias text
- expression editor templates
- interactive placeholder prompts

Example:
```text
Link text: {{ PROJECT }} dashboard
URL: https://{{ HOST }}/{{ PROJECT }}/dashboard?env={{ ENV }}
Group name: {{ CUSTOMER }} / {{ REGION }}
```

## Inheritance and priority

### Direct links
For a normal link, the effective placeholder value is resolved in this order:
1. global placeholder
2. group placeholder
3. link placeholder
4. temporary runtime prompt value for the current action only

### Reference links
Reference links have one more layer because they inherit from the referenced source link:
1. global placeholder
2. reference-link group placeholder
3. source-link placeholder
4. reference-link local placeholder
5. temporary runtime prompt value for the current action only

Important behavior:
- later layers override earlier layers
- empty values do not replace an earlier non-empty value during URL resolution
- type/schema settings on inherited placeholders are preserved when the placeholder comes from an earlier layer

## What the dialog manages

The dialog has two major areas:
- `Values`
  Used to define placeholder rows, types, defaults, and field behavior.
- `Rules`
  Used to configure rule-based runtime behavior for interactive placeholder prompts.

The rules area is covered in detail here:
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)

## Placeholder row fields

Each row describes one placeholder definition.

### `Name`
The symbolic placeholder name without curly braces.

Example:
```text
PROJECT
```

Used as:
```text
{{ PROJECT }}
```

Good naming patterns:
- `PROJECT`
- `CUSTOMER_ID`
- `REGION`
- `ENV`

Avoid:
- ambiguous names such as `VALUE`
- names that mean different things in different scopes

### `Value`
The stored default value for the placeholder.

Examples:
- `alpha`
- `portal.example.com`
- `de`
- `42`

The editor adapts to the selected type:
- free text input for `text` and `number`
- dropdown for `boolean`
- single-select dropdown for `select`
- multi-select list for `multiselect`

### `Type`
Determines how the placeholder behaves in editors, prompts, and rule comparisons.

Supported types:
- `text`
- `number`
- `boolean`
- `select`
- `multiselect`

### `Encode`
If enabled, the placeholder value is URL-encoded when used in URL resolution.

Example:
- placeholder: `TERM = "hello world"`
- URL: `https://example.com/search?q={{ TERM }}`

With `Encode = on`:
```text
https://example.com/search?q=hello%20world
```

With `Encode = off`:
```text
https://example.com/search?q=hello world
```

Typical use:
- turn it on for query parameters or path segments that may contain spaces or special characters
- turn it off when the value is already encoded or when plain text is intended

### `Optional`
Controls whether an empty value should be treated as allowed or as missing.

Meaning:
- required placeholder: missing value is treated as a missing input
- optional placeholder: missing value is allowed

This matters for:
- URL resolution feedback
- prompt validation
- expression previews

### `Visible in Prompt`
Controls whether the placeholder can appear in the interactive placeholder prompt when the link action is configured to ask for values.

Typical use:
- hide technical placeholders that should stay internal
- show user-facing placeholders that must be chosen at execution time

## Supported placeholder types in detail

### `text`
Best for free-form strings.

Examples:
- `PROJECT = alpha`
- `HOST = portal.example.com`
- `TERM = release notes`

### `number`
Best for numeric comparisons in expressions and rules.

Examples:
- `YEAR = 2026`
- `LIMIT = 50`

Useful when:
- expressions compare values with `>`, `>=`, `<`, `<=`
- the prompt should present a numeric field instead of a plain text field

### `boolean`
Best for yes/no or on/off decisions.

Examples:
- `OPEN_IN_BETA = true`
- `INCLUDE_ARCHIVE = false`

Useful when:
- prompt behavior depends on a checkbox-like choice
- rules show or hide other inputs depending on a toggle

### `select`
Best for one value from a fixed list.

Examples:
- `REGION` with options:
  ```text
  eu
  us
  apac
  ```
- `ENV` with options:
  ```text
  dev
  test
  prod
  ```

### `multiselect`
Best for a list of multiple selected values.

Examples:
- `FLAGS` with options:
  ```text
  a
  b
  c
  ```
- chosen values:
  ```text
  a,b
  ```

Separator behavior:
- multiselect values are joined with the configured separator
- default separator is `,`
- the separator can be customized

Example:
- selected values: `red`, `green`
- separator: `|`
- resolved value:
  ```text
  red|green
  ```

## Extra row controls

### Copy token button
Copies the placeholder token, for example:
```text
{{ PROJECT }}
```

Typical use:
- quickly insert the token into a URL field, group title, note, or expression

### Usage button
Shows where the placeholder is used.

This is useful before:
- renaming a placeholder
- changing its type
- deleting it
- moving it into a different scope

Typical usage results:
- group names
- link text
- URLs
- note content
- reference-link alias text

### Row action split button
Each placeholder row has a split action control:
- primary action: delete
- attached menu action: scope transfer

Depending on the current scope, the menu can:
- copy a placeholder to a group
- move a placeholder to a group
- copy a placeholder to a link
- move a placeholder to a link
- copy a placeholder to a reference link
- move a placeholder to a reference link

This is useful when a placeholder started as global but later turns out to belong more naturally to:
- one customer group
- one specific link
- one specific reference link

Example workflow:
1. Start with global `TERM = release`.
2. Later only one group still needs it.
3. Move it from global to that group.
4. Links in that group still resolve correctly through inheritance.

## Rule-aware behavior

The Global Placeholders dialog is also the entry point for global placeholder rules.

Rules do not directly change the final URL on their own.
They control prompt behavior such as:
- whether a field is visible
- whether a field is required
- which options are available
- whether a field should be reset

Example:
- `COUNTRY = DE`
- rule target: `CITY`
- effect: `options`
- condition: `COUNTRY == "DE"`
- result options:
  ```text
  Berlin
  Hamburg
  Munich
  ```

This means the `CITY` prompt can adapt dynamically when `COUNTRY` changes.

Detailed rule authoring is documented here:
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)

## Save flow

The dialog edits a working copy of the global placeholder rows and rules.

On save:
1. rows are normalized
2. rule field rows are rebuilt from the current placeholder set
3. rules are validated against the available placeholders
4. normalized data is persisted into app settings

Practical effect:
- global placeholder edits immediately affect inherited placeholder resolution throughout the app
- the next time a group, link, or reference link resolves placeholders, it sees the new global base layer

## Detailed examples

### Example 1: environment-aware host

Global placeholders:
```text
HOST = portal.example.com
ENV = prod
```

Link:
```text
https://{{ HOST }}/app?env={{ ENV }}
```

Resolved URL:
```text
https://portal.example.com/app?env=prod
```

### Example 2: group override

Global:
```text
REGION = eu
```

Group override:
```text
REGION = us
```

Link in that group:
```text
https://api.example.com/{{ REGION }}/status
```

Resolved URL in the group:
```text
https://api.example.com/us/status
```

Resolved URL in another group without override:
```text
https://api.example.com/eu/status
```

### Example 3: link-local specialization

Global:
```text
PROJECT = alpha
```

Group:
```text
PROJECT = beta
```

Specific link:
```text
PROJECT = gamma
```

Link URL:
```text
https://portal.example.com/{{ PROJECT }}
```

Final result:
```text
https://portal.example.com/gamma
```

### Example 4: encoded search term

Global:
```text
TERM = release notes
Encode = on
```

URL:
```text
https://example.com/search?q={{ TERM }}
```

Result:
```text
https://example.com/search?q=release%20notes
```

### Example 5: reusable select prompt

Global placeholders:
```text
COUNTRY = DE
CITY = Berlin
```

`COUNTRY` type:
```text
select
```

Options:
```text
DE
US
```

`CITY` type:
```text
select
```

Options:
```text
Berlin
Hamburg
New York
San Francisco
```

Now the same two placeholders can be reused in many links, while prompt rules narrow the available cities depending on the country.

## Best practices

- Keep global placeholders generic and reusable.
- Use groups for customer-, team-, or region-specific overrides.
- Use link-local placeholders only when the value truly belongs to one link.
- Prefer stable names such as `ENV`, `REGION`, `PROJECT`, `TENANT`, `CUSTOMER_ID`.
- Use the usage popover before renaming or deleting a placeholder.
- Use typed placeholders instead of free-form text whenever the value should come from a controlled list.
- Keep global rules generic; push special cases down to group or link scope.

## Common mistakes

- Creating too many nearly identical global placeholders instead of using scoped overrides
- Using text placeholders where `select` or `boolean` would make the prompt safer
- Forgetting URL encoding for search queries or path values with spaces
- Reusing the same placeholder name for different meanings in different scopes
- Moving placeholders to a narrower scope without checking where else they are still used

## Relationships to other features

- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)
- [Dialog: Expression Editor](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Expression-Editor)
- [Dialog: Link Templates](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Templates)

## Technical
- Dialog container: `#globalPlaceholdersModal`
- Main open handler: `openGlobalPlaceholderDialog()`
- Save persistence path: `persistGlobalPlaceholderRows()`
- Global placeholder storage: `data.options.links.globalPlaceholders`
- Global rule storage: `data.options.links.globalPlaceholderRules`
