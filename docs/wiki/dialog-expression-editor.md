# Dialog: Expression Editor

## Purpose
The Expression Editor provides a larger workspace for editing placeholder-based text and URL expressions.

## Where it appears
- Generic group and link edit dialogs via the `fx` button
- Reference-link alias editing via the `fx` button

## Main areas
1. Main editor field
- Large textarea for the current expression
- Updates the bound field live while the dialog is open
- Best for longer expressions that would be hard to edit in a compact inline input

Example:
- Instead of typing a long URL template into a one-line field, you can build and test it in a larger dedicated area.

2. Resolved preview
- Shows the currently resolved output
- Lists unresolved placeholders
- Lists missing placeholder values separately

Example:
- If an expression contains `{{ HOST }}` and `{{ PROJECT }}`, the preview shows the fully resolved final string as soon as values are available.
- If `PROJECT` is required but missing, the preview keeps that visible so you do not have to guess what failed.

3. Reference
- Shows syntax entries, snippets, and examples
- Lets the user inspect a selected item and insert it directly
- Includes rules and current parser limits

Example:
- You can click a snippet such as `??` or `startsWith` instead of typing the syntax manually.

4. Available placeholders
- Lists placeholders available in the current scope
- Shows type badges and whether a placeholder is optional
- Lets the user insert the token directly into the expression

Example:
- In a link dialog, the list may contain global placeholders plus group- and link-specific placeholders that can be inserted with one click.

5. Temporary test values
- Each available placeholder can receive a temporary test value
- Controls adapt to the placeholder type (`text`, `number`, `boolean`, `select`, `multiselect`)
- `Reset` clears a single temporary value
- `Reset all` clears all temporary values

Example:
- You can temporarily set `ENV = "prod"` or select test tags in a multi-select placeholder to verify the result without changing saved data.

## Placeholder basics

A placeholder inserts a stored value into an expression.

Basic syntax:
- `{{ PROJECT }}`
- `{{ HOST }}`
- `{{ ENV }}`

Typical use:
- URL template: `https://{{ HOST }}/{{ PROJECT }}/?env={{ ENV }}`
- Text label: `{{ PROJECT }} - {{ ENV }}`

Good example:
- If `HOST = "portal.example.com"` and `PROJECT = "alpha"`, then `https://{{ HOST }}/{{ PROJECT }}` becomes `https://portal.example.com/alpha`

## Supported expression concepts
- Placeholder tokens such as `{{ PROJECT }}`
- Comparisons for text, number, boolean, and placeholder-to-placeholder checks
- Logical operators such as `&&` and `||`
- Fallback operator `??`
- Presence checks such as `isMissing` and `isPresent`
- Collection/text helpers such as `hasAny`, `hasAll`, `startsWith`, `endsWith`, and `in`

## Built-in date/time functions
These are not placeholders. They are built-in functions and therefore do not collide with user-defined placeholder names.

Available functions:
- `today_iso()`
  Meaning: current local date in `YYYY-MM-DD`
  Example: `{{ today_iso() }}`
- `now_iso()`
  Meaning: current local date-time in ISO style
  Example: `{{ now_iso() }}`
- `now_timestamp()`
  Meaning: current Unix timestamp in seconds
  Example: `{{ now_timestamp() }}`
- `year()`
  Meaning: current year
  Example: `{{ year() }}`
- `month()`
  Meaning: current month as two digits
  Example: `{{ month() }}`
- `day()`
  Meaning: current day as two digits
  Example: `{{ day() }}`
- `weekday()`
  Meaning: current weekday number
  Example: `{{ weekday() }}`
- `time_hm()`
  Meaning: current time as `HH:mm`
  Example: `{{ time_hm() }}`
- `time_hms()`
  Meaning: current time as `HH:mm:ss`
  Example: `{{ time_hms() }}`
- `fdatetime("YYYY-MM-DD HH:mm:ss")`
  Meaning: format the current local date-time with tokens
  Example: `{{ fdatetime("YYYY-MM-DD") }}`

