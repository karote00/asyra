# Harvest hardware concept and validation

## Active concept, not a manufacturing release

The active product target is a compact multi-legged walking robot with a body no
wider than 0.80 m and no user-imposed height cap. Body width excludes legs,
tools, crate, load and their stowed/working sweeps; every total envelope is
derived and checked separately. It includes the non-articulated central chassis
and permanently fixed housings in the canonical body frame. Historical wider
definitions remain viewable at their original size but are not admitted for new
walking action. The preferred target has four arm chains: one
combined foliage-opening and fruit-holding arm plus one cutter arm on each side. It
must inspect both sides and harvest representative targets on either side,
including upper fruit. It is not a wheeled or vehicle-carried platform. The
implemented four-wheel, single-arm model is a historical software concept and is
not hardware acceptance evidence for this target.

The first simulation baseline may use six legs, a low battery and payload mass,
a bounded vertical shoulder carriage and four medium-short arms. Every dimension,
component mass, centre of mass, joint range, foot area, load and actuator property
that has not been measured or selected is a visibly labeled adjustable synthetic
assumption. Six legs provide candidate contact choices; leg count or a three-foot
stance does not by itself prove stability. Compare body height, leg extension,
shoulder-carriage travel and arm length through the same whole-robot reach,
bending-moment, centre-of-mass, overturning and swept-clearance screens. Do not
accept upper reach by drawing a tall body or long arm without those combined
results.

Compact size and low mass are design objectives. Apart from the 0.80 m body-width
limit, their numerical limits are not yet measured. Record body, total stowed and
working envelopes, mass, centres of mass and
per-foot loads for every candidate. Do not label a candidate compact, light or
field-ready merely because it fits the rendered scene or uses synthetic values.

The scheduler uses both independent left/right groups concurrently when current
space, stance, load and support evidence permits. It serializes only actual
shared-source, shared-space, support or load conflicts. Concurrent action retains
one current whole-robot pose/load state and validates affected cross-group
interactions; independent left and right results are not composable proof for a
shared conflict.

Fruit support and cutting remain separate tool functions. The support tool uses
crop-specific soft contact; the cutter enters only a confirmed plant-side pedicel
corridor. The crate remains mechanically retained by the base and is never an arm
payload. Individual tray inserts separate delicate tomatoes from cucumbers. The
receiving tray should meet the placement height or the arm should lower each
fruit; there is no untested free-fall chute. Oversized or unreachable produce is
deferred until a separately qualified grip, reach and load envelope exists.

## Existing farm fit and scene demand

The default strips span 6.3 m and leave 0.35 m on each side of a 7 m bay. The
0.30 m semicircular drain is water/soil and is never a foot support. The nominal
0.70 m inter-bay passage is split by 0.076 m columns at its center; it is not an
unobstructed travel lane. Routing must include columns, doors, braces, nets, root
rows, irrigation lines, hoses, debris and actual canopy.

The user reports that the represented home farm matches the home-farm layout. In
the current configuration, the passage is about 1.8 m before plant-growth needs;
a rough calculation gives about 1.2 m afterward. These are sanity references,
not fixed constraints, guaranteed clearance or default usable width. Farm and
plant-growth dimensions may change, and the free corridor can be offset,
irregular or unknown.

Derive farm-side free-passage geometry from the current farm configuration,
declared growth envelope and actual installed sources. Separately derive the
robot's full stowed, stance, leg-swing, arm-stow, body and turn swept demand from
its definition, path/time, stance/contact schedule and evidence, gait, load,
terrain and explicit margin. Compare those completed geometries; do not reuse
1.2 m as an input, split a nominal difference into side reserves or subtract
scalar robot width from scalar strip width. Farm/plant/growth/source, route,
margin or survey changes recompute scene demand and compatibility while reusing
an unchanged robot definition. Robot/path/time/stance/contact/gait/load/terrain/
margin changes recompute locomotion demand and compatibility.

A straight/reverse passage is not automatically a turning area. The walking
candidate may reverse out or continue to an explicitly wider surveyed location
before turning. If the full leg/body/arm swept turn does not fit, record
`no-turn` or `blocked`; do not assume in-place rotation at every point.

