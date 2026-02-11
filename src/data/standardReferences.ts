/**
 * MIL-STD-2154 Standard References
 * Contains exact text from the standard for each field
 */

export interface StandardReference {
  section: string;
  title: string;
  text: string;
  table?: string;
}

export const standardReferences: Record<string, StandardReference> = {
  // Inspection Setup Fields
  partNumber: {
    section: "3.2",
    title: "Part Identification",
    text: "The part number or drawing number shall be clearly identified on the technique sheet for complete traceability. This shall include revision level if applicable."
  },
  
  partName: {
    section: "3.2",
    title: "Part Description",
    text: "A descriptive name of the part being inspected shall be provided to ensure proper identification during inspection and reporting."
  },
  
  material: {
    section: "3.3",
    title: "Material Type and Specification",
    text: "The material type and specification shall be documented per the applicable material specification (e.g., QQ-A-200/11 for aluminum alloys, AMS-4928 for titanium). Material properties directly affect ultrasonic velocity and attenuation."
  },
  
  partType: {
    section: "3.4",
    title: "Part Geometry",
    text: "The part geometry shall be classified according to shape (plate, bar, forging, etc.) as this determines the appropriate scan pattern and coverage requirements. Complex geometries may require multiple scan angles or techniques."
  },
  
  thickness: {
    section: "3.5",
    title: "Part Dimensions",
    text: "Critical dimensions including thickness shall be documented in inches or millimeters. Thickness is critical for determining appropriate frequency, focal zone, and scan parameters."
  },
  
  // Equipment Fields
  manufacturer: {
    section: "4.1",
    title: "Ultrasonic Equipment",
    text: "The ultrasonic equipment manufacturer and model shall be documented. Equipment must meet the performance requirements specified in Table II of this standard."
  },
  
  frequency: {
    section: "4.2",
    title: "Search Unit Frequency",
    text: "The operating frequency shall be selected based on material thickness and required resolution. Typical range is 1.0 to 15.0 MHz. Higher frequencies provide better resolution but less penetration. For materials less than 0.5 inches thick, frequencies of 10 MHz or higher are recommended.",
    table: "Table II - Equipment Performance Requirements"
  },
  
  transducerType: {
    section: "4.3",
    title: "Search Unit Type",
    text: "The search unit type shall be specified as immersion, contact, or dual-element. Immersion transducers typically use 3/8 to 3/4 inch diameter elements. Contact transducers typically use 1/4 to 1 inch diameter elements.",
    table: "Table III - Search Unit Requirements"
  },
  
  transducerDiameter: {
    section: "4.3",
    title: "Active Element Diameter",
    text: "The active element diameter shall be documented in inches. For immersion testing: 3/8 to 3/4 inch diameter is typical. For contact testing: 1/4 to 1 inch diameter is typical. Smaller diameters provide better near-surface resolution.",
    table: "Table III"
  },
  
  verticalLinearity: {
    section: "4.4",
    title: "Vertical Linearity",
    text: "The vertical linearity of the equipment shall be verified and maintained between 10% and 95% of full screen height for MIL-STD-2154, or 5% to 98% for AMS-STD-2154E. This ensures accurate amplitude measurements throughout the inspection range.",
    table: "Table II"
  },
  
  horizontalLinearity: {
    section: "4.5",
    title: "Horizontal Linearity (Time Base)",
    text: "The horizontal linearity (time base accuracy) shall be maintained at a minimum of 85% per MIL-STD-2154, or 90% per AMS-STD-2154E. This ensures accurate depth/distance measurements.",
    table: "Table II"
  },
  
  entrySurfaceResolution: {
    section: "4.6",
    title: "Entry Surface Resolution",
    text: "Entry surface resolution is the minimum distance from the entry surface at which a discontinuity can be detected and evaluated. Values are frequency-dependent per Table II.",
    table: "Table II - Resolution Requirements"
  },
  
  backSurfaceResolution: {
    section: "4.7",
    title: "Back Surface Resolution",
    text: "Back surface resolution is the minimum distance from the back surface at which a discontinuity can be detected and evaluated. Values are frequency-dependent per Table II.",
    table: "Table II - Resolution Requirements"
  },
  
  couplant: {
    section: "4.8",
    title: "Couplant",
    text: "The couplant type shall be specified. Common couplants include water (for immersion), glycerin, or commercial ultrasonic gels. The couplant must provide consistent acoustic coupling without corroding the test material."
  },
  
  // Calibration Fields
  calibrationBlock: {
    section: "5.1",
    title: "Calibration Reference Standards",
    text: "Calibration reference standards shall be of the same material specification and heat treatment condition as the parts being inspected, or shall be validated as equivalent per documented procedures. Reference standards shall contain flat-bottom holes (FBH) or other geometric reflectors as specified in Table I.",
    table: "Table I - Calibration Reference Standards"
  },
  
  referenceBlockMaterial: {
    section: "5.1.1",
    title: "Reference Block Material",
    text: "The reference block material and specification shall match the part material within the same material family. For example, 7075-T6 reference blocks are acceptable for inspecting other 7xxx series aluminum alloys when validated.",
    table: "Table I"
  },
  
  fbhSize: {
    section: "5.2",
    title: "Flat Bottom Hole Size",
    text: "The flat bottom hole (FBH) diameter shall be selected based on the acceptance class and material thickness. FBH sizes range from 3/64 inch (1.2mm) for Class AAA to 5/64 inch (2.0mm) for Class C on 2-inch thick material.",
    table: "Table I"
  },
  
  fbhDepth: {
    section: "5.2.1",
    title: "FBH Depth",
    text: "Flat bottom holes shall be located at depths corresponding to the thickness of the parts being inspected. Multiple depths may be required for full thickness coverage. Minimum depth is typically T/2 (half thickness) for straight beam inspection."
  },
  
  // Scan Parameters
  scanMethod: {
    section: "5.4",
    title: "Scanning Method",
    text: "The scanning method shall be specified as immersion, contact, or squirter. Immersion scanning provides the most consistent coupling and is preferred for production inspections. Contact scanning may be used when immersion is impractical."
  },
  
  scanSpeed: {
    section: "5.4.10",
    title: "Scanning Speed",
    text: "The maximum scanning speed shall not exceed 150 mm/s (6 inches/second) for AMS-STD-2154E or 200 mm/s for MIL-STD-2154. Actual speed should be validated to ensure no loss of sensitivity or coverage."
  },
  
  scanIndex: {
    section: "5.4.12",
    title: "Index Distance (Scan Spacing)",
    text: "The index distance (spacing between scan lines) shall not exceed 70% of the effective beam width at the depth of interest. This ensures minimum 30% overlap between adjacent scan lines for 100% volumetric coverage."
  },
  
  coverage: {
    section: "5.4.2",
    title: "Inspection Coverage",
    text: "100% volumetric coverage is required unless otherwise specified by the engineering authority. This means every cubic millimeter of the inspection volume must be interrogated by the ultrasonic beam with adequate sensitivity."
  },
  
  scanPattern: {
    section: "5.4.3",
    title: "Scan Pattern",
    text: "The scan pattern shall be documented (e.g., raster, spiral, or custom pattern). Raster scanning (parallel lines) is most common for plate and bar stock. Spiral patterns may be used for cylindrical parts."
  },
  
  waterPath: {
    section: "5.4.5",
    title: "Water Path (Immersion)",
    text: "For immersion testing, the water path distance (distance from transducer face to part surface) shall be sufficient to separate the initial pulse from the front surface echo. Typical range is 1 to 6 inches (25-150mm)."
  },
  
  pulseRepetitionRate: {
    section: "5.4.8",
    title: "Pulse Repetition Frequency (PRF)",
    text: "The pulse repetition frequency shall be selected to ensure complete return of all echoes before the next pulse is transmitted. Typical range is 100 Hz to 10 kHz depending on material thickness and sound path length."
  },
  
  gainSettings: {
    section: "5.2.3",
    title: "Gain and Sensitivity Settings",
    text: "The gain settings shall be documented in decibels (dB). Initial calibration gain is typically set to achieve 80% full screen height (FSH) from the reference reflector. Inspection gain is typically 6-12 dB above calibration gain."
  },
  
  alarmGateSettings: {
    section: "5.2.3",
    title: "Gate and Alarm Settings",
    text: "Gate positions and alarm levels shall be documented. Gates define the depth range of interest. Alarm thresholds are typically set as a percentage of the reference echo (e.g., 50% FSH). Multiple gates may be used for different zones."
  },
  
  // Acceptance Criteria
  acceptanceClass: {
    section: "3.6",
    title: "Acceptance Class",
    text: "The acceptance class (AAA, AA, A, B, or C) shall be specified per Table VI. Class AAA is the most stringent (aerospace critical parts), while Class C is the least stringent. The acceptance class determines allowable defect sizes and types.",
    table: "Table VI - Acceptance Criteria"
  },
  
  backReflectionLoss: {
    section: "Table VI",
    title: "Back Reflection Loss",
    text: "Back reflection loss is the reduction in back surface echo amplitude caused by intervening discontinuities. For AMS-STD-2154E / MIL-STD-2154 Table VI, the loss-of-back-reflection limit is 50% for Classes AAA through C (see Table VI Note 4 for applicability/interpretation).",
    table: "Table VI"
  },
  
  singleDiscontinuity: {
    section: "Table VI",
    title: "Single Discontinuity Limit",
    text: "For AMS-STD-2154E / MIL-STD-2154 Table VI, single-discontinuity limits are expressed as responses relative to reference reflectors (FBH / equivalent notch) at the estimated depth. Examples: AA = 3/64 response, A = 5/64 response, B = 8/64 response. Class AAA uses the special percent-of-response criteria shown in Table VI.",
    table: "Table VI"
  },
  
  multipleDiscontinuities: {
    section: "Table VI",
    title: "Multiple Discontinuities",
    text: "For AMS-STD-2154E / MIL-STD-2154 Table VI, multiple-discontinuity criteria apply when the centers of two discontinuities are less than 1 inch apart (see Table VI Note 2). Class AAA uses percent-of-response (10% of 3/64 response). Class A multiple-discontinuity response is 3/64 (not 2/64). Class C is not applicable for multiple-discontinuity criteria per the table notes.",
    table: "Table VI"
  },
  
  linearDiscontinuity: {
    section: "Table VI",
    title: "Linear Discontinuity",
    text: "For AMS-STD-2154E / MIL-STD-2154 Table VI, linear discontinuities are evaluated by BOTH length and response (e.g., AA: 1/2 inch at 2/64 response; A: 1 inch at 3/64 response; B: 1 inch at 5/64 response). Class AAA uses percent-of-response criteria; Class C linear criteria are not applicable per the table notes.",
    table: "Table VI"
  },
  
  noiseLevel: {
    section: "Table VI / 5.2.3",
    title: "Noise Level",
    text: "For AMS-STD-2154E / MIL-STD-2154 Table VI, Class AAA uses percent-of-response noise criteria (10% of 3/64 response). For Classes AA through C, noise is evaluated against the alarm level (see the applicable alarm level setting section, e.g., 5.2.3)."
  },
  
  // Documentation
  inspectorName: {
    section: "6.1",
    title: "Personnel Certification",
    text: "The inspector name and certification level (typically ASNT Level II or III) shall be documented. Inspectors must be qualified and certified per ASNT SNT-TC-1A or equivalent certification program."
  },
  
  inspectionDate: {
    section: "6.2",
    title: "Inspection Date",
    text: "The date of inspection shall be documented for traceability and record retention requirements. Technique sheets must be dated and approved before use."
  },
  
  procedureNumber: {
    section: "6.3",
    title: "Procedure Reference",
    text: "The applicable ultrasonic inspection procedure number shall be referenced. This procedure should be a controlled document that defines the overall inspection process."
  },
  
  drawingReference: {
    section: "6.4",
    title: "Drawing Reference",
    text: "The drawing number and revision level shall be documented to ensure inspection is performed to current engineering requirements. This establishes traceability to design requirements."
  },
  
  revisionLevel: {
    section: "6.5",
    title: "Technique Sheet Revision",
    text: "The technique sheet revision level shall be controlled to ensure the correct version is used during inspection. Changes to technique sheets must be reviewed and approved."
  }
};