Supported `fdatetime(...)` tokens:
- `YYYY` year
- `MM` month
- `DD` day
- `HH` hour
- `mm` minute
- `ss` second
- `Z` timezone offset

Practical examples:
- File suffix: `backup-{{ today_iso() }}.json`
- Timestamped note: `Saved at {{ time_hms() }}`
- Full formatted value: `{{ fdatetime("YYYY-MM-DD HH:mm:ss Z") }}`

## Operators in detail

### Equality and inequality
- `==`
  Meaning: compare text, numbers, booleans, or one placeholder to another
  Example: `{{ MODE == "beta" ? "match" : "miss" }}`
- `!=`
  Meaning: inverse of equality
  Example: `{{ ENV != "prod" ? "warning" : "ok" }}`

When to use:
- Compare one exact value to another.
- Good for `select`, `text`, `number`, and `boolean` placeholders.

### Numeric comparisons
- `>`
- `>=`
- `<`
- `<=`

Meaning:
- Numeric comparison only. These operators are meant for number values.

Examples:
- `{{ COUNT > 10 ? "large" : "small" }}`
- `{{ LIMIT <= 0 ? "invalid" : "ok" }}`

### Fallback operator
- `??`

Meaning:
- Use the right side if the left side is missing or empty.
- Values such as `0` and `false` are kept and do not trigger the fallback.

Examples:
- `{{ TITLE ?? "Untitled" }}`
- `{{ HOST ?? "localhost" }}`

### Logical operators
- `&&`
  Meaning: both conditions must be true
  Example: `{{ MODE == "beta" && ENABLED == true ? "run" : "skip" }}`
- `||`
  Meaning: at least one condition must be true
  Example: `{{ ENV == "dev" || ENV == "test" ? "nonprod" : "prod" }}`

### Parentheses
- `( ... )`

Meaning:
- Group logic to make the evaluation order clear.

Example:
- `{{ (MODE == "beta" || MODE == "alpha") && ENABLED == true ? "run" : "skip" }}`

### Text and collection helpers
- `has`
  Meaning: check whether a text or multi-select value contains one value
  Example: `{{ TAGS has "Select1" ? "match" : "miss" }}`
- `in`
  Meaning: check whether the left value is included in a candidate list
  Example: `{{ MODE in "alpha|beta|gamma" ? "ok" : "miss" }}`
- `startsWith`
  Meaning: prefix check for text
  Example: `{{ TITLE startsWith "Doc" ? "prefix" : "miss" }}`
- `endsWith`
  Meaning: suffix check for text
  Example: `{{ FILE endsWith ".pdf" ? "pdf" : "other" }}`
- `hasAny`
  Meaning: match when at least one value is present
  Example: `{{ TAGS hasAny "alpha|beta" ? "match" : "miss" }}`
- `hasAll`
  Meaning: match only when every listed value is present
  Example: `{{ TAGS hasAll "alpha|beta" ? "full" : "partial" }}`

### Presence checks
- `isEmpty`
  Meaning: value exists but is empty
  Example: `{{ TITLE isEmpty ? "empty" : "filled" }}`
- `isNotEmpty`
  Meaning: value is not empty
  Example: `{{ HOST isNotEmpty ? "configured" : "missing" }}`
- `isMissing`
  Meaning: required value is unresolved or missing
  Example: `{{ REQUIRED_FIELD isMissing ? "missing" : "available" }}`
- `isPresent`
  Meaning: value exists and is not missing
  Example: `{{ OPTIONAL_FIELD isPresent ? "present" : "missing" }}`

### Ternary operator
- `condition ? value_if_true : value_if_false`

Meaning:
- Build conditional output directly inside one expression.

Examples:
- `{{ ENABLED == true ? "on" : "off" }}`
- `{{ COUNT > 0 ? "items found" : "no items" }}`

## Snippets in the Expression Editor

Snippets are ready-made inserts shown in the Reference panel of the Expression Editor. They save typing and show the correct syntax.

Typical snippet groups:
- Date/time snippets
  Examples: `today_iso()`, `now_iso()`, `time_hm()`, `time_hms()`, `now_timestamp()`, `fdatetime("YYYY-MM-DD")`
