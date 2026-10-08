export const SECTIONS = [
  { id: "arrival", index: "01", label: "Arrival" },
  { id: "problem", index: "02", label: "Problem" },
  { id: "inspiration", index: "03", label: "Inspiration" },
  { id: "body", index: "04", label: "Architecture" },
  { id: "architecture", index: "05", label: "Architecture" },
  { id: "twin", index: "06", label: "Digital twin" },
  { id: "challenge", index: "07", label: "Challenge" },
  { id: "health", index: "08", label: "System health" },
  { id: "skills", index: "09", label: "Decision" },
  { id: "vision", index: "10", label: "Oman 2040" },
  { id: "prototype", index: "11", label: "Prototype" },
  { id: "lab", index: "12", label: "What if" },
  { id: "matters", index: "13", label: "Why it matters" },
  { id: "limits", index: "14", label: "Limitations" },
  { id: "finale", index: "15", label: "Balance" },
];

export const ORGANS = [
  {
    id: "brain",
    name: "Brain",
    biological: "Sense, then compare, then decide.",
    principle: "Sense, then decide where the need is.",
    design: "Read water, energy, heat, waste, and conditions before anything is moved.",
    application: "Central intelligence",
    environment: "Environmental intelligence",
    future: "Adaptive control of the whole system",
    biology:
      "The cerebral hemispheres, brainstem, and cerebellum turn sensation into a decision.",
    interpretation:
      "In the prototype, the brain is the intelligence layer. It receives signals from the rest of the body and decides where resources are most urgently needed.",
    oman: "Environmental awareness, critical thinking, and decision-making.",
    functions: ["Sensing", "Comparison", "Decision", "Adaptive control"],
    system: "Signals are compared before a resource is moved.",
  },
  {
    id: "heart",
    name: "Heart",
    biological: "Blood enters, crosses the chambers, and leaves through the great vessels.",
    principle: "Resources should flow through a system, not disappear into it.",
    design: "Circulate water, energy, and recovered materials toward demand.",
    application: "Resource circulation",
    environment: "Resource circulation",
    future: "Infrastructure that keeps water, energy, and materials moving",
    biology:
      "The heart receives blood through the atria, pumps it from the ventricles, and sends it through the aorta and pulmonary vessels.",
    interpretation:
      "Instead of blood, the prototype circulates resources. They travel through the body and return where they can, rather than being supplied once and discarded.",
    oman: "Water, energy, and recovered materials under changing demand.",
    functions: ["Atria and ventricles", "Pulmonary route", "Systemic route"],
    system: "Resources are directed toward the part of the system under load.",
  },
  {
    id: "lungs",
    name: "Lungs",
    biological: "Air reaches the lungs through the trachea and bronchi.",
    principle: "A large exchange in a compact structure.",
    design: "Monitor air quality, carbon dioxide, and emissions, then respond.",
    application: "Air and carbon management",
    environment: "Air quality and carbon management",
    future: "Exchange with the atmosphere",
    biology:
      "The trachea divides into the bronchi and supplies the right and left lungs, where gas is exchanged.",
    interpretation:
      "The lungs exchange gases across a huge surface inside a small volume. The prototype uses that principle for air and carbon, and shows the movement of gases through the lungs.",
    oman: "Air quality and emissions.",
    functions: ["Trachea", "Bronchi", "Paired lungs"],
    system: "The model treats air as an exchange with the surroundings.",
  },
  {
    id: "kidneys",
    name: "Kidneys",
    biological: "Selective filtration and recovery.",
    principle: "Selective recovery, not simple filtration.",
    design: "Separate reusable water, recoverable materials, and concentrated waste.",
    application: "Water recovery",
    environment: "Water recovery and conservation",
    future: "Adaptive water management",
    biology:
      "The kidneys continuously filter blood and selectively retain substances the body needs while removing waste.",
    interpretation:
      "The kidneys do not remove everything. They keep what the body still needs. The prototype asks the same question of used water.",
    oman: "Water security.",
    functions: ["Filtration", "Selective reabsorption", "Waste"],
    system: "The aim is to recover what still has value before anything is discarded.",
  },
  {
    id: "liver",
    name: "Liver",
    biological: "Substances are transformed before they are stored, used, or released.",
    principle: "Can this waste become a resource?",
    design: "Separate a waste stream into what can return to use and what cannot.",
    application: "Waste transformation",
    environment: "Waste transformation",
    future: "A circular material system",
    biology:
      "The liver processes what arrives from digestion and circulation, transforming compounds rather than only passing them on.",
    interpretation:
      "The liver transforms what would otherwise remain harmful or useless. The prototype treats waste as a possible resource, not an automatic endpoint.",
    oman: "Circular economy and material recovery.",
    functions: ["Processing", "Transformation", "Return to circulation"],
    system: "The system tries to transform waste before it leaves.",
  },
  {
    id: "digestive",
    name: "Digestive system",
    biological: "Food is received, moved, and broken into what the body can use.",
    principle: "Take in, sort, and pass on.",
    design: "Sort incoming material before deciding what returns to use.",
    application: "Material sorting",
    environment: "Food and resource circularity",
    future: "Nothing useful is discarded unnecessarily",
    biology:
      "The stomach and the small and large intestines move and process what the body takes in.",
    interpretation:
      "A resource system can sort incoming material instead of treating the whole stream as one thing.",
    oman: "Resource efficiency.",
    functions: ["Stomach", "Small intestine", "Large intestine"],
    system: "Incoming material is sorted before it is stored or released.",
  },
  {
    id: "skin",
    name: "Skin",
    biological: "The body surface protects and takes part in thermal regulation.",
    principle: "The outer layer answers the climate.",
    design: "Increase cooling and protection as heat and sunlight rise. Ease both when the load falls.",
    application: "Adaptive protection",
    environment: "Adaptive climate control",
    future: "Infrastructure that answers heat instead of running at full load",
    biology:
      "Skin is the living boundary. It protects the interior and participates in how heat leaves the body.",
    interpretation:
      "Skin protects and helps regulate temperature. The prototype’s outer layer would do the same, so the system does not run at full cooling all the time.",
    oman: "Heat and strong sunlight.",
    functions: ["Protection", "Thermal boundary", "Exchange with the climate"],
    system: "The boundary decides how hard circulation and water must work.",
  },
  {
    id: "skeleton",
    name: "Skeleton",
    biological: "The structure that carries every other part of the body.",
    principle: "Support before ornament.",
    design: "The frame has to hold circulation, recovery, and exchange at once.",
    application: "Resilient infrastructure",
    environment: "Resilient infrastructure",
    future: "A structure that supports every other system",
    biology: "The skull, spine, rib cage, pelvis, and limbs hold the organs in place and carry their loads.",
    interpretation: "When the skeleton is revealed, it reads as the infrastructure the rest of the system depends on.",
    oman: "Systems that have to keep working as conditions change.",
    functions: ["Spine", "Rib cage", "Pelvis", "Limbs"],
    system: "The structure remains while the flows change.",
  },
];

