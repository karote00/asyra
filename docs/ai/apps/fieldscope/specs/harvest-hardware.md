# Harvest hardware concept and validation

## Initial concept, not a manufacturing release

Use a slow electric wheeled platform on a prepared, surveyed load-bearing lane,
with battery/ballast low in the base, a retractable lift, short reach arm, wrist
camera, guarded crop-specific support-and-cut tool and a mechanically latched
onboard crate. This avoids a second vehicle trailing through narrow crops in the
first prototype. The crate moves as part of the base, never carried by the arm.
Individual tray inserts separate delicate tomatoes from cucumbers. The receiving
tray should rise to the placement height or the arm should lower each fruit;
there is no untested free-fall chute. Oversized cucumbers require a separately
qualified grip/load envelope or are deferred to a human.

Preliminary packaging target: base 0.55 m wide and 0.90 m long, stowed height
1.20 m, contact track 0.42 m, four ground contacts. These are adjustable design
assumptions, not purchased hardware dimensions. Use reversible straight runs and
turn only in a surveyed headland. Wheel type, wheel diameter, drive/brake torque,
IP rating, bearing seals, mast stiffness and battery capacity remain selections
pending measured ground, washdown regime, mass and duty cycle. Do not infer
these from greenhouse steel sizes or existing net-support poles.

A 0.50 m-reach, 3 kg-payload arm such as the UR3e demonstrates a commercially
available scale, not a selected bill of materials. Reach must include approach,
withdrawal and placement poses; payload includes tool, cables and carried fruit
with the manufacturer's payload/CoG limits. A short arm may need a lift and
lateral positioning stage; a 3 m canopy is not reachable merely by drawing a tall
mast. Full swept volume, stiffness, stability and emergency retract clearance
must be verified before accepting that combination.

## Existing farm fit

The default strips span 6.3 m and leave 0.35 m on each side of a 7 m bay.
The 0.30 m semicircular drain is water/soil, not a bearing surface or rail.
A 0.55 m chassis plus 0.05 m clearance per side needs at least 0.65 m before
foliage, uncertainty, wheel edge distance and wet-soil conditions are considered.
The nominal 0.70 m inter-bay passage is split by 0.076 m columns at its center;
it is not an unobstructed 0.70 m travel lane. Routing must include columns,
doors, braces, nets, root rows, irrigation lines, hoses and actual canopy.

Default internal 1.8 m soil strips have root lines about 0.20 m inward from
each neighboring drain edge. That leaves about 1.4 m between root centerlines,
not guaranteed free space. Survey canopy intrusion at wheel, chassis, crate,
arm and mast heights, including fruit sag under load. A preliminary 0.20 m
canopy reserve on each side leaves about 1.0 m. Never remove crop rows or widen
beds silently to fit a robot. End plant setbacks of 0.25 m are not a turning
headland; require measured external transfer space, door access and return paths.

Initial mode excludes travel inside drains and free travel over wet unverified
soil. Engineered bridges or pipe rails would be a separate infrastructure design
with support spacing, anchorage, flood conveyance, load rating and worker-egress
validation. Greenhouse framing and 20 mm planting tubes are not certified rails.

## Load, mobility and exchange

Select crates by washable food-contact material, internal dimensions, supported
base, latch engagement and ergonomic handling. Preliminary payload targets for
trial design: 8 kg cucumbers or 3 kg tomatoes per shallow tray; the lower of the
crop's validated bruise/stack limit, crate rating, platform capacity and stability
limit is authoritative. These numbers are not proven crop-handling limits.

Measure tare on insertion; retain crate ID, crop, time, mass and fill estimate.
Request return/exchange before the next fruit would exceed permissible mass or
fill volume, at a configurable operational fill threshold (initial trial 80%),
on imbalance, absent/lost latch, sensor disagreement, contamination, damage,
wrong crop, low return-energy reserve or box expiry. Volume/fill sensing is
required because a light box can be spatially full. Stop picking during return.

Exchange at a designated level headland dock: stow tool, immobilize base, inhibit
blade/arm, confirm station/clear floor, manually unlatch and swap crate, identify
new crate, verify tare and latch, then explicitly resume. Do not release a crate
while moving, reset load on a button without exchange evidence, or drive with a
missing crate. A future powered carrier has a separate braking and fault state;
free-following is not equivalent to mechanically coupled motion.

For preliminary calculation, total mass is base + arm + tool + battery + crate
+ payload; avoid double-counting components included in base mass. Wheel load
fractions need measurement under arm reach and slopes. Nominal ground pressure
is load/contact area; soil allowable pressure requires field measurements with
moisture/depth and wheel-sinkage tests. Required tractive force is approximately
m*g*(rolling resistance + sin(slope)) + m*acceleration; drive torque includes
wheel radius, gearing and efficiency. Brake and motor thermal duty, not only
peak torque, must meet the maximum permitted payload. No coefficient is assumed
known from soil color or a rendered water plane.

The software's lateral reserve is only a quasi-static screening calculation:
weighted lateral CoG offset + h*tan(abs(roll)) + h*abs(lateral acceleration)/g
+ uncertainty must remain inside half the contact track. Test longitudinal
braking and mast/tool moment separately. Differential sinkage can destroy the
support polygon even when this formula passes; measured loss of contact forces
an immediate fault. Dynamic contact/soil behavior needs calibrated trials.

## Battery, charging dock and return policy

Provide a dry, level end-of-row service area with separate crate exchange and
charging positions, outside irrigation spray/flood exposure and worker egress.
A charger is not simply a marker on the ground: survey its approach, localization
reference, contact alignment, wheel restraint, guarded contacts, drainage,
cable protection and recovery access. Do not put exposed energized contacts in
the drain or attach a station to unqualified greenhouse framing. Electrical
protection and charging requirements depend on the chosen battery/BMS/charger and
local installation rules; have them reviewed before construction.