- Fallback and logic snippets
  Examples: `??`, `&&`, `||`, `( ... )`
- Comparison snippets
  Examples: `==`, `!=`, `>`, `>=`, `<`, `<=`
- Text and collection snippets
  Examples: `has`, `in`, `startsWith`, `endsWith`, `hasAny`, `hasAll`
- Presence snippets
  Examples: `isEmpty`, `isNotEmpty`, `isMissing`, `isPresent`

What snippets are good for:
- They prevent small syntax mistakes.
- They act as mini-reminders for the available language features.
- They are especially useful when building longer expressions from small verified pieces.

## Complete example recipes

### 1) Default title if a placeholder is empty
Expression:
```text
{{ TITLE ?? "Untitled" }}
```

Meaning:
- Use the placeholder value if available.
- Otherwise show `Untitled`.

### 2) Show a formatted timestamp
Expression:
```text
{{ fdatetime("YYYY-MM-DD HH:mm:ss") }}
```

Meaning:
- Inserts the current local date and time in a human-readable format.

### 3) Check a select-like value against an allowed list
Expression:
```text
{{ MODE in "alpha|beta|gamma" ? "ok" : "miss" }}
```

Meaning:
- Good for text or select placeholders where only specific values are valid.

### 4) Check multi-select overlap
Expression:
```text
{{ TAGS hasAny "alpha|beta" ? "match" : "miss" }}
```

Meaning:
- Returns `match` when at least one of the listed values is selected.

### 5) Check that every required tag exists
Expression:
```text
{{ TAGS hasAll "alpha|beta" ? "full" : "partial" }}
```

Meaning:
- Useful when a multi-select placeholder represents capabilities, roles, or states.

### 6) Distinguish missing from present
Expression:
```text
{{ REQUIRED_FIELD isMissing ? "missing" : "available" }}
```

Meaning:
- Useful for required placeholders that must be filled before a link action continues.

### 7) Combine multiple conditions
Expression:
```text
{{ (MODE == "beta" || MODE == "alpha") && ENABLED == true ? "run" : "skip" }}
```

Meaning:
- Parentheses keep the logic readable.
- The expression only returns `run` when the mode is `beta` or `alpha` and the feature is enabled.

### 8) Use placeholders and functions together
Expression:
```text
{{ PROJECT ?? "default" }}-{{ today_iso() }}-{{ time_hm() }}
```

Meaning:
- Combines stored project data with built-in time helpers.
- Useful for labels, export names, generated references, or temporary notes.

## Important limits and rules

Keep these parser rules in mind:
- Use `==` and `!=` for text, number, boolean, or placeholder-to-placeholder comparisons.
- Use `>`, `>=`, `<`, and `<=` only for numeric values.
- Use `has` for text or multi-select values. Equality checks on multi-select placeholders are not supported.
- Use `in` with text, number, or boolean values on the left side.
- Use `startsWith` and `endsWith` only with text values.
- Use `hasAny` and `hasAll` with text or multi-select values.
- `??` only falls back for missing or empty values. It does not replace `0` or `false`.
- String literals must use double quotes.
- Nested ternary conditions are not supported.

## Important behavior
- `Cancel` restores the original field value from before the dialog opened
- `Apply` keeps the current expression value
- Temporary test values affect only preview/evaluation inside the editor and do not overwrite stored placeholder data
- Built-in date/time helpers use function syntax, so they no longer collide with placeholder names

## Important relationships
- Uses the same placeholder hierarchy as group/link/reference editing
- Works together with global placeholders and URL placeholder resolution
- Helps verify expressions before they are used in links, group titles, or reference texts

## Related pages
- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)
- [Feature: Placeholder Rules](https://github.com/akdk7/mybookmarks/wiki/Feature:-Placeholder-Rules)
- [Dialog: Link Placeholder Prompt](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Link-Placeholder-Prompt)

## Technical
- Openers: `openGenericExpressionEditor()`, `openReferenceAliasExpressionEditor()`
- Actions: `applyExpressionEditor()`, `cancelExpressionEditor()`
- Container: `#expressionEditorDialog`
