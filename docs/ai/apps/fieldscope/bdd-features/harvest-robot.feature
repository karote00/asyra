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
  Scenario: Injected target assumptions follow the actual current run
    Given a current session snapshot and matching mission and scene sources
    When an earlier but still valid synthetic target reading is admitted
    Then it retains its assumption label and the existing target identity
    And unknown visibility, attachment and quality remain unknown
    And the session clock, disposition and inventory remain unchanged
    When a cancelled run or copied context supplies another reading
    Then that reading is rejected without mutation

  @M3
  Scenario: Synthetic viewpoint samples use actual near occlusion
    Given a current run and explicitly declared synthetic camera and candidate targets
    When the adapter samples their original near source triangles
    Then each camera ray reports visible, occluded, outside-view or unknown evidence
    And the requested sample remains separate from the actual first-hit witness
    And a front surface of the target cannot certify its requested back-side pedicel
    And a non-target hit behind the intended sample remains unknown instead of occluded
    And hidden physical film, nets and leaves still obstruct geometric rays
    And no maturity or physical quality is inferred

  @M3
  Scenario: Empty or unknown viewpoint coverage does not find an empty row
    Given an empty candidate request or unknown current leaf state
    When a synthetic viewpoint is evaluated
    Then no complete visibility or empty-row conclusion is produced
    And no action, clock or inventory transition occurs

  @M3
  Scenario: A target reading cannot confirm harvesting actions
    Given an injected target reading with declared intact calyx and a clear corridor
    When no current expected-action receipt exists
    Then it cannot confirm support, cut, retention or placement
    And declared quality does not prove undamaged physical fruit

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


  @M3
  Scenario: Zero synthetic joints reproduce the parked robot source
    Given an admitted original robot definition and its five-DOF rig
    When all joint inputs are zero
    Then each source part has exactly one rigid owner
    And every original vertex and material is unchanged
    And the mast camera and retained crate remain fixed to the chassis

  @M3
  Scenario: Working joints cannot manufacture reach
    Given a valid rig with fixed source shoulder, elbow and wrist frames
    When finite joint inputs are evaluated within the approved bounds
    Then the original link lengths are preserved
    And the tool reference follows the wrist chain
    When any joint is nonfinite or exceeds its bound
    Then no partial candidate pose is published

  @M3
  Scenario: A smaller mast cannot silently reduce the approved lift stroke
    Given a source definition that cannot contain the full carriage and lift stroke
    When a working rig is requested
    Then working-rig admission reports unsupported geometry
    And the canonical parked design is not changed or clamped

  @M3
  Scenario: A retired robot rig cannot drive its replacement
    Given an admitted robot definition and candidate joint input
    When width, length, height or tool changes
    Then the prior rig is retired
    And stale definition inputs are rejected
    And repeated reads and FK evaluations do not generate new robot or crop meshes


  @M3
  Scenario: Dispatch evidence expires at its exclusive deadline
    Given synthetic dispatch evidence for the current mission and original scene and robot sources
    When explicit simulation time reaches its validity end
    Then dispatch is held without creating a run or renewing the evidence

  @M3
  Scenario: A copied source revision does not restore its owner identity
    Given a retired scene or robot source
    When dispatch supplies a copied handle with the same revision number
    Then admission rejects it before assessment or motion queries

  @M3
  Scenario: Fresh dispatch screens do not rewrite the authored design
    Given a design report with unknown survey and battery evidence
    When complete synthetic dispatch inputs are assessed against its completed route
    Then the fresh A reports are separate from the unchanged design report
    And dispatch still requires exact bound movement-query results


  @M3
  Scenario: A current scene cannot refresh an old canonical mission
    Given current scene and robot sources but a retired canonical mission receipt
    When dispatch reuses the old route with a caller-written revision
    Then admission rejects the stale receipt before assessment

  @M3
  Scenario: Empty movement clearance cannot admit a nonempty patrol
    Given a stowed robot at its dock and a different selected route start and end
    When the query provider returns empty or wrong-purpose route coverage
    Then dispatch remains held even if that unrelated result says clear


  @M3
  Scenario: Start cannot consume a borrowed accepted object
    Given an idle session for its current canonical mission
    When a caller submits an earlier accepted result instead of dispatch evidence
    Then no run is created

  @M3
  Scenario: Resume keeps the paused operation instead of replaying the dock route
    Given a paused run with its current pose and remaining intent
    When a fresh current-state resume decision matches that exact paused snapshot
    Then the same run resumes without changing its pose or operation progress
    And elapsed paused time is not added to the next active clock difference

  @M3
  Scenario: A pending resume cannot outlive cancellation
    Given a current-state resume provider has not returned
    When the run is cancelled and the provider later reports acceptance
    Then the cancelled generation remains closed and cannot mutate its successor

  @M3
  Scenario: Return queries receive the installed charging station source
    Given the station is projected at the authored dock position
    When a query consumer reads its current source
    Then it receives the exact separate platform, charger and exchange stand meshes used for presentation
    And route annotations and aggregate collision proxies are absent

  @M3
  Scenario: Moving the dock retires its installed source without rebuilding it
    Given a current installed station source
    When the authored dock position changes
    Then the prior source is retired and the successor uses the same shapes at the new position
    And unrelated mission, robot definition and view changes do not regenerate station geometry

  @M3
  Scenario: Observation and collision share complete current near geometry
    Given one canonical update has current farm, robot and installed dock sources
    When their shared query source is prepared
    Then hidden physical layers and separate station pieces retain their original near shapes
    And fruit spines, calyx and retained pedicel keep their canonical triangle ownership
    And only explicit measurement and route annotations are excluded
    And preparing geometry does not grant support or collision clearance

  @M3
  Scenario: Dynamic queries reuse completed source-local bounds
    Given a current source with exact original shape and primitive region bounds
    When bounded synthetic rays and robot poses change without a source change
    Then queries preserve the uncached source hit, miss and unknown results
    And no source position or region index is rescanned to prepare bounds
    When a successor source replaces it
    Then the successor prepares its own bounds and rejects retired output

  @M3
  Scenario: Query geometry cannot combine sources from different updates
    Given a query source bound to one completed canonical update
    When its receipt is copied or any source is retired or replaced
    Then that source cannot be used for observation or motion admission
    And no partial successor geometry is published

  @M3
  Scenario: A synthetic ray reports the nearest original obstruction
    Given a current near geometry source and explicit valid synthetic scene state
    When a bounded ray intersects several source surfaces
    Then its result identifies the nearest original mesh, instance and triangle
    And it does not label a detected fruit or admit a harvesting action

  @M3
  Scenario: A ray miss does not turn unknown scene state into empty coverage
    Given a synthetic ray with missing leaf state or retired geometry
    When its query is requested
    Then it cannot produce a valid within-range miss
    And no row is declared empty or safe to traverse

  @M3
  Scenario: Thin greenhouse film encloses air without making that air material
    Given the original film triangles are declared as source sheet regions
    When a ray starts in the greenhouse air and reaches the film
    Then the film remains an obstruction surface
    And its enclosed air is not classified as occupied film material

  @M3
  Scenario: Mixed source construction preserves each material region
    Given a source combines closed boxes, open tube shells and thin sheets
    When its canonical material provenance is prepared
    Then every original triangle belongs to exactly one declared source region
    And unverified closure is not promoted to a watertight solid
    And original fruit spines, calyx and geometry remain unchanged

  @M3
  Scenario: Arithmetic ambiguity cannot erase a possible nearest obstruction
    Given a bounded ray close to a source edge, parallel plane or range endpoint
    When finite arithmetic cannot prove the candidate lies outside
    Then the query returns a supported hit or unknown instead of a false miss
    And ordinary non-axis interior hits and clearly outside misses remain supported

  @M3
  Scenario: An unresolved open shell does not invent material occupancy
    Given an origin that cannot be excluded from an original open-shell region
    When the source provides no supported interior or outside proof
    Then origin occupancy remains unknown instead of declaring material or clear air
    And a farther forward surface cannot hide that origin uncertainty


  @M3
  Scenario: Static surface evidence does not grant movement or volume clearance
    Given current original scene and robot source triangles at a synthetic pose
    When the source pair query compares their complete triangles
    Then it reports separation, intersection or numerical uncertainty with original witnesses
    And separated nested surfaces do not prove their enclosed material volumes disjoint
    And tire, joint and tool-target contacts are not silently exempted
    And no endpoint-only result admits a movement


  @M3
  Scenario: A translated surface crosses an obstacle between separated endpoints
    Given two original source triangles with separated initial and final poses
    And a fixed-orientation linear translation crossing during the shared interval
    When the continuous source-pair query evaluates the complete interval
    Then it reports a supported swept intersection or unresolved numerical evidence
    And endpoint separation alone never grants swept separation
    And this pair result does not exempt support contacts or admit full robot movement

  @M3
  Scenario: Every axis must share the same contact time
    Given source triangles whose possible projection overlaps occur at incompatible times
    When the continuous source-pair query intersects the time constraints
    Then it reports swept separation only with a complete common-time proof
    And instantaneous leaf evidence cannot certify the full movement interval


  @M3
  Scenario: Whole-source surface coverage cannot hide unvisited collision pairs
    Given every original robot part and physical farm and dock instance
    When a fixed-joints base translation exhausts its budget with required pairs still unvisited
    Then the report preserves all unvisited pairs as incomplete coverage
    And it cannot report complete surface separation
    And same-body, tire, tool and crate pairs are not silently omitted

  @M3
  Scenario: Surface coverage preserves remaining material and contact obligations
    Given a complete original-source surface traversal
    When no triangle pair has a supported intersection
    Then numerical surface uncertainty remains unknown
    And unresolved open-shell material occupancy is not reclassified as free
    And containment and intended support or joint contact still require independent admission
    And no preserved-quality outcome is inferred from surface geometry

  @M3
  Scenario: Region exclusion preserves every original surface obligation
    Given a physical mesh containing prepared material regions and unprepared sheets
    When a fixed-joints coverage query refines strict swept bounds by original region
    Then every original triangle remains in exactly one accounted pair domain
    And sheets without prepared bounds remain candidates under the mesh bound
    And touching or numerically unresolved bounds are not excluded
    And region exclusion grants no material or intended-contact permission
