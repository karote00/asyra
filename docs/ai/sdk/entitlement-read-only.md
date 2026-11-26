# Read-only access after entitlement expiry

Status: agreed product requirement for commercial extensions, pending implementation.

A document remains usable when its owner's entitlement to edit a paid feature
expires. Keep the saved value, its rendered appearance, and the controls used
to inspect it. Treat the entitlement as an editing permission. The host's
`disabledFeatures` setting separately controls which features it offers.

## Acceptance example

1. While entitled, set a paid Position field to 7 and save the board.
2. Expire the entitlement with the board open. The field remains visible and
   reads 7. The object retains the appearance determined by that value.
3. Attempt to edit the field from the inspector, a shortcut, host UI, and a
   direct SDK call. Each applicable entry point enforces the same permission.
4. Edit a free field such as X, save, and reopen while the entitlement is
   expired. Both the new X and the original paid value remain visible.
5. Renew the entitlement while the board is open. The same control accepts
   edits immediately with the saved value as its starting point.
