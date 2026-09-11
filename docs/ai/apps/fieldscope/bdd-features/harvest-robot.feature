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

  @M5
  Scenario: Charging fails or contacts become wet
    Given an aligned dock and a previously charging pack
    When charger power fails or a BMS/contact/water fault occurs
    Then charging is inhibited and a fault is retained
    And no automatic energized redocking or patrol restart occurs
