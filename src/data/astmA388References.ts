/**
 * ASTM A388/A388M Standard References
 * Contains exact text from the standard for ultrasonic examination of heavy steel forgings
 */

export interface StandardReference {
  section: string;
  title: string;
  text: string;
  table?: string;
}

export const astmA388References: Record<string, StandardReference> = {
  // Scope and Application
  scope: {
    section: "1.1",
    title: "Scope",
    text: "This practice covers the examination procedures for the contact, pulse-echo ultrasonic examination of heavy steel forgings by the straight- and angle-beam techniques. The straight-beam techniques include utilization of the DGS (Distance Gain Size) method."
  },

  // Part Identification
  partNumber: {
    section: "9.1.2",
    title: "Part Identification",
    text: "For the purpose of reporting the locations of recordable indications, a sketch shall be prepared showing the physical outline of the forging including the purchaser's drawing number, the purchaser's order number, and the manufacturer's serial number."
  },

  partName: {
    section: "3.1",
    title: "Forging Description",
    text: "The forging type and description shall be documented to identify the specific part being examined. This includes whether it is a disk, ring, cylinder, or other forging configuration."
  },

  // Material
  material: {
    section: "3.1.1.1",
    title: "Material Type and Specification",
    text: "The material specification shall be documented. This practice is applicable to carbon steel, low-alloy steel, and austenitic stainless steel forgings. Heavy austenitic stainless steel forgings are more difficult to penetrate ultrasonically than similar carbon or low-alloy steel forgings."
  },

  // Equipment Requirements
  manufacturer: {
    section: "4.1",
    title: "Ultrasonic Instrument",
    text: "An ultrasonic, pulsed, reflection type of instrument shall be used for this examination. The system shall have a minimum capability for examining at frequencies from 1 to 5 MHz. On examining austenitic stainless forgings the system shall have the capabilities for examining at frequencies down to 0.4 MHz."
  },

  frequency: {
    section: "4.1",
    title: "Frequency Range",
    text: "The system shall have a minimum capability for examining at frequencies from 1 to 5 MHz. For austenitic stainless forgings, the system shall have capabilities for examining at frequencies down to 0.4 MHz. Other frequencies may be used if desirable for better resolution, penetrability, or detectability of flaws."
  },

  transducerType: {
    section: "4.2",
    title: "Search Units",
    text: "Search Units having a transducer with a maximum active area of 1 in.² [650 mm²] with 3/4 in. [20 mm] minimum to 1 1/8 in. [30 mm] maximum dimensions shall be used for straight-beam scanning. Search units equipped from 1/2 by 1 in. [13 by 25 mm] to 1 by 1 in. [25 by 25 mm] shall be used for angle-beam scanning."
  },

  transducerDiameter: {
    section: "4.2",
    title: "Transducer Size",
    text: "For straight-beam scanning: 3/4 in. [20 mm] minimum to 1 1/8 in. [30 mm] maximum dimensions. For angle-beam scanning: 1/2 by 1 in. [13 by 25 mm] to 1 by 1 in. [25 by 25 mm]. Transducers shall be utilized at their rated frequencies."
  },

  verticalLinearity: {
    section: "4.1.1",
    title: "Vertical Linearity",
    text: "The ultrasonic instrument shall provide linear presentation (within 5%) for at least 75% of the screen height (sweep line to top of screen). The 5% linearity referred to is descriptive of the screen presentation of amplitude. Instrument linearity shall be verified in accordance with the intent of Practice E 317."
  },

  horizontalLinearity: {
    section: "4.1.1",
    title: "Time Base Linearity",
    text: "Instrument linearity shall be verified in accordance with Practice E 317. Any set of blocks processed in accordance with Practice E 317 or E 428 may be used to establish the specified linearity requirements."
  },

  couplant: {
    section: "4.3",
    title: "Couplants",
    text: "Couplants having good wetting characteristics such as SAE No. 20 or No. 30 motor oil, glycerin, pine oil, or water shall be used. Couplants may not be comparable to one another and the same couplant shall be used for calibration and examination."
  },

  // Calibration
  calibrationBlock: {
    section: "4.4",
    title: "Reference Blocks",
    text: "Reference Blocks containing flat-bottom holes may be used for calibration of equipment and may be used to establish recording levels for straight-beam examination when so specified by the order or contract. A separate calibration standard may be used; however, it shall have the same nominal composition, heat treatment, and thickness as the forging it represents."
  },

  referenceMaterial: {
    section: "7.3.3",
    title: "Calibration Standard Material",
    text: "A separate calibration standard may be used; however, it shall have the same nominal composition, heat treatment, and thickness as the forging it represents. The test surface finish on the calibration standard shall be comparable but no better than the item to be examined."
  },

  fbhSize: {
    section: "S1.1",
    title: "Flat Bottom Hole Sizes",
    text: "The following hole sizes apply: 1/16 in. [1.5 mm] FBH for thicknesses less than 1.5 in. [40 mm], 1/8 in. [3 mm] FBH for thicknesses of 1.5–6 in. [40–150 mm] inclusive, 1/4 in. [6 mm] FBH for thicknesses over 6 in. [150 mm]."
  },

  dgMethod: {
    section: "4.5",
    title: "DGS Method",
    text: "DGS scales, matched to the ultrasonic test unit and transducer to be utilized, may be used to establish recording levels for straight-beam examination. The DGS scale range must be selected to include the full thickness cross-section of the forging to be examined. Overlays are to be serialized to match the ultrasonic transducer and pulse-echo testing system."
  },

  dgCalibration: {
    section: "7.2.2.4",
    title: "DGS Calibration Procedure",
    text: "Choose the appropriate DGS scale for the cross-sectional thickness of the forging to be examined. Place the probe on the forging, adjust the gain to make the first backwall echo appear clearly on the CRT screen. Adjust the gain so the forging backwall echo matches the height of the DGS reference slope within ± 1 dB. Once adjusted, increase the gain by the dB shown on the DGS scale for the reference slope."
  },

  recalibration: {
    section: "7.2.3",
    title: "Recalibration Requirements",
    text: "Any change in the search unit, couplant, instrument setting, or scanning speed from that used for calibration shall require recalibration. Perform a calibration check at least once every 8 h shift. When a loss of 15% or greater in the gain level is indicated, reestablish the required calibration and reexamine all of the material examined in the preceding calibration period."
  },

  // Scanning Procedures
  scanMethod: {
    section: "7.1",
    title: "General Procedure",
    text: "As far as practicable, subject the entire volume of the forging to ultrasonic examination. Forgings may be examined either stationary or while rotating in a lathe or on rollers."
  },

  scanSpeed: {
    section: "7.1.4",
    title: "Scanning Speed",
    text: "For manual scanning, do not exceed a scanning rate of 6 in./s [150 mm/s]. For automated scanning, adjust scanning speed or instrument repetition rate to permit detection of the smallest discontinuities referenced in the specification and to allow the recording or signaling device to function."
  },

  scanIndex: {
    section: "7.1.3",
    title: "Scan Overlap",
    text: "To ensure complete coverage of the forging volume, index the search unit with at least 15% overlap with each pass."
  },

  coverage: {
    section: "7.1.1",
    title: "Coverage Requirements",
    text: "As far as practicable, subject the entire volume of the forging to ultrasonic examination. Because of radii at change of sections and other local configurations, it may be impossible to examine some sections of a forging."
  },

  scanPattern: {
    section: "7.1.6",
    title: "Scan Pattern",
    text: "If possible, scan all sections of forgings in two perpendicular directions."
  },

  straightBeamExamination: {
    section: "7.2",
    title: "Straight-Beam Examination",
    text: "High sensitivity levels are not usually employed when inspecting austenitic steel forgings, due to attendant high level of 'noise' or 'hash' caused by coarse grain structure. During the examination of the forging, monitor the back reflection for any significant reduction in amplitude."
  },

  angleBeamExamination: {
    section: "7.3",
    title: "Angle-Beam Examination",
    text: "Perform the examination from the circumference of rings and hollow forgings that have an axial length greater than 2 in. [50 mm] and an outside to inside diameter ratio of less than 2.0 to 1. Use a 1 MHz, 45 deg angle-beam search unit unless thickness, OD/ID ratio, or other geometric configuration results in failure to achieve calibration."
  },

  // Recording Criteria
  recording: {
    section: "8.1",
    title: "Recording - Straight-Beam",
    text: "Record the following indications as information for the purchaser. These recordable indications do not constitute a rejectable condition unless negotiated as such in the purchase order."
  },

  recordingCriteria: {
    section: "8.1.1",
    title: "Recording Criteria",
    text: "In the back-reflection technique, individual indications equal to or exceeding 10% of the back reflection from an adjacent area free from indications; in the reference-block or DGS technique, indications equal to or exceeding 100% of the reference amplitude."
  },

  continuousIndications: {
    section: "8.1.2",
    title: "Continuous Indications",
    text: "An indication that is continuous on the same plane regardless of amplitude, and found over an area larger than twice the diameter of the search unit. Planar indications shall be considered continuous over a plane if they have a major axis greater than 1 in. [25 mm]."
  },

  backReflectionLoss: {
    section: "8.1.4",
    title: "Back Reflection Loss",
    text: "Reduction in back reflection exceeding 20% of the original measured in increments of 10%."
  },

  angleBeamRecording: {
    section: "8.2",
    title: "Recording - Angle-Beam",
    text: "Record discontinuity indications equal to or exceeding 50% of the indication from the reference line. When an amplitude reference line cannot be generated, record discontinuity indications equal to or exceeding 50% of the reference notch."
  },

  // Quality Levels
  qualityLevels: {
    section: "10.1",
    title: "Quality Levels",
    text: "This practice is intended for application to forgings, with a wide variety of sizes, shapes, compositions, melting processes, and applications. It is, therefore, impracticable to specify an ultrasonic quality level which would be universally applicable to such a diversity of products. Ultrasonic acceptance or rejection criteria for individual forgings should be based on a realistic appraisal of service requirements."
  },

  acceptanceCriteria: {
    section: "10.3",
    title: "Acceptance Quality Levels",
    text: "Acceptance quality levels shall be established between purchaser and manufacturer on the basis of one or more of the following criteria: No indications larger than some percentage of the reference back reflection, No indications equal to or larger than the indication received from the flat-bottom hole in a specific reference block, No areas showing loss of back reflection larger than some percentage of the reference back reflection."
  },

  dgAcceptance: {
    section: "10.3.1.5",
    title: "DGS Method Acceptance",
    text: "No indications exceeding the reference level specified in the DGS method."
  },

  angleBeamAcceptance: {
    section: "10.3.2",
    title: "Angle-Beam Acceptance",
    text: "No indications exceeding a stated percentage of the reflection from a reference notch or of the amplitude reference line."
  },

  // Reporting
  report: {
    section: "9.1",
    title: "Report Requirements",
    text: "Report all recordable indications. For the purpose of reporting the locations of recordable indications, a sketch shall be prepared showing the physical outline of the forging including dimensions of all areas not inspected due to geometric configuration."
  },

  reportInfo: {
    section: "9.1.3",
    title: "Report Information",
    text: "The specification to which the examination was performed as well as the frequency used, method of setting sensitivity, type of instrument, surface finish, couplant, and search unit employed. The inspector's name or identity and date the examination was performed."
  },

  // Personnel
  personnel: {
    section: "5.1",
    title: "Personnel Requirements",
    text: "Personnel performing the ultrasonic examinations to this practice shall be qualified and certified in accordance with a written procedure conforming to Recommended Practice No. SNT-TC-1A or another national standard that is acceptable to both the purchaser and the supplier."
  },

  // Preparation
  preparation: {
    section: "6.1",
    title: "Preparation of Forging",
    text: "Unless otherwise specified in the order or contract, the forging shall be machined to provide cylindrical surfaces for radial examination in the case of round forgings; the ends of the forgings shall be machined perpendicular to the axis of the forging for the axial examination."
  },

  surfaceRoughness: {
    section: "6.2",
    title: "Surface Roughness",
    text: "The surface roughness of exterior finishes shall not exceed 250 μin. [6 μm] unless otherwise shown on the forging drawing or stated in the order or the contract."
  },

  surfaceCondition: {
    section: "6.3",
    title: "Surface Condition",
    text: "The surfaces of the forging to be examined shall be free of extraneous material such as loose scale, paint, dirt, etc."
  },

  // Timing
  inspectionTiming: {
    section: "7.1.2",
    title: "Timing of Examination",
    text: "Perform the ultrasonic examination after heat treatment for mechanical properties (exclusive of stress-relief treatments) but prior to drilling holes, cutting keyways, tapers, grooves, or machining sections to contour."
  },

  // Hollow Forgings
  hollowForgings: {
    section: "7.3.1",
    title: "Hollow Forgings Examination",
    text: "Perform the examination from the circumference of rings and hollow forgings that have an axial length greater than 2 in. [50 mm] and an outside to inside diameter ratio of less than 2.0 to 1."
  },

  centerHoleCompensation: {
    section: "X4.1",
    title: "Center Hole Attenuation",
    text: "The hole in a cylindrical bored forging causes sound scatter. In these cases, a correction is required which depends on the wall thickness and bore diameter. Determine the correction value in dB from the Nomogram."
  }
};

