const ANNOTATION = /\.t$|\.t'|surface of|border of|impression of|fissure of|notch of|groove for|facet of|fossa for|tuberosity of|curvature of|pole of|hilum of|apex of|base of|fundus of/i;

const HEART = /heart|atrium|ventricle|auricle|papillary muscle|semilunar leaflet|pulmonary valve|aortic valve|valvular complex|septum|coronary|circumflex artery of heart|arteries of heart|vein of left ventricle|vein of right ventricle/i;

const BRAIN = /cerebr|cerebell|brainstem|brain|hemisphere|thalamus|hypothalamus|pons|medulla oblongata|midbrain|diencephalon|corpus callosum|gyrus|sulcus|vermis|lobule of cereb|insula|fornix of cerebr|pineal|pituitary/i;

export function classifyMesh(source, name) {
  const label = name || "";
  if (ANNOTATION.test(label) || label.includes(".j")) return null;

  if (source === "regions") return /skin|region/i.test(label) ? "body" : null;

  if (source === "skeletal") {
    if (/cavity|aperture|space|inlet|outlet|angle|linea terminalis/i.test(label) && !/bone|rib|vertebra|cranium|pelvis/i.test(label)) {
      return null;
    }
    return "skeleton";
  }

  if (source === "nervous") return BRAIN.test(label) ? "brain" : null;

  if (source === "cardio") return HEART.test(label) ? "heart" : "vascular";

  if (source === "visceral") {
    if (/lung|bronch|trachea|tracheobronchial/i.test(label)) return "lungs";
    if (/kidney|ureter|renal/i.test(label)) return "kidneys";
    if (/liver|hepatic|gallbladder/i.test(label)) return "liver";
    if (/stomach|intestin|colon|duoden|jejun|ileum|oesophag|esophag|pancreas|mesocolon/i.test(label)) return "digestive";
    return "other";
  }

  return null;
}

export function organForRole(role) {
  if (role === "body") return "skin";
  if (role === "vascular") return "heart";
  if (role === "skeleton") return "skeleton";
  if (role === "other") return null;
  return role;
}
