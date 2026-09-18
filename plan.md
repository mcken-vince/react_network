plan.md
```markdown
Phase 1 — finish the TS conversion (bulk, low-risk)
* Port atoms → common → dashboard/forms/layout/posts/profile → remaining .jsx routes, leaf-first. Type the variant maps as you go.
* Port utils/validation/* and dateUtils to TS; have them import @shared/limits. Then delete the utils/api.ts / utils/validation.js shims and flip allowJs: false.
* Consolidate the three not-found components into one; remove or gate test-error.


Phase 2 — close the feature gaps
* Wire createMessageNotification into messageService.sendMessage (small, unblocks an already-complete client path).
* Decide on likes/comments: either implement the full vertical slice (models, migration, routes, service, socket events, un-stub PostCard) or remove the premature types/UI and make the Post fields optional. This is the big one.
* Group membership management (rename / add / remove / leave) or an explicit descope decision.
* Switch UserSearchForm to the real /users/search endpoint; add pagination to NotificationsList.


Phase 3 — hardening
* Add a test runner + the core test suite listed in §7.
* Add the compiled server build and fix main; move the layout auth guard to beforeLoad.
* Collapse the conversation-list N+1.
```