/**
 * Get ASTM A388 standard reference for a specific field
 */
export const getASTMA388Reference = (fieldKey: string): StandardReference | undefined => {
  return astmA388References[fieldKey];
};

/**
 * Get all ASTM A388 references for a tab
 */
export const getASTMA388TabReferences = (tabName: string): Record<string, StandardReference> => {
  const tabFields: Record<string, string[]> = {
    inspectionSetup: ["partNumber", "partName", "material", "preparation", "surfaceRoughness", "surfaceCondition"],
    equipment: ["manufacturer", "frequency", "transducerType", "transducerDiameter", 
                "verticalLinearity", "horizontalLinearity", "couplant"],
    calibration: ["calibrationBlock", "referenceMaterial", "fbhSize", "dgMethod", "dgCalibration", "recalibration"],
    scanParameters: ["scanMethod", "scanSpeed", "scanIndex", "coverage", "scanPattern", 
                    "straightBeamExamination", "angleBeamExamination"],
    acceptanceCriteria: ["qualityLevels", "acceptanceCriteria", "dgAcceptance", 
                        "angleBeamAcceptance", "backReflectionLoss"],
    documentation: ["personnel", "report", "reportInfo", "inspectionTiming"]
  };
  
  const fields = tabFields[tabName] || [];
  const references: Record<string, StandardReference> = {};
  
  fields.forEach(field => {
    const ref = astmA388References[field];
    if (ref) {
      references[field] = ref;
    }
  });
  
  return references;
};