export const SYSTEM_MAP = [
  ["Brain", "Intelligence"],
  ["Heart", "Resource circulation"],
  ["Lungs", "Air / carbon"],
  ["Kidneys", "Water recovery"],
  ["Liver", "Waste transformation"],
  ["Skin", "Thermal regulation"],
  ["Digestive system", "Resource circularity"],
  ["Skeleton", "Resilient infrastructure"],
];

export const NEPHRON_STEPS = [
  {
    id: "kidney",
    title: "Kidney",
    text: "Each kidney filters blood and forms urine. The vessels enter at the hilum. The ureters carry urine away.",
  },
  {
    id: "nephron",
    title: "Nephron",
    text: "The working unit is the nephron: a glomerulus for filtration and a tubule for recovery.",
  },
  {
    id: "filtration",
    title: "Filtration",
    text: "Blood pressure pushes water and small solutes from the glomerular capillaries into the capsule. Cells and large proteins stay in the blood.",
  },
  {
    id: "reabsorption",
    title: "Selective reabsorption",
    text: "The tubule returns most of the water and the solutes the body still needs. Recovery is selective, not total.",
  },
  {
    id: "waste",
    title: "Waste",
    text: "What is not recovered continues toward the collecting duct and leaves through the ureter.",
  },
  {
    id: "recovery",
    title: "Water recovery",
    text: "The invention reads the same sequence as a water-recovery system: keep what can be reused, then release what cannot.",
  },
];

