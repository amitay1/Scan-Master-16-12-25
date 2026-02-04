// @ts-nocheck
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  TableOfContents,
  ImageRun,
  Packer,
} from "docx";
import { BaseExporter } from "./baseExporter";
import { ExportResult, defaultColorScheme } from "@/types/exportTypes";
import { CalibrationBlockType } from "@/types/techniqueSheet";
import { EnhancedCalibrationBlockDrawings, BlockDrawingOptions } from "@/utils/drawings/enhancedCalibrationBlockDrawings";

export class WordExporter extends BaseExporter {
  private doc: Document;
  private sections: any[] = [];

  async export(): Promise<ExportResult> {
    try {
      await this.buildDocument();
      
      const blob = await Packer.toBlob(this.doc);
      
      const filename = `${this.getFileName()}.docx`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        filename,
        blob,
      };
    } catch (error) {
      console.error("Word export error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  private async buildDocument(): Promise<void> {
    const children: (Paragraph | Table | TableOfContents)[] = [];

    // Cover Page
    if (this.shouldIncludeSection("coverPage")) {
      children.push(...this.createCoverPage());
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // Table of Contents
    if (this.shouldIncludeSection("tableOfContents") && this.options.includeTableOfContents) {
      children.push(...this.createTableOfContents());
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // Main Content
    if (this.shouldIncludeSection("inspectionSetup")) {
      children.push(...this.createInspectionSetupSection());
    }

    if (this.shouldIncludeSection("equipment")) {
      children.push(...this.createEquipmentSection());
    }

    if (this.shouldIncludeSection("calibration")) {
      children.push(...(await this.createCalibrationSection()));
    }

    if (this.shouldIncludeSection("scanParameters")) {
      children.push(...this.createScanParametersSection());
    }

    if (this.shouldIncludeSection("acceptanceCriteria")) {
      children.push(...this.createAcceptanceCriteriaSection());
    }

    if (this.shouldIncludeSection("documentation")) {
      children.push(...this.createDocumentationSection());
    }

    if (this.shouldIncludeSection("approvals")) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(...this.createApprovalsSection());
    }

    // Create document with headers and footers
    this.doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          headers: {
            default: this.createHeader(),
          },
          footers: {
            default: this.createFooter(),
          },
          children,
        },
      ],
      styles: this.createStyles(),
    });
  }

  private createStyles() {
    const colors = this.options.colorScheme || defaultColorScheme;
    
    return {
      default: {
        heading1: {
          run: {
            size: 32,
            bold: true,
            color: colors.primary.replace("#", ""),
          },
          paragraph: {
            spacing: { after: 240 },
          },
        },
        heading2: {
          run: {
            size: 26,
            bold: true,
            color: colors.primary.replace("#", ""),
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        heading3: {
          run: {
            size: 22,
            bold: true,
            color: colors.text.replace("#", ""),
          },
          paragraph: {
            spacing: { before: 120, after: 120 },
          },
        },
      },
    };
  }

  private createHeader(): Header {
    const companyName = this.options.companyName || "UT Inspection Services";
    
    return new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: companyName,
              bold: true,
              size: 20,
              color: this.options.colorScheme?.primary.replace("#", "") || "2563EB",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Ultrasonic Testing Technique Sheet",
              size: 16,
            }),
          ],
        }),
      ],
    });
  }

  private createFooter(): Footer {
    return new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Document: ${this.data.documentation.procedureNumber || "UT-TS-001"} | `,
              size: 16,
            }),
            new TextRun({
              text: `Rev: ${this.data.documentation.revision || "A"} | `,
              size: 16,
            }),
            new TextRun({
              text: "Page ",
              size: 16,
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size: 16,
            }),
            new TextRun({
              text: " of ",
              size: 16,
            }),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
              size: 16,
            }),
          ],
        }),
      ],
    });
  }

  private createCoverPage(): Paragraph[] {
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: "ULTRASONIC INSPECTION",
            bold: true,
            size: 48,
            color: this.options.colorScheme?.primary.replace("#", "") || "2563EB",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: "TECHNIQUE SHEET",
            bold: true,
            size: 36,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `Standard: ${this.data.standard}`,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `Part Number: ${this.data.inspectionSetup.partNumber || "N/A"}`,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `Part Name: ${this.data.inspectionSetup.partName || "N/A"}`,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
        children: [
          new TextRun({
            text: `Date: ${this.formatDate(this.data.documentation.inspectionDate)}`,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Inspector: ${this.data.documentation.inspectorName || "N/A"}`,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Level: ${this.data.documentation.inspectorLevel || "N/A"}`,
            size: 20,
          }),
        ],
      }),
    ];
  }

  private createTableOfContents(): (Paragraph | TableOfContents)[] {
    return [
      new Paragraph({
        text: "Table of Contents",
        heading: HeadingLevel.HEADING_1,
      }),
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
      }),
    ];
  }

  private createInspectionSetupSection(): (Paragraph | Table)[] {
    const rows = [
      ["Part Number", this.formatValue(this.data.inspectionSetup.partNumber)],
      ["Part Name", this.formatValue(this.data.inspectionSetup.partName)],
      ["Material", this.formatValue(this.data.inspectionSetup.material)],
      ["Material Specification", this.formatValue(this.data.inspectionSetup.materialSpec)],
      ["Part Type", this.formatValue(this.data.inspectionSetup.partType)],
      ["Thickness", this.formatValue(this.data.inspectionSetup.partThickness, "mm")],
      ["Length", this.formatValue(this.data.inspectionSetup.partLength, "mm")],
      ["Width", this.formatValue(this.data.inspectionSetup.partWidth, "mm")],
    ];

    if (this.data.inspectionSetup.diameter) {
      rows.push(["Diameter", this.formatValue(this.data.inspectionSetup.diameter, "mm")]);
    }

    return [
      new Paragraph({
        text: "1. Inspection Setup",
        heading: HeadingLevel.HEADING_2,
      }),
      this.createTable(["Parameter", "Value"], rows),
      new Paragraph({ text: "" }), // Spacer
    ];
  }

  private createEquipmentSection(): (Paragraph | Table)[] {
    const rows = [
      ["Manufacturer", this.formatValue(this.data.equipment.manufacturer)],
      ["Model", this.formatValue(this.data.equipment.model)],
      ["Serial Number", this.formatValue(this.data.equipment.serialNumber)],
      ["Frequency", this.formatValue(this.data.equipment.frequency, "MHz")],
      ["Transducer Type", this.formatValue(this.data.equipment.transducerType)],
      ["Transducer Diameter", this.formatValue(this.data.equipment.transducerDiameter, "in")],
      ["Couplant", this.formatValue(this.data.equipment.couplant)],
      ["Vertical Linearity", this.formatValue(this.data.equipment.verticalLinearity, "%")],
      ["Horizontal Linearity", this.formatValue(this.data.equipment.horizontalLinearity, "%")],
    ];

    return [
      new Paragraph({
        text: "2. Equipment",
        heading: HeadingLevel.HEADING_2,
      }),
      this.createTable(["Parameter", "Value"], rows),
      new Paragraph({ text: "" }),
    ];
  }

  private async createCalibrationSection(): Promise<(Paragraph | Table)[]> {
    const rows = [
      ["Standard Type", this.formatValue(this.data.calibration.standardType)],
      ["Reference Material", this.formatValue(this.data.calibration.referenceMaterial)],
      ["FBH Sizes", this.formatValue(this.data.calibration.fbhSizes)],
      ["Metal Travel Distance", this.formatValue(this.data.calibration.metalTravelDistance, "mm")],
      ["Block Dimensions", this.formatValue(this.data.calibration.blockDimensions)],
      ["Block Serial Number", this.formatValue(this.data.calibration.blockSerialNumber)],
      ["Last Calibration Date", this.formatDate(this.data.calibration.lastCalibrationDate)],
    ];

    const elements: (Paragraph | Table)[] = [
      new Paragraph({
        text: "3. Calibration",
        heading: HeadingLevel.HEADING_2,
      }),
      this.createTable(["Parameter", "Value"], rows),
    ];

    // Add calibration block diagram if available
    if (this.shouldIncludeSection("calibrationDiagram") && this.data.calibration.standardType) {
      elements.push(new Paragraph({ text: "" }));
      
      try {
        // Create enhanced calibration block drawing
        const drawingOptions: BlockDrawingOptions = {
          type: this.data.calibration.standardType as CalibrationBlockType,
          dimensions: {
            length: 200,
            width: 100,
            height: 50,
            diameter: 150,
            radius: 100,
          },
          material: this.data.calibration.referenceMaterial || 'Steel',
          serialNumber: this.data.calibration.blockSerialNumber || 'CAL-001',
          showGrid: true,
          showDimensions: true,
          showCrossSection: true,
          showIsometric: false,
          showLegend: true,
          showTitleBlock: false,
          scale: 1,
          dpi: 150, // Reduced for document embedding
        };

        // Parse FBH sizes if available
        if (this.data.calibration.fbhSizes) {
          const fbhSizesArray = this.data.calibration.fbhSizes.split(',').map(s => s.trim());
          drawingOptions.fbhData = fbhSizesArray.map((size, index) => ({
            diameter: parseFloat(size) || 3,
            depth: 10 + index * 5,
            position: { x: 50 + index * 50, y: 50 },
            label: `FBH ${size}`,
          }));
        }

        const blockDrawing = new EnhancedCalibrationBlockDrawings(drawingOptions);
        const views = await blockDrawing.generateDrawings();

        // Get the main view
        const mainView = views.get('top');
        if (mainView) {
          elements.push(
            new Paragraph({
              text: "Calibration Block Diagram",
              heading: HeadingLevel.HEADING_3,
            })
          );

          // Convert canvas to blob and then to buffer for Word document
          const blob = await blockDrawing.exportAsPNG();

          // Validate blob before processing
          if (blob && blob.size > 0) {
            const buffer = await blob.arrayBuffer();

            // Validate buffer has content before creating ImageRun
            if (buffer && buffer.byteLength > 0) {
              elements.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      type: 'png',
                      data: buffer,
                      transformation: {
                        width: 600,
                        height: 300,
                      },
                    }),
                  ],
                })
              );
            } else {
              console.warn('Calibration block image buffer is empty, skipping image');
            }
          } else {
            console.warn('Calibration block blob is empty or null, skipping image');
          }

          // Add section view if available
          const sectionView = views.get('section');
          if (sectionView) {
            elements.push(
              new Paragraph({
                text: "Cross-Section View",
                heading: HeadingLevel.HEADING_3,
              })
            );

            // Create a new drawing instance for section view export
            const sectionCanvas = sectionView.canvas;
            const sectionBlob = await new Promise<Blob | null>((resolve) => {
              sectionCanvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/png', 1.0);
            });

            // Validate section blob before processing
            if (sectionBlob && sectionBlob.size > 0) {
              const sectionBuffer = await sectionBlob.arrayBuffer();

              // Validate buffer has content before creating ImageRun
              if (sectionBuffer && sectionBuffer.byteLength > 0) {
                elements.push(
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: 'png',
                        data: sectionBuffer,
                        transformation: {
                          width: 600,
                          height: 200,
                        },
                      }),
                    ],
                  })
                );
              } else {
                console.warn('Section view buffer is empty, skipping image');
              }
            } else {
              console.warn('Section view blob is empty or null, skipping image');
            }
          }
        }
      } catch (error) {
        console.error('Failed to generate enhanced calibration drawing:', error);
        // Fallback to text placeholder
        elements.push(
          new Paragraph({
            text: "Calibration Block Diagram",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `[${this.data.calibration.standardType?.toUpperCase() || 'CALIBRATION'} BLOCK - Drawing not available]`,
                italics: true,
              }),
            ],
          })
        );
      }
    }

    elements.push(new Paragraph({ text: "" }));
    return elements;
  }

  private createScanParametersSection(): (Paragraph | Table)[] {
    const rows = [
      ["Scan Method", this.formatValue(this.data.scanParameters.scanMethod)],
      ["Scan Type", this.formatValue(this.data.scanParameters.scanType)],
      ["Scan Speed", this.formatValue(this.data.scanParameters.scanSpeed, "mm/s")],
      ["Scan Index", this.formatValue(this.data.scanParameters.scanIndex, "%")],
      ["Coverage", this.formatValue(this.data.scanParameters.coverage, "%")],
      ["Scan Pattern", this.formatValue(this.data.scanParameters.scanPattern)],
      ["Water Path", this.formatValue(this.data.scanParameters.waterPath, "mm")],
      ["Pulse Repetition Rate", this.formatValue(this.data.scanParameters.pulseRepetitionRate, "Hz")],
      ["Gain Settings", this.formatValue(this.data.scanParameters.gainSettings)],
      ["Alarm Gate Settings", this.formatValue(this.data.scanParameters.alarmGateSettings)],
    ];

    return [
      new Paragraph({
        text: "4. Scan Parameters",
        heading: HeadingLevel.HEADING_2,
      }),
      this.createTable(["Parameter", "Value"], rows),
      new Paragraph({ text: "" }),
    ];
  }

  private createAcceptanceCriteriaSection(): (Paragraph | Table)[] {
    const rows = [
      ["Acceptance Class", this.formatValue(this.data.acceptanceCriteria.acceptanceClass)],
      ["Single Discontinuity", this.formatValue(this.data.acceptanceCriteria.singleDiscontinuity)],
      ["Multiple Discontinuities", this.formatValue(this.data.acceptanceCriteria.multipleDiscontinuities)],
      ["Linear Discontinuity", this.formatValue(this.data.acceptanceCriteria.linearDiscontinuity)],
      ["Back Reflection Loss", this.formatValue(this.data.acceptanceCriteria.backReflectionLoss, "%")],
      ["Noise Level", this.formatValue(this.data.acceptanceCriteria.noiseLevel)],
      ["Special Requirements", this.formatValue(this.data.acceptanceCriteria.specialRequirements)],
    ];

    return [
      new Paragraph({
        text: "5. Acceptance Criteria",
        heading: HeadingLevel.HEADING_2,
      }),
      this.createTable(["Parameter", "Value"], rows),
      new Paragraph({ text: "" }),
    ];
  }

  private createDocumentationSection(): (Paragraph | Table)[] {
    const rows = [
      ["Inspector Name", this.formatValue(this.data.documentation.inspectorName)],
      ["Inspector Certification", this.formatValue(this.data.documentation.inspectorCertification)],
      ["Inspector Level", this.formatValue(this.data.documentation.inspectorLevel)],
      ["Certifying Organization", this.formatValue(this.data.documentation.certifyingOrganization)],
      ["Inspection Date", this.formatDate(this.data.documentation.inspectionDate)],
      ["Procedure Number", this.formatValue(this.data.documentation.procedureNumber)],
      ["Drawing Reference", this.formatValue(this.data.documentation.drawingReference)],
      ["Revision", this.formatValue(this.data.documentation.revision)],
    ];

    if (this.data.documentation.additionalNotes) {
      rows.push(["Additional Notes", this.formatValue(this.data.documentation.additionalNotes)]);
    }

    return [
      new Paragraph({
        text: "6. Documentation",
        heading: HeadingLevel.HEADING_2,
      }),
      this.createTable(["Parameter", "Value"], rows),
      new Paragraph({ text: "" }),
    ];
  }

  private createApprovalsSection(): (Paragraph | Table)[] {
    return [
      new Paragraph({
        text: "Approval Signatures",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: "" }),
      this.createApprovalTable(),
    ];
  }

  private createTable(headers: string[], data: string[][]): Table {
    const headerRow = new TableRow({
      children: headers.map(
        (header) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.options.colorScheme?.primary.replace("#", "") || "2563EB",
            },
            verticalAlign: VerticalAlign.CENTER,
          })
      ),
    });

    const dataRows = data.map(
      (row, index) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cell,
                      }),
                    ],
                  }),
                ],
                shading: index % 2 === 0 ? {
                  type: ShadingType.SOLID,
                  color: "F8F9FA",
                } : undefined,
                verticalAlign: VerticalAlign.CENTER,
              })
          ),
        })
    );

    return new Table({
      rows: [headerRow, ...dataRows],
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });
  }

  private createApprovalTable(): Table {
    const headers = ["Role", "Name", "Level", "Date", "Signature"];
    const data = [
      [
        "Prepared by",
        this.data.documentation.inspectorName || "",
        this.data.documentation.inspectorLevel || "",
        this.formatDate(this.data.documentation.inspectionDate),
        "_________________",
      ],
      [
        "Reviewed by",
        "",
        "Level III",
        "",
        "_________________",
      ],
      [
        "Approved by",
        "",
        "",
        "",
        "_________________",
      ],
    ];

    return this.createTable(headers, data);
  }

  // Stub methods for abstract requirements
  protected renderCoverPage(): void {}
  protected renderTableOfContents(): void {}
  protected renderInspectionSetup(): void {}
  protected renderEquipment(): void {}
  protected renderCalibration(): void {}
  protected renderCalibrationDiagram(): void {}
  protected renderScanParameters(): void {}
  protected renderAcceptanceCriteria(): void {}
  protected renderPartDiagram(): void {}
  protected renderDocumentation(): void {}
  protected renderScanImages(): void {}
  protected renderApprovals(): void {}
  protected addPageNumbers(): void {}
  protected addWatermark(): void {}
}