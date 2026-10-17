---
"@asyra/utils": minor
"@asyra/feature-system": minor
---

Centralize SessionCancelPolicies and derived cancellation policy/outcome types in
Utils. Import the pure contract directly from Utils instead of Feature System;
Feature System continues to own session interruption and transaction settlement.
Remove its previous policy type exports without compatibility aliases.
