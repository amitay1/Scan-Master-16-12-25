// @ts-nocheck
import { MaterialType, PartGeometry, StandardType, AcceptanceClass } from "@/types/techniqueSheet";
import milStd2154 from "../../../standards/processed/mil-std-2154.json";
import astmA388 from "../../../standards/processed/astm-a388.json";
import bsEn10228_3 from "../../../standards/processed/bs-en-10228-3.json";
import bsEn10228_4 from "../../../standards/processed/bs-en-10228-4.json";

export type ComplianceStandard = "MIL-STD-2154" | "ASTM-A388" | "BS-EN-10228-3" | "BS-EN-10228-4";

// Extended type to handle both AMS-STD-2154E and MIL-STD-2154 as the same standard
export type ExtendedComplianceStandard = ComplianceStandard | "AMS-STD-2154E";

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  warnings?: string[];
  recommendations?: string[];
}

export interface CalculationResult<T = number> {
  value: T;
  formula: string;
  unit: string;
  explanation: string;
}

export interface StandardRequirement {
  parameter: string;
  required: any;
  actual: any;
  compliant: boolean;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface ComplianceReport {
  standard: ComplianceStandard | ExtendedComplianceStandard;
  overallCompliance: boolean;
  compliancePercentage: number;
  requirements: StandardRequirement[];
  calculations: Record<string, CalculationResult>;
  recommendations: string[];
}

export interface StandardComparison {
  parameter: string;
  standards: Record<ComplianceStandard | ExtendedComplianceStandard, any>;
  mostStringent: ComplianceStandard | ExtendedComplianceStandard;
  differences: string[];
}

export class StandardsComplianceEngine {
  private standards = {
    "MIL-STD-2154": milStd2154,
    "AMS-STD-2154E": milStd2154, // Map AMS-STD-2154E to same data as MIL-STD-2154
    "ASTM-A388": astmA388,
    "BS-EN-10228-3": bsEn10228_3,
    "BS-EN-10228-4": bsEn10228_4,
  };

  /**
   * Map standard names to internal compliance standard names
   * AMS-STD-2154E and MIL-STD-2154 are treated as the same standard
   */
  private mapStandardName(standard: StandardType | ExtendedComplianceStandard): ComplianceStandard {
    if (standard === "AMS-STD-2154E") {
      return "MIL-STD-2154";
    }
    return standard as ComplianceStandard;
  }

  // ============= CALCULATION MODULES =============

  /**
   * Calculate Metal Travel Distance per MIL-STD-2154
   */
  calculateMetalTravelDistance(thickness: number, standard: StandardType | ExtendedComplianceStandard): CalculationResult {
    const mappedStandard = this.mapStandardName(standard);
    const thicknessMm = thickness * 25.4; // Convert inches to mm
    let value: number;
    let formula: string;
    let explanation: string;

    switch (mappedStandard) {
      case "MIL-STD-2154":
        // 3T rounded to nearest 5mm
        value = Math.round((3 * thicknessMm) / 5) * 5;
        formula = "MTD = 3T rounded to nearest 5mm";
        explanation = `For thickness ${thickness}" (${thicknessMm.toFixed(1)}mm): MTD = 3 × ${thicknessMm.toFixed(1)} = ${(3 * thicknessMm).toFixed(1)}mm, rounded to ${value}mm`;
        break;
      
      case "ASTM-A388":
        // 2T minimum, 3T typical
        value = 3 * thicknessMm;
        formula = "MTD = 3T (typical)";
        explanation = `For thickness ${thickness}" (${thicknessMm.toFixed(1)}mm): MTD = 3 × ${thicknessMm.toFixed(1)} = ${value.toFixed(1)}mm`;
        break;
      
      case "BS-EN-10228-3":
      case "BS-EN-10228-4":
        // Full thickness or as specified
        value = thicknessMm;
        formula = "MTD = T (full thickness)";
        explanation = `For thickness ${thickness}" (${thicknessMm.toFixed(1)}mm): MTD = ${value.toFixed(1)}mm (full thickness examination)`;
        break;
      
      default:
        value = 3 * thicknessMm;
        formula = "MTD = 3T (default)";
        explanation = `Default calculation: 3 × ${thicknessMm.toFixed(1)} = ${value.toFixed(1)}mm`;
    }

    return {
      value,
      formula,
      unit: "mm",
      explanation
    };
  }

