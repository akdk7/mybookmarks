## Refactor Ideas

[ ] src/index_dev.html:13763 The monolithic i18n dictionary inflates the bundle and forces full reloads for language tweaks; moving each locale into a JSON/module and lazy-loading by common.language would trim parse time and let you ship partial updates.

- src/index_dev.html:15855 performNetworkRequest hardcodes error→message mappings; centralizing the code-to-translation lookup in MB.Network (or a small adapter table) would keep the component lean and ensure other callers reuse the same logic.
- Monitor whether other large concerns in the Vue instance (sharing, proxy, etc.) should follow the link shortener refactor into their own services for better separation of responsibilities.

- src/index_dev.html:15227 Watchers like 'editLink.url' and dragState still manipulate DOM/query selectors directly; replace those with reactive flags/computed classes and prune the debug logging to keep watchers cheap and SSR-friendly.


## Feature Services:

- Link Shortener Service (src/index_dev.html:15738 onwards) – Extract the whole block that manages linkShorteners (option prep, enable/disable, account management, adapter invocation at src/index_dev.html:16029) into a dedicated module that exposes a small API: getOptions, toggleService, ensureAccount, runAdapter. The Vue layer would then consume simple methods and react only to success/error events.

  - DONE

- Network/Proxy Adapter (src/index_dev.html:15830) – Bundle the proxy helpers (getProxyConfig, hasNetworkTransport, performNetworkRequest, error mapping) into a networkService. That service can take getTranslation as a dependency so the component no longer handles low-level errors and future consumers (background sync, sharing) reuse the same logic.

  - DONE

- Security Analysis Utility (src/index_dev.html:15876) – Move evaluateLinkSecurity, translateSecurityIssue, linkSecurityBadgeClass into a pure utility/service. Provide functions like analyze(url) and format(issue, translate) so you can test them independently and apply the same verdicts wherever links appear.

  - DONE

- Options Editing Manager (spread around src/index_dev.html:13900+ & watchers at src/index_dev.html:15227) – Create a feature service that encapsulates draft vs persisted options, debounced metadata fetching, and “search expands groups” logic. The component would just bind to reactive state exposed by this manager.

- Drag & Drop / UI State (src/index_dev.html:15262) – Move drag state handling, class toggling, and drop-zone diagnostics into a lightweight service/composable that exposes dragState, startDrag, endDrag. That keeps DOM access out of watchers and makes the behavior reusable.

- i18n Loader (src/index_dev.html:13763) – Replace the inlined dictionary with a locale service that lazy-loads JSON files and injects a t(key) helper into the component. That reduces the component size and prepares you for more locales.

  - DONE