export const PRESSURES = [
  {
    id: "water",
    label: "Water security",
    line: "Used water is not automatically waste. Recovery has to choose what returns.",
    organ: "kidneys",
  },
  {
    id: "energy",
    label: "Energy demand",
    line: "Circulation has to carry water, energy, and recovered material to the place under load.",
    organ: "heart",
  },
  {
    id: "heat",
    label: "Extreme heat",
    line: "Heat should raise cooling only as far as the conditions require.",
    organ: "skin",
  },
  {
    id: "consumption",
    label: "Resource consumption",
    line: "Information has to become a decision, or the rest of the system cannot respond.",
    organ: "brain",
  },
  {
    id: "waste",
    label: "Waste",
    line: "A waste stream may still contain something that can return to use.",
    organ: "liver",
  },
  {
    id: "environment",
    label: "Environmental pressure",
    line: "Air quality, carbon dioxide, and emissions are part of the exchange.",
    organ: "lungs",
  },
];

export const MODULES = [
  {
    id: "sensors",
    role: "Sense",
    title: "Environmental sensors",
    text: "Read water, energy, heat, air, and materials before a decision is made.",
  },
  {
    id: "intelligence",
    role: "Decide",
    title: "Intelligence layer",
    text: "Compare what is sensed with what the system can spare.",
  },
  {
    id: "distribution",
    role: "Distribute",
    title: "Resource distribution",
    text: "Move resources toward the places under load.",
  },
  {
    id: "recovery",
    role: "Recover",
    title: "Recovery systems",
    text: "Return what is useful. Release what is not.",
  },
  {
    id: "feedback",
    role: "Adapt",
    title: "Feedback loop",
    text: "Send the result back to the sensors. The next decision changes.",
  },
];

export const SCENARIOS = [
  {
    id: "water",
    code: "A",
    title: "Water demand rises",
    detail: "Water demand rises while energy is already under pressure. Recovery can help, and it will ask more of the circulation.",
    shock: { waterDemand: 32, heat: 8 },
  },
  {
    id: "heat",
    code: "B",
    title: "Extreme heat increases",
    detail: "Temperature load climbs. Water and energy are pulled into cooling together.",
    shock: { heat: 28, energyDemand: 12, waterDemand: 10 },
  },
  {
    id: "energy",
    code: "C",
    title: "Energy demand rises",
    detail: "Movement, treatment, and cooling ask for more energy than the current mix is offering.",
    shock: { energyDemand: 30 },
  },
  {
    id: "waste",
    code: "D",
    title: "Waste generation increases",
    detail: "More material leaves use. The question is whether any of it comes back.",
    shock: { wasteIn: 42 },
  },
  {
    id: "limited",
    code: "E",
    title: "A resource becomes limited",
    detail: "Storage and renewable supply both tighten while demand continues.",
    shock: { storage: -22, renewable: -18, waterDemand: 18, energyDemand: 26 },
  },
];

export const ACTIONS = [
  {
    id: "recovery",
    label: "Improve recovery",
    note: "Return useful water and material before anything is released.",
  },
  {
    id: "renewable",
    label: "Increase renewable energy",
    note: "Shift more of the energy mix toward a renewable contribution.",
  },
  {
    id: "reduce",
    label: "Reduce consumption",
    note: "Lower what is asked of the system. Less demand is also less service.",
  },
  {
    id: "efficiency",
    label: "Improve efficiency",
    note: "Do the same work with less throughput. The gain is modest.",
  },
  {
    id: "storage",
    label: "Increase storage",
    note: "Hold a reserve. Storage buffers a shortage. It does not transform waste.",
  },
  {
    id: "distribution",
    label: "Redesign distribution",
    note: "Send resources toward load instead of along one fixed route.",
  },
  {
    id: "innovation",
    label: "Invest in innovation",
    note: "Spend energy now to raise the system’s later capacity to adapt.",
  },
];

export const SKILLS = [
  {
    id: "critical",
    name: "Critical thinking",
    effect: "Ask what the choice costs, not only what it improves.",
  },
  {
    id: "problem",
    name: "Problem solving",
    effect: "Name the pressure first. Recovery will not cool a heat crisis by itself.",
  },
  {
    id: "innovation",
    name: "Innovation",
    effect: "A new method can raise later capacity while spending energy now.",
  },
  {
    id: "decision",
    name: "Decision making",
    effect: "Choose with the trade-off in view. The challenge allows two actions, not all of them.",
  },
  {
    id: "systems",
    name: "Systems thinking",
    effect: "Understand how changing one resource affects the entire system.",
  },
  {
    id: "adapt",
    name: "Adaptability",
    effect: "A decision that eased the last scenario can be the wrong one for heat.",
  },
  {
    id: "collab",
    name: "Collaboration",
    effect: "Distribution works when the parts agree where a resource should go.",
  },
  {
    id: "enviro",
    name: "Environmental awareness",
    effect: "Heat, air, and water are one condition. The surroundings sit inside the decision.",
  },
];