Choose battery chemistry, pack voltage/capacity, fusing, isolation, enclosure,
BMS and a matching charger as one reviewed system. A 24/48 V architecture is an
option, not a selected safe voltage or bill of materials. The BMS owns cell-level
over/under-voltage, current and temperature protection independently of the app.
Prevent traction/arm/cutter actuation while docked and charging. Verify alignment,
station availability, contacts, immobilization and permitted temperature before
energizing. Contact failure, charger outage, overheating or water ingress causes
a fault and assistance, not repeated energized docking attempts.

Energy planning uses conservative measured loaded-drive Wh/m, arm-cycle Wh,
perception/control idle W and waiting time. Usable pack Wh = nominal Wh times
aged/temperature capacity fraction. Energy now = usable Wh times
max(0, state-of-charge minus absolute SOC uncertainty). Admit a mission only if
outbound/work energy plus loaded return-to-dock energy, bounded detour/wait
allowance and an untouchable reserve fit. Reassess before departure, every lane
segment and every pick using a fresh battery estimate and currently admitted
return path. Payload, slope, tire sinkage, temperature and battery aging change
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
sensors, lost communications or emergency stop: inhibit cutting, stop platform
motion using the independently validated stop function, retain payload and latch,
and request intervention. Hold or retract the arm only when its validated stop
mode and clearance permit it; never blindly pull an entangled tool through vines.
Electrical emergency stop design must avoid dropping gravity-loaded axes.

A force spike near a leaf/net is not permission to increase force. Stop contact,
record pose and target, and retreat only along a verified free path. If retreat
is not known, hold and request help. No automatic repeated attempts after a fault.

## Observation and crop handling

Scan from several base/wrist viewpoints with calibrated lighting before touching
foliage. No visible fruit means unknown coverage if canopy occludes the row.
Retain observation age, pose/calibration, fruit identity, crop, ripeness, depth,
uncertainty, stem/calyx evidence and approach corridor; avoid double-picking from
multiple views. Detect ripe fruit and the correct peduncle independently. Net
crossings and a fruit behind a strand need a verified alternate approach; never
pull the fruit through the net or mistake the main stem for a cutting target.

Leaf interaction is disabled by default. Qualify a separate compliant guarded
leaf paddle with force/torque feedback, displacement/travel and duration limits,
plant-specific damage trials, net/tendril entanglement detection and retreat
clearance. Do not use the cutting jaw to search blindly. Undetected fruit,
uncertain stem, excessive force, blocked view or unqualified crop -> defer and
mark the row for a later viewpoint or human inspection. Never infer harvest
success solely from a gripper command or simulated fruit disappearance.

Cucumber: support its body, isolate the peduncle, cut with an enclosed mechanism,
confirm separation/retention, then place with low drop height. Tomato: support
one fruit with pressure-limited pads and a verified individual pedicel tool;
retain neighboring fruit/truss. Do not assume the same jaws, gripping force,
ripeness model or cutter motion work for both crops. Clean contact parts and
cutters with an approved crop/food sanitation process between required batches.

## Measurements required before procurement and actuation

- Smallest actual lane profile, gate width/height, external headland dimensions,
  column/brace locations, drainage/flood level and emergency access.
- Wet/dry bearing and traction tests; slope, rut depth, wheel loading, sinkage,
  braking distance and stability through fully extended arm poses.
- Fruit size/mass distribution by stage, reach distribution, peduncle geometry,
  permissible gripping/leaf forces, cut force, drop height and storage bruising.
- Crate dimensions/tare/load/fill/cleaning limits; full/empty logistics and return
  energy reserve; access for manual recovery and lifting a disabled platform.
- Sensor detection limits in sun/shadow, condensation and occlusion; calibration,
  fault injection and independent stop/watchdog validation.
- Budget, component availability, maintainability and a reviewed bill of materials,
  drawings, tolerances, wiring, guards and risk assessment before manufacture.

## Primary references and their limits

- <a href="https://www.wur.nl/upload_mm/5/5/7/c221711e-98da-4865-805a-8fc8531aa624_flyer_cucumber%20harvesting_robot_uk.pdf" target="_blank" rel="noopener noreferrer">Wageningen autonomous cucumber harvester</a>: integrated vehicle, sensing and gripping/cutting; not a fit proof for this farm.
- <a href="https://doi.org/10.1002/rob.21937" target="_blank" rel="noopener noreferrer">SWEEPER field study</a>: occlusion and crop conditions constrain actual harvest success; logistics is part of the cycle.
- <a href="https://arxiv.org/abs/2409.17389" target="_blank" rel="noopener noreferrer">Safe Leaf Manipulation for Accurate Shape and Pose Estimation of Occluded Fruits</a>: research into planned leaf displacement; no cultivar-independent force guarantee.
- <a href="https://www.bogaertsgl.com/index.php/qii-drive-l" target="_blank" rel="noopener noreferrer">Bogaerts Qii-Drive L</a>: examples of powered greenhouse crate logistics on prepared pipe rails; no claim that this farm already has such rails.
- <a href="https://www.universal-robots.com/products/ur3e/" target="_blank" rel="noopener noreferrer">UR3e manufacturer specifications</a>: reference reach/payload scale; final selection and payload/CoG checks remain open.
- <a href="https://www.iso.org/standard/62659.html" target="_blank" rel="noopener noreferrer">ISO agricultural machinery safety catalogue</a>: the 2018 edition points to the newer 18497 series. Applicable current parts and local requirements must be reviewed by the hardware safety owner; citing a standard is not compliance.