  /**
   * Calculate Scan Index (spacing between scan lines)
   */
  calculateScanIndex(beamWidth: number, coverage: number, standard: StandardType | ExtendedComplianceStandard): CalculationResult {
    const mappedStandard = this.mapStandardName(standard);
    let value: number;
    let formula: string;
    let explanation: string;

    const overlap = (100 - coverage) / 100;

    switch (mappedStandard) {
      case "MIL-STD-2154":
        // 70% of beam width maximum (30% overlap minimum)
        value = beamWidth * 0.7;
        formula = "SI = BW × 0.7 (30% overlap)";
        explanation = `For beam width ${beamWidth}mm and ${coverage}% coverage: SI = ${beamWidth} × 0.7 = ${value.toFixed(2)}mm`;
        break;
      
      case "ASTM-A388":
        // 10-15% overlap
        value = beamWidth * 0.85;
        formula = "SI = BW × 0.85 (15% overlap)";
        explanation = `For beam width ${beamWidth}mm: SI = ${beamWidth} × 0.85 = ${value.toFixed(2)}mm`;
        break;
      
      case "BS-EN-10228-3":
        // 10% overlap minimum
        value = beamWidth * 0.9;
        formula = "SI = BW × 0.9 (10% overlap)";
        explanation = `For beam width ${beamWidth}mm: SI = ${beamWidth} × 0.9 = ${value.toFixed(2)}mm`;
        break;
      
      case "BS-EN-10228-4":
        // 20% overlap for austenitic
        value = beamWidth * 0.8;
        formula = "SI = BW × 0.8 (20% overlap)";
        explanation = `For beam width ${beamWidth}mm (austenitic): SI = ${beamWidth} × 0.8 = ${value.toFixed(2)}mm`;
        break;
      
      default:
        value = beamWidth * 0.7;
        formula = "SI = BW × 0.7 (default)";
        explanation = `Default 30% overlap: ${beamWidth} × 0.7 = ${value.toFixed(2)}mm`;
    }

    return {
      value,
      formula,
      unit: "mm",
      explanation
    };
  }

  /**
   * Calculate Near Field Distance
   */
  calculateNearFieldDistance(
    transducerDiameter: number, 
    frequency: number, 
    velocity: number,
    standard: StandardType | ExtendedComplianceStandard
  ): CalculationResult {
    const diameterMm = transducerDiameter * 25.4; // Convert inches to mm
    const wavelength = velocity / frequency; // mm
    const nearField = (diameterMm * diameterMm) / (4 * wavelength);
    
    return {
      value: nearField,
      formula: "N = D²/(4λ)",
      unit: "mm",
      explanation: `For D=${diameterMm.toFixed(1)}mm, f=${frequency}MHz, v=${velocity}m/s: λ=${wavelength.toFixed(2)}mm, N=${nearField.toFixed(1)}mm`
    };
  }

  /**
   * Get FBH size based on thickness and acceptance class
   */
  getFBHSize(thickness: number, acceptanceClass: string, standard: StandardType | ExtendedComplianceStandard): CalculationResult<string> {
    const mappedStandard = this.mapStandardName(standard);
    let value: string;
    let formula: string;
    let explanation: string;

    switch (mappedStandard) {
      case "MIL-STD-2154":
        value = this.getMilStdFBHSize(thickness, acceptanceClass);
        formula = "Per Table I of MIL-STD-2154";
        explanation = `For ${thickness}" thickness, Class ${acceptanceClass}: FBH = ${value}`;
        break;
      
      case "ASTM-A388":
        value = this.getAstmFBHSize(thickness);
        formula = "Per ASTM A388 requirements";
        explanation = `For ${thickness}" thickness: FBH = ${value}`;
        break;
      
      case "BS-EN-10228-3":
      case "BS-EN-10228-4":
        value = this.getBSENFBHSize(thickness);
        formula = `Per ${standard}`;
        explanation = `For ${thickness}" thickness: FBH = ${value}`;
        break;
      
      default:
        value = "3/64 inch";
        formula = "Default FBH size";
        explanation = "Using default FBH size";
    }

    return {
      value,
      formula,
      unit: "",
      explanation
    };
  }

