Feature: Conversational Agent drawing
  As a designer
  I want the Agent to execute registered document actions
  So that generated drawings remain editable, collaborative, persistent, and reversible

  Background:
    Given the App opened one required non-empty fileId
    And a configured Collaboration endpoint selected one file-scoped socket document session
    And production composed one server-action-batch provider
    And Core loaded the socket checkpoint and applied its pending tail before live Collaboration became ready

  Scenario: One server-prepared action batch enters one registered action route
    Given the user attached one accepted image
    When the user submits one Agent request
    Then the provider should POST the exact request to the same-origin backend
    And the backend should return one versioned AiActionBatch
    And the 7076 sample should read its checked-in ordered AiActionBatch instruction file directly
    And the sample should retain no SVG or alternate drawing source
    And Runtime should validate only the bounded action control envelope
    And permission, confirmation, and execution should preserve the prepared arguments identity
    And the registered action should call ordinary App common APIs
    And the frontend should not rebuild, normalize, clone, freeze, or compare the complete drawing geometry
    And no alternate provider or URL-selected execution route should exist

  Scenario: Domain knowledge remains backend-only while the 7076 sample bypasses it
    Given the browser sends bounded App context without a domain prompt or image-tool catalog
    When an ordinary Agent request reaches the same-origin action-batch backend
    Then the backend should use the configured local-codex or HTTP model provider
    And only the HTTP provider should require an endpoint, model, and API key
    And only the backend should add the App domain prompt and registered image-tool catalog
    And the API key should remain in the backend authorization header and never enter the browser or provider request body
    But an exact 7076 sample request should return its checked-in ordered AiActionBatch before loading the prompt, provider configuration, or model path
    And a partially matching 7076 request should fail without falling back to the configured model

  Scenario: One bulk action creates independently editable elements
    Given one prepared action contains 100 Vector descriptors and one Group descriptor
    When the registered insert action executes
    Then each synchronous mutation member should use the ordinary App transaction route
    And Core should create 100 independently addressable Vector elements and one Group
    And Props and Scene Tree should preflight each complete plural request before mutation
    And every accepted progressive slice should become visible through the ordinary projection route
    And Factory should group the invocation's completed members into one intended Undo entry
    And Collaboration should receive minimal ordered SharedPublications without History evidence
    And each SharedPublication payload should remain trusted after local canonical owner admission

  Scenario: Agent output remains editable through the Property panel
    Given the Agent created a Vector composition
    When the user edits position, dimensions, rotation, fill, stroke, or a selected Vector point
    Then the App should write canonical Props data through one ordinary transaction route
    And Scene Tree should publish the corresponding local computed projection
    And Render and the Property panel should display the new value
    And the peer should receive the canonical property change
    And one Undo should restore the prior value on both Actors
    And one Redo should restore the edited value on both Actors

  Scenario: Continuous property input is immediate but creates one Undo action
    Given the user begins dragging a continuous Property control
    When the control emits intermediate values
    Then every value should update canonical state, Render, and Collaboration immediately
    But the pointer session should remain one outer transaction
    And pointer-up should close exactly one Undo action

  Scenario: File-scoped persistence restores accepted work
    Given the user performed manual and Agent actions
    And the user performed Undo and Redo
    And the Actor accepted one remote publication
    When the page reloads with the same fileId
    Then Core should load the socket checkpoint and ordered pending tail for that fileId
    And the App should reconcile any unaccepted local publications from its IndexedDB recovery outbox
    And only the socket server and backend should own document persistence
    And no old-format or localStorage compatibility route should run
    And the Agent transport should not act as document persistence

  Scenario: Remote apply has no local History or echo
    Given Actor A and Actor B opened the same fileId
    When Actor A commits one canonical action
    Then Actor B should process each source publication through one remote Factory transaction
    And Actor B should apply ordered trusted source slices without recursive payload revalidation
    And Actor B should cross a cooperative paint boundary between visible source slices
    And Actor B should create no local Undo entry
    And Actor B should send no echo publication
    And Actor B should perform no document persistence write
    And peer-applied settlement should acknowledge canonical apply and projection, not durability

  Scenario: Failure rolls back its mutation member and preserves completed work
    Given one Agent invocation has completed mutation members in one lazy Factory history group
    And its next synchronous mutation member is inside the ordinary transaction route
    When a fatal canonical owner failure occurs
    Then Factory should use the ordinary transaction journal to roll back that failed member
    And earlier completed members should remain visible in one Undo entry
    And no later member should start after the failure
    And no separate Agent forward or inverse artifact should exist
    And only committed document publications should enter socket persistence
    And the user should receive bounded terminal failure evidence without raw arguments
    And an unknown transaction settlement should never be presented as confirmed retained work or a successful rollback

  Scenario: Stop preserves completed members without replaying work
    Given one Agent invocation has completed document changes
    When the user stops the invocation
    Then the Feature signal should prevent subsequent mutation members from starting
    And Factory should seal the completed members into one Undo entry
    And the conversation should report cancellation with the actual transaction disposition
    And a late completion reply should not override the cancelled conversation state
    And Try again should remain unavailable after execution has started

  Scenario: DevTools globals remain human-only
    When a human opens browser DevTools
    Then the human may inspect the Core, Collaboration, Canvas debugger, and performance handles
    But product code, tests, E2E, and scripts should use imported owner APIs or the fixed document diagnostic service
    And no automation path should read or mutate a DevTools handle