Configured strip width is not usable foot span. Derive scene free space from the
current installed plant, leaf, support, pipe, drain and obstacle sources; compare
the separately derived robot swept demand only at motion admission.
Likewise, derive highest target height from actual fruit source enumeration;
`netTop` is not a fruit-height result. An actual leaf or plant intrusion
creates a local geometry/contact-risk candidate even when the rough reference
appears wide enough; authored ordinary foliage contact is not automatically
damage or clearance. Pruning and net training remain human maintenance guidance and never
authorize the robot to cut non-target foliage or move plants. Never remove crop
rows, widen beds or change the user's farm layout to fit a candidate. End plant
setbacks of 0.25 m are not a turning headland; require measured external transfer
space, door access and return paths.

The initial scenario includes slightly wet, uneven soil affected by adjacent
water channels and explicit debris. It does not assume swamp-like continuous
sinkage. Terrain height, slope, rut depth, obstacle dimensions, foot pressure,
friction, bearing capacity and sinkage remain measured inputs or visibly labeled
synthetic ranges. Unknown values stay unknown. Greenhouse framing and 20 mm
planting tubes are not walking supports.

## Load, walking mobility and exchange

Select crates by washable food-contact material, internal dimensions, supported
base, latch engagement and ergonomic handling. Until crop and robot loads are
measured, payload and tray-fill limits are visibly labeled adjustable synthetic
ranges. The lower of the crop's validated bruise/stack limit, crate rating,
robot capacity and whole-configuration stability limit is authoritative.

Measure tare on insertion; retain crate ID, crop, time, mass and fill estimate.
Request return/exchange before the next fruit would exceed permissible mass or
fill volume, at a configurable operational fill threshold (an initial visibly
labeled synthetic trial value may be used),
on imbalance, absent/lost latch, sensor disagreement, contamination, damage,
wrong crop, low return-energy reserve or box expiry. Volume/fill sensing is
required because a light box can be spatially full. Stop picking during return.

Exchange at a designated level headland dock: stow tools, immobilize and support
the base, inhibit blades/arms, confirm station/clear floor, command and confirm
the base-retained latch release, confirm old-crate removal, identify a new empty
crate, verify its tare, command and confirm re-lock, then explicitly resume. The
arms do not remain occupied holding the crate. Do not release a crate
while moving, reset load on a button without exchange evidence, or walk with a
missing crate. A separate logistics carrier is outside the active robot target
and cannot be used to satisfy its walking or payload evidence.

For preliminary calculation, total mass is base + all four arms + tools + legs +
battery + crate + payload; avoid double-counting components included in base
mass. Each exact pose and stance must assign every component mass and centre of
mass once. Calculate centre-of-mass projection and uncertainty against the
current supporting-foot polygon, plus arm-root/shoulder bending and whole-robot
overturning moments for high reach, same-side support/cut, carried-load return and
any simultaneous bilateral pose. The legacy wheel-track lateral-reserve formula
does not assess this walking configuration.

Foot load and nominal ground pressure require the actual stance, contact area and
load distribution. Soil allowable pressure, friction and sinkage require field
measurements at relevant moisture and depth. A positive quasi-static support
margin is only a screen; it does not establish dynamic gait stability, actuator
capacity, structural stiffness or safe operation. Differential sinkage or lost
contact can invalidate the support polygon. Contact-force feedback and a complete
gait schedule support closed-loop foot placement but do not replace calibrated
soil and whole-body load evidence.

## Battery, charging dock and return policy

Provide a dry, level end-of-row service area with separate crate exchange and
charging positions, outside irrigation spray/flood exposure and worker egress.
A charger is not simply a marker on the ground: survey its approach, localization
reference, contact alignment, mechanical immobilization, guarded contacts, drainage,
cable protection and recovery access. Do not put exposed energized contacts in
the drain or attach a station to unqualified greenhouse framing. Electrical
protection and charging requirements depend on the chosen battery/BMS/charger and
local installation rules; have them reviewed before construction.