  private getMilStdFBHSize(thickness: number, acceptanceClass: string): string {
    const classMap: Record<string, Record<string, string>> = {
      "0.25-0.50": { AAA: "1/64", AA: "1/64", A: "2/64", B: "3/64", C: "4/64" },
      "0.50-1.00": { AAA: "1/64", AA: "2/64", A: "3/64", B: "4/64", C: "5/64" },
      "1.00-2.00": { AAA: "2/64", AA: "3/64", A: "3/64", B: "5/64", C: "5/64" },
      "2.00-4.00": { AAA: "3/64", AA: "3/64", A: "5/64", B: "5/64", C: "8/64" },
      ">4.00": { AAA: "3/64", AA: "5/64", A: "5/64", B: "8/64", C: "8/64" }
    };

    let range: string;
    if (thickness <= 0.5) range = "0.25-0.50";
    else if (thickness <= 1.0) range = "0.50-1.00";
    else if (thickness <= 2.0) range = "1.00-2.00";
    else if (thickness <= 4.0) range = "2.00-4.00";
    else range = ">4.00";

    return classMap[range][acceptanceClass] + " inch" || "3/64 inch";
  }

  private getAstmFBHSize(thickness: number): string {
    if (thickness < 1.5) return "1/16 inch (#1)";
    else if (thickness <= 6.0) return "1/8 inch (#2)";
    else return "1/4 inch (#3)";
  }

  private getBSENFBHSize(thickness: number): string {
    // BS EN typically uses metric sizes
    if (thickness <= 50) return "3 mm";
    else if (thickness <= 150) return "5 mm";
    else return "8 mm";
  }

  // ============= VALIDATION MODULES =============

  /**
   * Validate frequency selection based on standard and thickness
   */
  validateFrequency(frequency: number, thickness: number, material: MaterialType, standard: StandardType | ExtendedComplianceStandard): ValidationResult {
    const mappedStandard = this.mapStandardName(standard);
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let isValid = true;

    switch (mappedStandard) {
      case "MIL-STD-2154":
        if (thickness < 0.5 && frequency < 10) {
          warnings.push("For thickness < 0.5\", frequency should be ≥ 10 MHz");
          recommendations.push("Consider using 10 or 15 MHz for better resolution");
        }
        if (thickness > 4 && frequency > 5) {
          warnings.push("For thickness > 4\", frequency should be ≤ 5 MHz");
          recommendations.push("Consider using 2.25 MHz for better penetration");
        }
        break;
      
      case "ASTM-A388":
        if (frequency < 1 || frequency > 5) {
          isValid = false;
          warnings.push("Frequency must be between 1.0 and 5.0 MHz per ASTM A388");
        }
        if (thickness > 6 && frequency > 2.25) {
          recommendations.push("Consider using 2.25 MHz or lower for thick sections");
        }
        break;
      
      case "BS-EN-10228-3":
        if (frequency < 1 || frequency > 5) {
          warnings.push("Frequency typically 1-5 MHz for ferritic steel");
        }
        if (thickness > 200 && frequency > 2) {
          recommendations.push("Use 1-2 MHz for sections > 200mm");
        }
        break;
      
      case "BS-EN-10228-4":
        if (frequency > 2) {
          warnings.push("Frequency should be ≤ 2 MHz for austenitic steel");
          recommendations.push("Use 1-2 MHz due to coarse grain structure");
        }
        break;
    }

    return {
      isValid,
      message: isValid ? "Frequency selection is appropriate" : "Frequency out of recommended range",
      warnings,
      recommendations
    };
  }

  /**
   * Validate scan speed based on standard
   */
  validateScanSpeed(speed: number, method: "manual" | "automated", standard: StandardType | ExtendedComplianceStandard): ValidationResult {
    const mappedStandard = this.mapStandardName(standard);
    let maxSpeed: number;
    const warnings: string[] = [];
    
    switch (mappedStandard) {
      case "MIL-STD-2154":
        maxSpeed = 150; // mm/s
        break;
      case "ASTM-A388":
        maxSpeed = method === "manual" ? 150 : 300;
        break;
      case "BS-EN-10228-3":
        maxSpeed = method === "manual" ? 150 : 500;
        break;
      case "BS-EN-10228-4":
        maxSpeed = method === "manual" ? 100 : 250;
        break;
      default:
        maxSpeed = 150;
    }

    const isValid = speed <= maxSpeed;
    
    if (!isValid) {
      warnings.push(`Speed exceeds maximum of ${maxSpeed} mm/s for ${method} scanning`);
    }

    return {
      isValid,
      message: isValid ? "Scan speed is within limits" : "Scan speed exceeds standard limits",
      warnings,
      recommendations: warnings.length > 0 ? [`Reduce speed to ≤ ${maxSpeed} mm/s`] : []
    };
  }