export const VISION = [
  {
    id: "environment",
    title: "Environmental sustainability",
    text: "Air, heat, and emissions are conditions the system senses and answers, not costs left outside it.",
    organ: "lungs",
  },
  {
    id: "water",
    title: "Water security",
    text: "Selective recovery keeps reusable water in circulation and concentrates what cannot return.",
    organ: "kidneys",
  },
  {
    id: "renewable",
    title: "Renewable energy",
    text: "When recovery or cooling asks for more energy, the circulation has to answer without treating that demand as free.",
    organ: "heart",
  },
  {
    id: "efficiency",
    title: "Resource efficiency",
    text: "Distribution and exchange are meant to spend less for the same balance.",
    organ: "heart",
  },
  {
    id: "circular",
    title: "Circular economy",
    text: "Waste is asked a question before it leaves: can any of it become a resource?",
    organ: "liver",
  },
  {
    id: "innovation",
    title: "Innovation",
    text: "The intelligence layer is a place to test decisions before they are built at scale.",
    organ: "brain",
  },
  {
    id: "skills",
    title: "Future skills",
    text: "The visitor is the brain of the prototype. Green skills are how that decision is made.",
    organ: "brain",
  },
  {
    id: "technology",
    title: "Technological development",
    text: "The human figure is the proposed physical architecture. This exhibition model is not an operating utility.",
    organ: "skin",
  },
];

export const LAYERS = [
  {
    id: "shell",
    name: "Outer shell",
    text: "The outer body of the prototype. Transparent sections would let a visitor see the systems working inside.",
  },
  {
    id: "sensors",
    name: "Sensors",
    text: "Points that stand in for sensing water, energy, heat, air, and material flow.",
  },
  {
    id: "control",
    name: "Intelligence",
    text: "The decision layer. It does not store the resource. It directs it.",
  },
  {
    id: "circulation",
    name: "Circulation",
    text: "Pathways that move resources toward demand instead of along one fixed route.",
  },
  {
    id: "recovery",
    name: "Water recovery",
    text: "Selective water recovery. Reusable water, recoverable material, and concentrated waste are not the same stream.",
  },
  {
    id: "exchange",
    name: "Air exchange",
    text: "Air and carbon exchange, using the lung principle of a large surface inside a compact volume.",
  },
  {
    id: "circular",
    name: "Waste processing",
    text: "A waste stream enters and is separated into what can return to use and what cannot.",
  },
];

export const PHASES = {
  thriving: {
    label: "Thriving",
    line: "The system is ahead of its load. Circulation, recovery, and cooling are in balance.",
  },
  resilient: {
    label: "Resilient",
    line: "Balance holds. A new demand can be absorbed without breaking the pattern.",
  },
  recovering: {
    label: "Recovering",
    line: "Recovery is underway. Useful material is returning to circulation.",
  },
  stressed: {
    label: "Stressed",
    line: "The system is stressed. A shortage in one resource is pulling on the others.",
  },
  critical: {
    label: "Imbalance",
    line: "Reserves are thin and the parts are no longer supporting one another. A different decision is required.",
  },
};

export const LAB_FIELDS = [
  { key: "waterDemand", label: "Water demand", note: "How much water the system is asked to deliver." },
  { key: "energyDemand", label: "Energy demand", note: "How much energy movement, cooling, and process require." },
  { key: "heat", label: "Temperature", note: "Heat load. It raises the need for both water and energy." },
  { key: "wasteIn", label: "Waste generation", note: "Material leaving use before any recovery." },
  { key: "recovery", label: "Recovery efficiency", note: "How much useful water and material is returned. This draws energy." },
  { key: "renewable", label: "Renewable contribution", note: "Share of energy the model treats as renewable." },
];

export const READOUTS = [
  { key: "water", label: "Water", hint: "Available to circulate", tone: "water" },
  { key: "energy", label: "Energy", hint: "Available to move the system", tone: "energy" },
  { key: "heat", label: "Temperature", hint: "Heat load on the system", tone: "heat" },
  { key: "air", label: "Air", hint: "Quality of exchange", tone: "air" },
  { key: "materials", label: "Materials", hint: "Useful matter in circulation", tone: "materials" },
];