Choose battery chemistry, pack voltage/capacity, fusing, isolation, enclosure,
BMS and a matching charger as one reviewed system. A 24/48 V architecture is an
option, not a selected safe voltage or bill of materials. The BMS owns cell-level
over/under-voltage, current and temperature protection independently of the app.
Prevent locomotion/arm/cutter actuation while docked and charging. Verify alignment,
station availability, contacts, immobilization and permitted temperature before
energizing. Contact failure, charger outage, overheating or water ingress causes
a fault and assistance, not repeated energized docking attempts.

Energy planning uses conservative measured loaded-walking Wh/m, arm-cycle Wh,
perception/control idle W and waiting time. Usable pack Wh = nominal Wh times
aged/temperature capacity fraction. Energy now = usable Wh times
max(0, state-of-charge minus absolute SOC uncertainty). Admit a mission only if
outbound/work energy plus loaded return-to-dock energy, bounded detour/wait
allowance and an untouchable reserve fit. Reassess before departure, every lane
segment and every pick using a fresh battery estimate and currently admitted
return path. Payload, slope, foot sinkage, temperature and battery aging change
consumption; measured upper bounds must cover the admitted operating envelope.

At insufficient working budget but enough return reserve, cancel remaining
picks and return. If even a verified return cannot be funded or its path/dock is
unavailable, stop accepting work and request recovery; never invent a passable
shortcut or promise a safe return. Retain energy for controlled stopping, sensors
and communication in that fault state. Patrol scheduling cannot consume a
reserve to meet its period. The model is a budget screen, not a runtime guarantee.

Size the pack from the intended complete patrol/harvest/return duty cycle plus
reserve, not from motor nameplate power alone. Record charger power, conservative
charge efficiency, usable SOC window and taper: ideal Wh/W gives only a lower
bound, not a guaranteed ready time. A scheduled patrol waits for a confirmed
minimum dispatch budget and completed undocking checks; no overlap, no automatic
fault reset. If charging cannot support the requested patrol period, show the
schedule as infeasible and revise capacity, charging power or period. Test loss
of dock, blocked approach, aging, cold/hot pack, sudden SOC drop and charger faults
with loads before unattended operation.

## Priority and recovery

Priority is people and bystanders, then avoiding uncontrolled motion/cutting,
then containing the robot/tool/crate energy, then crops and produce. Do not
command a falling arm to catch a crate or swing a counterweight without a
verified recovery trajectory. Crate latches and retaining walls work without
software. On sinkage, roll excursion, slip, blocked path, person entry, stale
sensors, lost communications or emergency stop: inhibit cutting, stop robot
motion using the independently validated stop function, retain payload and latch,
and request intervention. A person stop keeps the base at its current position.
Fold articulated parts toward the initial compact attention pose only through a
separately admitted in-place joint sweep that maintains stance, load, latch and
separation from the tracked person. If that local sweep is blocked or unknown,
hold the current pose and request help. Never blindly pull an entangled tool
through vines.
Electrical emergency stop design must avoid dropping gravity-loaded axes.

A dropped or damaged fruit retains its actual location/disposition and updates
gripper and inventory state. Continue only when it creates no current
person/support/path hazard; otherwise hold the affected action and treat the
fruit as a new obstacle. Never record it as successfully placed. An unstable or
unlatched crate remains an operational stop.

A force spike near a leaf/net is not permission to increase force. Stop contact,
record pose and target, and retreat only along a verified free path. If retreat
is not known, hold and request help. No automatic repeated attempts after a fault.

## Observation and crop handling

Scan from several base/wrist viewpoints with explicit greenhouse-film, weather,
time-of-day, illumination, shadow and glare assumptions before touching foliage.
No visible fruit means unknown coverage if canopy occludes the row.
Retain observation age, pose/calibration, fruit identity, crop, ripeness, depth,
uncertainty, stem/calyx evidence and approach corridor; avoid double-picking from
multiple views. Detect ripe fruit and the correct peduncle independently. Net
crossings and a fruit behind a strand need a verified alternate approach; never
pull the fruit through the net or mistake the main stem for a cutting target.