  /**
   * Validate equipment linearity
   */
  validateLinearity(
    verticalLinearity: { min: number; max: number },
    horizontalLinearity: number,
    standard: StandardType | ExtendedComplianceStandard
  ): ValidationResult {
    const mappedStandard = this.mapStandardName(standard);
    const warnings: string[] = [];
    let isValid = true;

    switch (mappedStandard) {
      case "MIL-STD-2154":
        if (verticalLinearity.min > 5 || verticalLinearity.max < 98) {
          isValid = false;
          warnings.push("Vertical linearity must be 5-98% FSH minimum");
        }
        if (horizontalLinearity < 90) {
          isValid = false;
          warnings.push("Horizontal linearity must be ≥ 90%");
        }
        break;
      
      case "ASTM-A388":
        if (verticalLinearity.min > 10 || verticalLinearity.max < 95) {
          warnings.push("Vertical linearity should be 10-95% FSH");
        }
        if (horizontalLinearity < 85) {
          warnings.push("Horizontal linearity should be ≥ 85%");
        }
        break;
      
      case "BS-EN-10228-3":
      case "BS-EN-10228-4":
        if (verticalLinearity.max - verticalLinearity.min < 80) {
          warnings.push("Linear range should be at least 80% of screen height");
        }
        break;
    }

    return {
      isValid,
      message: isValid ? "Equipment linearity meets requirements" : "Equipment linearity out of specification",
      warnings
    };
  }

  // ============= COMPARISON FUNCTIONS =============

  /**
   * Compare requirements across multiple standards
   */
  compareStandards(parameter: string, thickness?: number, material?: MaterialType): StandardComparison {
    const comparison: StandardComparison = {
      parameter,
      standards: {} as Record<ComplianceStandard | ExtendedComplianceStandard, any>,
      mostStringent: "AMS-STD-2154E",  // Use AMS-STD-2154E as the display name
      differences: []
    };

    switch (parameter) {
      case "scanSpeed":
        comparison.standards = {
          "MIL-STD-2154": "150 mm/s",
          "AMS-STD-2154E": "150 mm/s",  // Use AMS-STD-2154E as display name
          "ASTM-A388": "150-300 mm/s",
          "BS-EN-10228-3": "150-500 mm/s",
          "BS-EN-10228-4": "100-250 mm/s"
        };
        comparison.mostStringent = "BS-EN-10228-4";
        comparison.differences = [
          "BS-EN-10228-4 has lowest speed for austenitic materials",
          "BS-EN-10228-3 allows highest automated speed",
          "MIL-STD-2154 most restrictive overall"
        ];
        break;
      
      case "frequency":
        comparison.standards = {
          "MIL-STD-2154": "1-15 MHz (thickness dependent)",
          "AMS-STD-2154E": "1-15 MHz (thickness dependent)",
          "ASTM-A388": "1-5 MHz",
          "BS-EN-10228-3": "1-5 MHz",
          "BS-EN-10228-4": "0.5-2 MHz (austenitic)"
        };
        comparison.mostStringent = "AMS-STD-2154E";
        comparison.differences = [
          "MIL-STD-2154 requires higher frequencies for thin materials",
          "BS-EN-10228-4 limited to low frequencies for austenitic steel",
          "ASTM A388 and BS-EN-10228-3 similar ranges"
        ];
        break;
      
      case "overlap":
        comparison.standards = {
          "MIL-STD-2154": "30% minimum",
          "AMS-STD-2154E": "30% minimum",
          "ASTM-A388": "10-15%",
          "BS-EN-10228-3": "10% minimum",
          "BS-EN-10228-4": "20% minimum"
        };
        comparison.mostStringent = "AMS-STD-2154E";
        comparison.differences = [
          "MIL-STD-2154 requires highest overlap for complete coverage",
          "BS-EN-10228-4 requires more overlap for austenitic materials",
          "ASTM A388 and BS-EN-10228-3 allow minimal overlap"
        ];
        break;
      
      case "fbhSize":
        if (thickness) {
          comparison.standards = {
            "MIL-STD-2154": this.getMilStdFBHSize(thickness, "A"),
            "AMS-STD-2154E": this.getMilStdFBHSize(thickness, "A"),
            "ASTM-A388": this.getAstmFBHSize(thickness),
            "BS-EN-10228-3": this.getBSENFBHSize(thickness),
            "BS-EN-10228-4": this.getBSENFBHSize(thickness)
          };
          comparison.mostStringent = "AMS-STD-2154E";
          comparison.differences = [
            "MIL-STD-2154 uses smallest FBH sizes",
            "ASTM A388 uses three standard sizes",
            "BS EN standards use metric sizes"
          ];
        }
        break;
    }

    return comparison;
  }

