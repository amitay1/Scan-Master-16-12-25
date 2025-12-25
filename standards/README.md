# Standards Library

## Upload Standards Here

Place your international standards documents in this folder structure:

### `/standards/pdfs/`
Original PDF files of standards:
- AMS-STD-2154E.pdf
- ASTM-A388.pdf
- ISO-16810.pdf
- EN-12668.pdf
- etc.

### `/standards/processed/`
Extracted and processed data from standards (JSON format)

## Supported Formats
- PDF files (preferred)
- Word documents (.docx)
- XML standards files
- Text files

## Processing
The system will automatically:
1. Extract tables, formulas, and requirements
2. Parse acceptance criteria and calibration procedures
3. Create structured JSON data for validation
4. Build standard-specific calculation engines

## Current Standards Awaiting Upload
- [ ] AMS-STD-2154E (Full version)
- [ ] ASTM A388/A388M
- [ ] ISO 16810
- [ ] EN 12668
- [ ] MIL-STD-2154
- [ ] Other aerospace/industrial NDT standards