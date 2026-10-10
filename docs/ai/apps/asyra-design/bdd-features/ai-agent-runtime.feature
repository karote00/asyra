Feature: Optional AI agent runtime
  As a Asyra Design user
  I want natural-language actions to follow ordinary app and framework boundaries
  So that AI planning cannot bypass validation, permission, undo, collaboration, or cleanup

  Background:
    Given Asyra Design owns the AI Feature lifecycle
    And the app owns context, actions, schemas, permission, confirmation, and transaction adapters
    And deterministic providers require no live API key

  Scenario: AI-disabled startup has zero AI side effects
    Given AI activation is disabled
    When Asyra Design starts
    Then no AI runtime or provider is constructed
    And no AI Feature, network request, secret read, listener, or timer is created

  Scenario: Provider-disabled invocation fails before planning
    Given AI activation is enabled
    And the provider composition is disabled
    When the AI Feature receives natural-language intent
    Then the Feature returns an unavailable result
    And context collection and provider transport are not invoked
    And canonical state is unchanged

  Scenario: Action registration is deterministic and duplicate-safe
    Given the app registers two schema-backed actions in order
    When the runtime lists provider-safe action descriptions
    Then the descriptions preserve successful registration order
    And registering a duplicate name fails without replacing the original action

  Scenario: Unknown or schema-invalid action rejects the complete plan
    Given the provider returns a multi-action candidate plan
    And one action is unknown or has invalid arguments
    When the runtime validates the complete plan
    Then the complete plan is rejected before permission or confirmation
    And no action executor or transaction runner is invoked
    And no valid canonical prefix is applied

  Scenario: Permission denial rejects the complete plan
    Given every candidate action is registered and schema-valid
    And the app permission policy denies one action
    When the runtime completes permission preflight
    Then the complete plan is denied before confirmation or transaction execution
    And canonical state is unchanged

  Scenario: App editing operations execute without approval
    Given the user requests drawing or editing through registered App actions
    When the plan deletes, replaces, or adjusts existing elements and their properties
    Then no Approve interaction is required
    And schema validation and canonical locks still apply
    And successful changes retain their ordinary Undo boundary

  Scenario: External-tool or security permission is requested in conversation
    Given an external-tool operation or security concern needs user permission
    And the user has not already authorized it
    When the model follows the App prompt
    Then it asks through request_clarification and waits for the answer
    And it does not treat internal editing actions as permission requests
    And host and external-service security enforcement remains authoritative

  Scenario: Valid multi-action plan creates one undo commit
    Given a complete plan has several registered schema-valid allowed actions
    And any required confirmation is accepted
    When the app transaction runner executes the plan
    Then every app action executor runs in plan order
    And the executors mutate only through app common or public APIs
    And the accepted plan creates one intended undo commit

  Scenario: Recoverable item failure may commit a partial app result
    Given a confirmed plan is executing inside one transaction
    And one app executor classifies an item failure as recoverable before a fatal canonical write
    When the executor resolves with partial evidence
    Then successful sibling mutations may commit in the same intended undo entry
    And the runtime reports the detached partial result without item compensation

  Scenario: Fatal executor failure rolls back without a canonical prefix
    Given a confirmed plan is executing inside one transaction
    And a later app action executor rejects because canonical consistency cannot be guaranteed
    When the transaction runner settles
    Then every rollbackable write from the plan is reversed
    And no normal undo commit or accepted canonical prefix remains

  Scenario: Provider failure retry is bounded and transaction-safe
    Given the provider fails with a retryable redacted error
    And the runtime retry policy allows one additional attempt
    When planning is retried
    Then only provider planning is repeated
    And no transaction or action executor is repeated
    And an exhausted failure returns a stable redacted result

  Scenario: Abort timeout and disposal clean request resources
    Given provider planning or action orchestration is in flight
    When the Feature aborts, the provider times out, or the runtime is disposed
    Then request-owned timers, listeners, retry state, and intermediate values are released
    And no later post-abort mutation is applied
    And Feature System remains the sole lifecycle owner

  Scenario: Secret values are redacted from failures and audit output
    Given provider input or failures contain authorization, token, API key, or configured secret fields
    When the runtime returns preview, audit, explanation, or failure output
    Then secret values are recursively redacted
    And raw provider bodies and credentials are not returned
    And the detached output cannot mutate canonical state

  Scenario: Runtime instances remain isolated
    Given two app-owned AI runtime instances
    When each instance registers actions and performs planning
    Then registry, provider, policy, abort, timeout, retry, audit, and disposal state do not cross instances

  Scenario: Collaboration uses the ordinary canonical publication route
    Given Asyra Design already enabled Collaboration
    And an accepted app action uses its ordinary shared mutation options
    When the AI plan transaction commits
    Then Factory emits the ordinary shared publication
    And Collaboration uses the unchanged transport-only route
    And AI runtime owns no dedupe, permission, conflict, or reconnect policy

  Scenario: Generic HTTP and fake providers are replaceable
    Given the runtime uses the public provider contract
    When the app selects a deterministic fake provider or generic HTTP provider
    Then registry, preflight, transaction, action, and result contracts are unchanged
    And formal tests require no live endpoint or API key

  Scenario: Local edits select current regional candidates
    Given a large editable document with nested transformed containers
    When AI queries a workspace region and filters by type, ancestor and lock
    Then only matching current candidate identities are returned
    And repeated queries reuse unchanged spatial extents
    And pan or zoom does not rebuild document extents
    And a canonical edit, Undo or Redo updates the affected query results

  Scenario: Relative placement does not transfer the parent's child list
    Given known target identities and a separate current anchor
    When AI moves the targets before or after the anchor
    Then the hierarchy owner resolves the current insertion index
    And ordinary Group geometry normalization and Undo remain in effect

  Scenario: Repair a rejected draft without retransmitting unchanged source
    Given a request-local draft rejected for duplicate construction keys
    When AI supplies replacement values at the reported conflict paths
    Then the same preparation owner validates and compiles the repaired source
    And only successful preparation can proceed to apply
    And missing or expired references return a recoverable failure

  Scenario: Delete a requested forest in one canonical owner preparation
    Given multiple selected elements include nested containers and shared properties
    When the agent submits one plural deletion
    Then Scene and Props prepare the combined removal once before writing
    And shared properties used by surviving elements remain active
    And Undo restores the exact hierarchy and property values

  Scenario: Correct all matching elements within a region without metadata pages
    Given an explicit workspace region and a registered plural edit
    When the agent submits the region as the batch target query
    Then the backend resolves the complete identity set before writing
    And incomplete or cancelled query results do not dispatch a mutation
    And compact structural receipts omit canonical history snapshots

  Scenario: Preserve failed review findings for a targeted correction
    Given review finds unresolved requested criteria
    When the review response is returned
    Then complete findings and known target scope are available for correction
    And changed drawing data requires fresh evidence before completion

  Scenario: Recover only the missing tool definition scope
    Given the agent retained a tool definition but lost one field description
    When it follows the scoped recovery route with a declared delivery failure
    Then only that requested scope and its local dependencies are returned
    And the full schema remains available through an explicit full recovery
    And canonical action validation retains all required constraints

  Scenario: Recover an original reference with diagnostic bounded attempts
    Given a public reference read has a transient transport failure
    When the acquisition owner retries within the original deadline
    Then it performs at most one additional attempt
    And permanent errors and cancellation do not retry
    And the failed source retains its stage, reason, status and attempt count
    And a different admitted source retains original resolution and can be reused

  Scenario: Attribute runs to the actual source snapshot
    Given a local invocation begins with tracked or untracked source changes
    When the host captures source identity and passes it to Runtime
    Then parent and child records retain the same revision and source fingerprint
    And an unavailable source snapshot does not prevent execution
    And upstream research payloads not exposed by the provider are explicitly unavailable


  Scenario: Correct a derived measurement without discarding an accepted drawing
    Given the requested drawing has current accepted visual and data evidence
    And a derived calculation cites retained valid source facts
    When the calculation is corrected without changing its source facts or canvas geometry
    Then the calculation retains its full precision
    And the accepted drawing evidence remains valid

  Scenario: Recheck a changed fact through its affected criteria
    Given the requested drawing has current accepted evidence
    When an evidenced source change affects one bound data criterion
    Then the fact receipt identifies that criterion and its required follow-up
    And unchanged visual criteria do not require another independent comparison
    But a canonical drawing change requires current drawing evidence

  Scenario: Distinguish drawing completion from durable storage
    Given a document session has accepted the drawing publications
    When the final result captures its document generation and sequence
    Then persistence is confirmed only by a contiguous backend acknowledgement
    And later edits do not extend the captured target
    And a disconnected or failed session does not report durable storage