  // ============= REAL-TIME COMPLIANCE CHECKING =============

  /**
   * Perform comprehensive compliance check
   */
  checkCompliance(
    parameters: Record<string, any>,
    standard: StandardType | ExtendedComplianceStandard
  ): ComplianceReport {
    const requirements: StandardRequirement[] = [];
    const calculations: Record<string, CalculationResult<any>> = {};
    const recommendations: string[] = [];

    // Extract parameters
    const {
      thickness,
      material,
      frequency,
      scanSpeed,
      scanMethod,
      verticalLinearity,
      horizontalLinearity,
      acceptanceClass,
      transducerDiameter,
      beamWidth,
      coverage
    } = parameters;

    // Perform calculations
    if (thickness) {
      calculations.metalTravel = this.calculateMetalTravelDistance(thickness, standard);
      
      if (acceptanceClass) {
        calculations.fbhSize = this.getFBHSize(thickness, acceptanceClass, standard);
      }
    }

    if (beamWidth && coverage) {
      calculations.scanIndex = this.calculateScanIndex(beamWidth, coverage, standard);
    }

    if (transducerDiameter && frequency && material) {
      const velocity = this.getMaterialVelocity(material, standard);
      calculations.nearField = this.calculateNearFieldDistance(
        transducerDiameter,
        frequency,
        velocity,
        standard
      );
    }

    // Validate parameters
    if (frequency && thickness && material) {
      const freqValidation = this.validateFrequency(frequency, thickness, material, standard);
      requirements.push({
        parameter: "Frequency",
        required: this.getFrequencyRange(thickness, standard),
        actual: `${frequency} MHz`,
        compliant: freqValidation.isValid,
        message: freqValidation.message || "",
        severity: freqValidation.isValid ? "info" : "error"
      });
      if (freqValidation.recommendations) {
        recommendations.push(...freqValidation.recommendations);
      }
    }

    if (scanSpeed && scanMethod) {
      const speedValidation = this.validateScanSpeed(scanSpeed, scanMethod, standard);
      requirements.push({
        parameter: "Scan Speed",
        required: this.getMaxScanSpeed(scanMethod, standard),
        actual: `${scanSpeed} mm/s`,
        compliant: speedValidation.isValid,
        message: speedValidation.message || "",
        severity: speedValidation.isValid ? "info" : "warning"
      });
    }

    if (verticalLinearity && horizontalLinearity) {
      const linearityValidation = this.validateLinearity(
        verticalLinearity,
        horizontalLinearity,
        standard
      );
      requirements.push({
        parameter: "Equipment Linearity",
        required: this.getLinearityRequirements(standard),
        actual: `V: ${verticalLinearity.min}-${verticalLinearity.max}%, H: ${horizontalLinearity}%`,
        compliant: linearityValidation.isValid,
        message: linearityValidation.message || "",
        severity: linearityValidation.isValid ? "info" : "error"
      });
    }

    // Calculate overall compliance
    const compliantCount = requirements.filter(r => r.compliant).length;
    const compliancePercentage = requirements.length > 0 
      ? (compliantCount / requirements.length) * 100 
      : 100;

    return {
      standard,
      overallCompliance: requirements.every(r => r.compliant || r.severity !== "error"),
      compliancePercentage,
      requirements,
      calculations,
      recommendations
    };
  }