Ordinary authored foliage contact may use the combined foliage-opening and
fruit-holding arm when geometry and current evidence exclude foot placement,
pinch, hook/entanglement, drag/tug and excessive stem displacement. The initial
0.03 m displacement demand is a visible adjustable synthetic assumption, not a
force or damage threshold. Missing compliance/contact-history/release evidence
remains unknown. Do not use the cutting jaw to search blindly. Low confidence,
uncertain depth/stem, glare, occlusion or blocked view requires another admitted
viewpoint or deferral. Never infer harvest success solely from a gripper command,
one clear image or simulated fruit disappearance, and never treat net cutting as
an ordinary quality defect.

Cucumber: support its body, isolate the peduncle, cut with an enclosed mechanism,
confirm separation/retention, then place with low drop height. Tomato: support
one fruit with pressure-limited pads and a verified individual pedicel tool;
retain neighboring fruit/truss. Do not assume the same jaws, gripping force,
ripeness model or cutter motion work for both crops. Clean contact parts and
cutters with an approved crop/food sanitation process between required batches.

## Measurements required before procurement and actuation

- Smallest actual lane profile, gate width/height, external headland dimensions,
  column/brace locations, drainage/flood level and emergency access.
- Wet/dry bearing, friction and foot-contact tests; slope, rut depth, per-foot
  loading, sinkage, stopping distance and stability through fully extended arm poses.
- Fruit size/mass distribution by stage, reach distribution, peduncle geometry,
  permissible gripping/leaf forces, cut force, drop height and storage bruising.
- Crate dimensions/tare/load/fill/cleaning limits; full/empty logistics and return
  energy reserve; access for manual recovery and lifting a disabled robot.
- Sensor detection limits in sun/shadow, condensation and occlusion; calibration,
  fault injection and independent stop/watchdog validation.
- Budget, component availability, maintainability and a reviewed bill of materials,
  drawings, tolerances, wiring, guards and risk assessment before manufacture.

## Primary references and their limits

- <a href="https://arxiv.org/html/2603.13987v1" target="_blank" rel="noopener noreferrer">VADER collaborative harvesting system</a>: supports separating fruit-holding and stem-cutting roles and localizing the cut target. Its wheeled Warthog base and sweet-pepper trials are not adopted as walking-base or Yu-Nu tomato evidence; the paper says data and code will be released after acceptance, so they are not treated as currently downloadable evidence.
- <a href="https://arxiv.org/html/2112.10206" target="_blank" rel="noopener noreferrer">Six-legged contact-feedback locomotion research</a>: supports treating foot contact, load feedback and terrain adaptation as a closed-loop problem. Its small prototype does not supply agricultural payload, soil, foot-size or stability numbers for this robot.
- <a href="https://www.wur.nl/upload_mm/5/5/7/c221711e-98da-4865-805a-8fc8531aa624_flyer_cucumber%20harvesting_robot_uk.pdf" target="_blank" rel="noopener noreferrer">Wageningen autonomous cucumber harvester</a>: integrated vehicle, sensing and gripping/cutting; not a fit proof for this farm.
- <a href="https://doi.org/10.1002/rob.21937" target="_blank" rel="noopener noreferrer">SWEEPER field study</a>: occlusion and crop conditions constrain actual harvest success; logistics is part of the cycle.
- <a href="https://arxiv.org/abs/2409.17389" target="_blank" rel="noopener noreferrer">Safe Leaf Manipulation for Accurate Shape and Pose Estimation of Occluded Fruits</a>: research into planned leaf displacement; no cultivar-independent force guarantee.
- <a href="https://www.bogaertsgl.com/index.php/qii-drive-l" target="_blank" rel="noopener noreferrer">Bogaerts Qii-Drive L</a>: examples of powered greenhouse crate logistics on prepared pipe rails; no claim that this farm already has such rails.
- <a href="https://www.universal-robots.com/products/ur3e/" target="_blank" rel="noopener noreferrer">UR3e manufacturer specifications</a>: reference reach/payload scale; final selection and payload/CoG checks remain open.
- <a href="https://www.iso.org/standard/62659.html" target="_blank" rel="noopener noreferrer">ISO agricultural machinery safety catalogue</a>: the 2018 edition points to the newer 18497 series. Applicable current parts and local requirements must be reviewed by the hardware safety owner; citing a standard is not compliance.
