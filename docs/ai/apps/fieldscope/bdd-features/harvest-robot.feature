Feature: Harvest robot feasibility and supervised harvesting
  M1 lane/load/hazard scenarios are covered by domain Vitest tests.
  M2-M6 scenarios are acceptance requirements, not claims of implemented behavior.

  @M1
  Scenario: The existing water drain is not a robot road
    Given the default 0.30 metre soil drain and a 0.55 metre chassis
    When the drain is selected as a patrol lane
    Then the lane is blocked even if the ground is marked prepared

  @M1
  Scenario: A shared passage contains columns
    Given 0.35 metre side margins and a 0.076 metre central column
    When a 0.55 metre chassis requests the shared passage
    Then the straight lane uses only one side of the column
    And the lane is blocked for insufficient width

  @M1
  Scenario: Unknown soil is not approved by geometry
    Given a geometrically wide soil lane with unknown ground bearing
    When feasibility is evaluated
    Then its result is unverified
    And no actuator permission is produced

  @M1
  Scenario: Exact-width screening with measured entrance and headland
    Given usable width equals chassis width plus both clearance margins
    And prepared ground and measured entrance and headlands
    When the stowed straight route fits
    Then the result is screened
    And full swept-path and physical validation remain unresolved

  @M1
  Scenario: End plant setback is too short for the base
    Given the center route starts at 0.25 metres and the base is 0.90 metres long
    And no usable external headland exists
    When the route is assessed
    Then the footprint crossing the entrance is reported

  @M1
  Scenario: The next cucumber would overload the crate
    Given a retained crate below its mass limit
    When the next fruit would exceed that limit
    Then exchange is requested before picking the fruit

  @M1
  Scenario: A light tomato tray is spatially full
    Given payload is below its permitted mass
    And measured fill reaches the operational return threshold
    Then exchange is requested

  @M1
  Scenario: Sinkage takes priority over saving produce
    Given the crate is full and the base loses support
    When the advisory policy runs
    Then travel and cutting are inhibited
    And no crate release or blind arm swing is commanded

  @M1
  Scenario: A person takes priority over every machine task
    Given a person enters while the platform is unstable and the box is full
    Then the advisory action protects people first

  @M2
  Scenario: Editing a route and undoing restores the mission
    Given an idle admitted mission
    When the user changes its lane interval and undoes the edit
    Then canonical route settings and assessment return together
    And crop meshes are not rebuilt

  @M3
  Scenario: Repeated schedules do not overlap
    Given a patrol takes longer than its configured period
    When two schedule deadlines pass
    Then at most one patrol remains active and one future patrol is pending

  @M3
  Scenario: An obstacle blocks both advance and return
    Given a person or fallen hose blocks the route
    And no surveyed alternative or return segment is available
    Then the robot stops and requests assistance without crossing plants or drains

  @M3
  Scenario: Wet soil causes one wheel to sink
    Given a previously surveyed route and newly observed roll or traction loss
    Then cut and base travel stop
    And the mechanically retained crate stays latched
    And recovery requires reinspection and explicit acknowledgement

  @M3
  Scenario: Occluded fruit requires another view
    Given a fruit is partly behind a leaf
    When stem identity or cut clearance is uncertain
    Then reobservation or deferral is recorded
    And the blade stays inhibited

  @M3
  Scenario: Fruit is behind the climbing net
    Given a ripe fruit and a strand crossing the extraction corridor
    Then use a verified alternative approach or defer
    And never pull the fruit through the strand

  @M3 @M4
  Scenario: A row with no visible fruit is not known empty
    Given dense leaves conceal part of a row
    And leaf manipulation has not passed physical qualification
    Then the scan records unknown coverage
    And no blind leaf probing occurs

  @M4
  Scenario: Qualified leaf displacement meets unexpected resistance
    Given a compliant leaf tool with measured crop-specific limits
    When force or displacement exceeds its validated envelope
    Then contact motion stops
    And retreat occurs only along a verified free path

  @M3
  Scenario: A cut command is not harvest confirmation
    Given the tool supports a cucumber
    When cut confirmation or fruit retention is missing
    Then it is not counted as boxed
    And the plant model does not lose the fruit

  @M3
  Scenario: Sensor or link loss invalidates a planned action
    Given a valid approach with an older observation
    When sensing becomes stale or communication is lost
    Then stop and await current evidence without automatic fault restart

  @M3 @M5
  Scenario: Manual exchange requires a stationary secured base
    Given an admitted exchange station and a full crate
    When the operator requests removal
    Then the platform is immobilized and the tool is inhibited
    And resumption requires a new crate ID, valid tare and confirmed latch

  @M5
  Scenario: Power loss does not drop a loaded axis
    Given the arm holds a fruit above the retained crate
    When power is removed during a supervised test
    Then independent brakes and mechanical retention satisfy the reviewed stop design
    And software does not claim a safe stop without the test evidence

  @M6
  Scenario: A future carrier loses its coupling or heartbeat
    Given a loaded carrier follows the robot
    When coupling or authenticated fresh communication is lost
    Then both machines execute their validated stop behavior
    And the carrier does not coast into the robot or workers

  @M1
  Scenario: Work must preserve loaded return and charging reserve
    Given enough battery for return but not another harvest segment and reserve
    Then return to charge is requested before starting that segment

  @M1
  Scenario: Battery cannot support the requested mission even when full
    Given mission energy and estimation uncertainty exceed usable pack capacity
    Then the report identifies insufficient capacity without clamping required SOC

  @M1
  Scenario: A charger marker does not prove the robot can return
    Given a blocked return path or unavailable charging dock
    Then dispatch is held even with a full battery

  @M3 @M5
  Scenario: A charging robot cannot depart on the patrol timer alone
    Given a scheduled patrol while charge budget is insufficient
    Then the patrol remains pending
    And no traction or arm motion occurs while charging contacts are engaged

  @M3 @M5
  Scenario: Charging fails or contacts become wet
    Given an aligned dock and a previously charging pack
    And M3 charger and contact evidence is explicitly synthetic
    When charger power fails or a BMS/contact/water fault occurs
    Then charging is inhibited and a fault is retained
    And no automatic energized redocking or patrol restart occurs

  Scenario: Edit robot dimensions without rebuilding planted geometry
    Given a fully planted greenhouse and a parked concept robot
    When the operator commits a valid chassis width
    Then Core records one intended undo action
    And the robot and route read projections update
    And the existing farm and cultivar geometry is reused
    When the operator undoes and redoes that action
    Then the width and rendered robot follow canonical history

  Scenario: Invalid energy arithmetic leaves the mission unchanged
    Given an editable robot mission with an existing history depth
    When the operator submits energy estimates whose sum overflows
    Then admission rejects the input before mutation
    And the mission and history depth remain unchanged

  Scenario: A shorter farm cannot silently choose another route
    Given a mission interval ending at 49.5 metres
    When greenhouse length becomes 20 metres
    Then the authored mission interval remains unchanged
    And its route is reported invalid without a replacement route
    And the robot remains parked at its authored dock


  @M3
  Scenario: A design edit invalidates a run across history replay
    Given a running synthetic mission with queued observations
    When a canonical farm or robot edit changes its inputs
    Then the run is invalidated before another transition
    And old observations cannot write into a replacement run
    When the edit is undone
    Then the old run does not resume

  @M3
  Scenario: Rendering does not advance the simulation clock
    Given a running mission with a known simulation time
    When camera frames and locale changes occur without a clock input
    Then time, patrol progress and target inventory remain unchanged
    And farm and robot definition geometry is not rebuilt

  @M3
  Scenario: A large clock advance cannot skip a blocking checkpoint
    Given a route with a blocked intermediate segment
    When simulation time crosses several checkpoints in one advance
    Then motion stops before the blocked segment
    And the final route endpoint is not published as reached

  @M3
  Scenario: Repeated evidence cannot count one fruit twice
    Given a supported target with confirmed cut and retained fruit
    When placement confirmation is delivered twice
    Then the crate receives that target and its mass once
    And every admitted fruit remains in exactly one physical disposition
    And simulation contact does not assert calibrated damage quality

  @M3
  Scenario: A clear endpoint does not prove a clear extraction path
    Given a carried fruit crosses a net strand between clear endpoints
    When extraction motion is queried
    Then the swept query blocks the movement
    And no pose teleports the fruit through the net

  @M3
  Scenario: Unknown leaf motion cannot admit a tool movement
    Given a leaf can enter the proposed tool path
    And its motion bounds over that interval are unknown
    When the simulation requests motion admission
    Then clearance remains unknown and the operation is unresolved

  @M3
  Scenario: Evidence from another run cannot confirm a cut
    Given a replacement run with a supported target
    When a cut confirmation from the cancelled run arrives
    Then it is rejected without inventory or pose mutation

  @M3
  Scenario: A synthetic observation is not a field survey
    Given unknown ground evidence in the authored mission
    When an explicitly injected synthetic target observation arrives
    Then it is labeled synthetic
    And the ground survey remains unknown
    And it does not by itself admit dispatch


  @M3
  Scenario: Dispatch evidence is admitted before a run exists
    Given a canonical mission whose design reports retain unknown evidence
    And complete fresh synthetic dispatch evidence bound to its mission and scene revisions
    When Start validates that evidence through the assessments and motion admission
    Then a run is created only after all required admission succeeds
    And the design reports remain unchanged

  @M3
  Scenario: Paused schedule time does not become resumed movement
    Given a paused patrol before a movement checkpoint
    When explicit clock inputs cross two patrol deadlines
    Then one future patrol is pending and the robot pose is unchanged
    When fresh admission permits explicit resume
    Then paused elapsed time is not replayed as movement


  @M2
  Scenario: Removing the selected strip cannot select its old neighbor
    Given a mission bound to a nonterminal canonical strip ID
    When the selected strip is removed and its neighbor occupies that index
    Then the authored mission binding is unchanged and its route is invalid
    When the removal is undone and redone
    Then the original identity is restored and removed respectively
    And no substitute route is chosen

  @M2
  Scenario: Reordering or removing another strip preserves mission identity
    Given a mission bound to a canonical strip ID
    When a preceding strip is removed or the selected strip is reordered
    Then the mission still selects the same strip ID at its current position
    And the route assessment uses its newly resolved ordinal

  @M2
  Scenario: Invalid strip identity cannot enter canonical history
    Given an admitted farm and mission
    When an edit supplies missing or duplicate strip IDs
    Then the whole edit is rejected before mutation
    And the farm, mission and history remain unchanged


  @M3
  Scenario: Repeated cultivar instances have distinct fruit identities
    Given two plants use the same cultivar variant
    When the canonical scene is prepared
    Then each individual fruit has a unique scene-local identity
    And its near and distant geometry refer to that same identity
    And repeated views do not create additional targets

  @M3
  Scenario: Detachable geometry preserves the attached source exactly
    Given the canonical near and distant botanical meshes
    When source-owned fruit partitions are prepared and reassembled
    Then every source triangle has exactly one owner and original vertex attributes are preserved
    And no primitive fruit or changed cultivar shape is substituted

  @M3
  Scenario: Scene consumers reuse preparation across presentation and simulation updates
    Given an admitted scene revision with prepared fruit identities and geometry
    When camera, locale, visibility, clock and completed pose inputs change
    Then crop models and plant assignments are not regenerated
    And hidden nets and leaves remain available to observation and collision queries
    When canonical botanical inputs replace the scene
    Then old scene evidence cannot admit movement in the new revision


  @M3
  Scenario: Cucumber source spines follow their fruit without implying damage quality
    Given a cucumber with its original near-view fine spine geometry
    When its source partitions are prepared for a synthetic harvest
    Then all spine triangles and attributes belong to that fruit
    And the unchanged distant representation is not recorded as spine loss
    And soft textile contact alone does not prove intact physical quality

  @M3
  Scenario: Tomato calyx and retained pedicel have one target owner
    Given a tomato with calyx and a synthetic source cut boundary on its pedicel
    When its source triangles are partitioned
    Then the calyx and distal pedicel belong to that fruit
    And proximal pedicel and neighboring plant geometry remain plant-owned
    And the synthetic boundary is not reported as a measured abscission zone