  // ============= HELPER FUNCTIONS =============

  private getMaterialVelocity(material: MaterialType, standard: StandardType | ExtendedComplianceStandard): number {
    const mappedStandard = this.mapStandardName(standard);
    // Return velocity in m/s
    const velocities: Record<MaterialType, number> = {
      aluminum: 6320,
      steel: 5900,
      stainless_steel: mappedStandard === "BS-EN-10228-4" ? 5720 : 5790,
      titanium: 6100,
      magnesium: 5770,
      custom: 5900
    };
    return velocities[material] || 5900;
  }

  private getFrequencyRange(thickness: number, standard: StandardType | ExtendedComplianceStandard): string {
    const mappedStandard = this.mapStandardName(standard);
    switch (mappedStandard) {
      case "MIL-STD-2154":
        if (thickness < 0.5) return "10-15 MHz";
        if (thickness < 2) return "5-10 MHz";
        return "1-5 MHz";
      case "ASTM-A388":
        return "1-5 MHz";
      case "BS-EN-10228-3":
        return "1-5 MHz";
      case "BS-EN-10228-4":
        return "0.5-2 MHz";
      default:
        return "2-5 MHz";
    }
  }

  private getMaxScanSpeed(method: "manual" | "automated", standard: StandardType | ExtendedComplianceStandard): string {
    const mappedStandard = this.mapStandardName(standard);
    switch (mappedStandard) {
      case "MIL-STD-2154":
        return "150 mm/s";
      case "ASTM-A388":
        return method === "manual" ? "150 mm/s" : "300 mm/s";
      case "BS-EN-10228-3":
        return method === "manual" ? "150 mm/s" : "500 mm/s";
      case "BS-EN-10228-4":
        return method === "manual" ? "100 mm/s" : "250 mm/s";
      default:
        return "150 mm/s";
    }
  }

  private getLinearityRequirements(standard: StandardType | ExtendedComplianceStandard): string {
    const mappedStandard = this.mapStandardName(standard);
    switch (mappedStandard) {
      case "MIL-STD-2154":
        return "V: 5-98%, H: ≥90%";
      case "ASTM-A388":
        return "V: 10-95%, H: ≥85%";
      case "BS-EN-10228-3":
      case "BS-EN-10228-4":
        return "Linear range ≥80% screen";
      default:
        return "V: 10-95%, H: ≥85%";
    }
  }

  /**
   * Get recommended settings based on standard
   */
  getRecommendedSettings(
    thickness: number,
    material: MaterialType,
    partGeometry: PartGeometry,
    standard: StandardType | ExtendedComplianceStandard
  ): Record<string, any> {
    const mappedStandard = this.mapStandardName(standard);
    const recommendations: Record<string, any> = {};

    // Frequency recommendation
    if (mappedStandard === "MIL-STD-2154") {
      if (thickness < 0.5) recommendations.frequency = 10.0;
      else if (thickness < 1) recommendations.frequency = 5.0;
      else if (thickness < 4) recommendations.frequency = 2.25;
      else recommendations.frequency = 1.0;
    } else if (mappedStandard === "BS-EN-10228-4") {
      recommendations.frequency = material === "stainless_steel" ? 1.0 : 2.0;
    } else {
      recommendations.frequency = 2.25; // Standard frequency
    }

    // Scan parameters
    recommendations.scanSpeed = this.getMaxScanSpeed("manual", mappedStandard).replace(" mm/s", "");
    recommendations.coverage = mappedStandard === "MIL-STD-2154" ? 100 : 100;
    
    // Couplant recommendation
    if (mappedStandard === "ASTM-A388") {
      recommendations.couplant = "SAE 20 Motor Oil";
    } else {
      recommendations.couplant = material === "stainless_steel" ? "Glycerin" : "Water (Immersion)";
    }

    // Acceptance class
    if (mappedStandard === "MIL-STD-2154") {
      recommendations.acceptanceClass = "A";
    } else if (mappedStandard === "BS-EN-10228-3" || mappedStandard === "BS-EN-10228-4") {
      recommendations.acceptanceClass = "2";
    } else {
      recommendations.acceptanceClass = "QL2";
    }

    return recommendations;
  }
}

// Export singleton instance
export const complianceEngine = new StandardsComplianceEngine();