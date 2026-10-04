---
---

Refactor the Starter App into explicit initialization, Feature/common API,
controller, UI-property/provider, view and render owners; synchronize the
standalone template and architecture guide. Remove UI-owned Redo counters and
message-based state decisions, and make App teardown await startup and share one
completion Promise across callers. Add permanent update-boundary and lifecycle
regressions. No Framework package or create-app CLI version is scheduled here;
create-app distribution retains its independent release owner.