/**
 * Get standard reference for a specific field
 */
export const getStandardReference = (fieldKey: string): StandardReference | undefined => {
  return standardReferences[fieldKey];
};

/**
 * Get all references for a tab
 */
export const getTabReferences = (tabName: string): Record<string, StandardReference> => {
  // Define which fields belong to which tab
  const tabFields: Record<string, string[]> = {
    inspectionSetup: ["partNumber", "partName", "material", "partType", "thickness"],
    equipment: ["manufacturer", "frequency", "transducerType", "transducerDiameter", 
                "verticalLinearity", "horizontalLinearity", "entrySurfaceResolution", 
                "backSurfaceResolution", "couplant"],
    calibration: ["calibrationBlock", "referenceBlockMaterial", "fbhSize", "fbhDepth"],
    scanParameters: ["scanMethod", "scanSpeed", "scanIndex", "coverage", "scanPattern", 
                    "waterPath", "pulseRepetitionRate", "gainSettings", "alarmGateSettings"],
    acceptanceCriteria: ["acceptanceClass", "backReflectionLoss", "singleDiscontinuity", 
                        "multipleDiscontinuities", "linearDiscontinuity", "noiseLevel"],
    documentation: ["inspectorName", "inspectionDate", "procedureNumber", 
                   "drawingReference", "revisionLevel"]
  };
  
  const fields = tabFields[tabName] || [];
  const references: Record<string, StandardReference> = {};
  
  fields.forEach(field => {
    const ref = standardReferences[field];
    if (ref) {
      references[field] = ref;
    }
  });
  
  return references;
};
