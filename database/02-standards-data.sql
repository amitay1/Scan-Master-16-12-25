-- Scan-Master Standards Data
-- Pre-populated UT standards for offline factory deployment
-- All standards set to is_free = true for factory installations

-- AMS Standards (Aerospace Material Specifications)
INSERT INTO standards (code, name, description, version, category, is_free, is_active, metadata) VALUES
('AMS-STD-2154', 'Inspection, Ultrasonic, Wrought Metals', 'Aerospace standard for ultrasonic inspection of wrought metal products including acceptance criteria classes AAA, AA, A, B, C', '2021E', 'Aerospace', true, true, '{"classes": ["AAA", "AA", "A", "B", "C"], "materials": ["aluminum", "titanium", "steel", "nickel"], "thicknessMin": 6.35, "thicknessUnit": "mm"}'),
('AMS-2630', 'Inspection, Ultrasonic Product Over 0.5 Inch Thick', 'Standard for ultrasonic inspection of products over 0.5 inch (12.7 mm) thick using contact or immersion methods', '2022E', 'Aerospace', true, true, '{"classes": ["AAA", "AA", "A", "B", "C"], "thicknessMin": 12.7, "thicknessUnit": "mm", "methods": ["contact", "immersion"]}'),
('AMS-2631', 'Ultrasonic Inspection, Titanium and Titanium Alloy Bar, Billet and Plate', 'Standard for ultrasonic inspection of titanium bars, billets and plate products ≥0.25 inch thick', '2022G', 'Aerospace', true, true, '{"classes": ["AA", "A", "A1", "B"], "material": "titanium", "forms": ["bar", "billet", "plate"], "thicknessMin": 6.4, "surfaceFinish": 250}'),
('AMS-2632', 'Ultrasonic Inspection of Thin Materials', 'Standard for ultrasonic inspection of thin materials ≤0.5 inch (12.7mm) thick', '2022C', 'Aerospace', true, true, '{"classes": ["AA", "A", "B", "C"], "thicknessMax": 12.7, "thicknessUnit": "mm", "frequencyRange": "5-15 MHz"}'),
('AMS-2628', 'Ultrasonic Immersion Inspection, Titanium Billet Premium Grade', 'Standard for immersion ultrasonic inspection of premium grade titanium billet ≥5 inches diameter', '2021A', 'Aerospace', true, true, '{"material": "titanium", "forms": ["billet"], "minDiameter": 127, "method": "immersion"}}')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    is_free = true,
    is_active = true;

-- ASTM Standards
INSERT INTO standards (code, name, description, version, category, is_free, is_active, metadata) VALUES
('ASTM-E2375', 'Standard Practice for Ultrasonic Testing of Wrought Products', 'ASTM standard for ultrasonic examination of wrought products - adopted from MIL-STD-2154 with 5 acceptance classes', '2022', 'Industrial', true, true, '{"classes": ["AAA", "AA", "A", "B", "C"], "methods": ["contact", "immersion"], "techniques": ["straight beam", "angle beam"], "adoptedFrom": "MIL-STD-2154"}'),
('ASTM-E127', 'Practice for Fabrication and Control of FBH Ultrasonic Standard Reference Blocks', 'Standard for fabrication of flat-bottom hole (FBH) reference blocks - FBH sizes 1/64 to 8/64 inch', '2020', 'Calibration', true, true, '{"blockType": "FBH", "fbhSizes": ["1/64", "2/64", "3/64", "4/64", "5/64", "6/64", "7/64", "8/64"], "testFrequency": 5, "testMethod": "immersion"}'),
('ASTM-E428', 'Practice for Fabrication and Control of Metal Reference Blocks (Withdrawn 2019)', 'Standard for steel and other metal reference blocks - merged into E127-19', '2019', 'Calibration', true, true, '{"blockType": "FBH", "materials": ["steel", "titanium", "nickel"], "status": "merged into E127-19"}'),
('ASTM-E317', 'Practice for Evaluating Performance Characteristics of Ultrasonic Pulse-Echo Testing Instruments', 'Standard for evaluating UT instrument performance', '2020', 'Equipment', true, true, '{"testTypes": ["linearity", "resolution", "sensitivity"]}'),
('ASTM-A388', 'Practice for Ultrasonic Examination of Steel Forgings', 'Standard for UT of heavy steel forgings with quality levels QL1-QL4', '2019', 'Industrial', true, true, '{"classes": ["QL1", "QL2", "QL3", "QL4"], "material": "steel", "form": "forging", "thicknessRange": "all"}'),
('ASTM-E164', 'Practice for Contact Ultrasonic Testing of Weldments', 'Standard for UT of welds using contact method - thickness 0.25 to 8 inches', '2019', 'Welding', true, true, '{"classes": ["LEVEL-1", "LEVEL-2", "LEVEL-3"], "method": "contact", "application": "weldments", "thicknessRange": "6.4-203mm", "angles": [45, 60, 70]}')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    is_free = true,
    is_active = true;

-- TUV/European Standards (EN/ISO)
INSERT INTO standards (code, name, description, version, category, is_free, is_active, metadata) VALUES
('EN-12668-1', 'NDT - Characterization and verification of UT equipment - Part 1: Instruments', 'European standard for UT instrument verification', '2010', 'European', true, true, '{"focus": "instruments", "region": "EU"}'),
('EN-12668-2', 'NDT - Characterization and verification of UT equipment - Part 2: Probes', 'European standard for UT probe verification', '2010', 'European', true, true, '{"focus": "probes", "region": "EU"}'),
('EN-12668-3', 'NDT - Characterization and verification of UT equipment - Part 3: Combined equipment', 'European standard for combined UT equipment', '2013', 'European', true, true, '{"focus": "combined", "region": "EU"}'),
('EN-ISO-16810', 'NDT - Ultrasonic testing - General principles', 'General principles for ultrasonic testing - Framework standard defining UT methodology', '2024', 'European', true, true, '{"type": "framework", "region": "EU/ISO", "relatedStandards": ["EN-12668", "EN-ISO-16811", "EN-ISO-16823"], "note": "Does not define acceptance criteria"}'),
('EN-ISO-16811', 'NDT - Ultrasonic testing - Sensitivity and range setting', 'Standard for UT sensitivity and range calibration', '2014', 'European', true, true, '{"focus": "calibration", "region": "EU/ISO"}'),
('BS-EN-10228-3', 'NDT of Steel Forgings - Part 3: Ultrasonic Testing of Ferritic or Martensitic Steel Forgings', 'European standard for UT of ferritic/martensitic steel forgings with quality classes 1-4', '2016', 'European', true, true, '{"classes": ["1", "2", "3", "4"], "material": "ferritic steel", "form": "forging"}'),
('BS-EN-10228-4', 'NDT of Steel Forgings - Part 4: Ultrasonic Testing of Austenitic and Austenitic-Ferritic Stainless Steel Forgings', 'European standard for UT of austenitic stainless steel forgings with quality classes 1-3', '2016', 'European', true, true, '{"classes": ["1", "2", "3"], "material": "austenitic stainless steel", "form": "forging"}')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    is_free = true,
    is_active = true;

-- ISO Standards
INSERT INTO standards (code, name, description, version, category, is_free, is_active, metadata) VALUES
('ISO-5577', 'NDT - Ultrasonic testing - Vocabulary', 'International vocabulary for ultrasonic testing', '2017', 'International', true, true, '{"type": "vocabulary"}'),
('ISO-16823', 'NDT - Ultrasonic testing - Transmission technique', 'Standard for through-transmission UT', '2012', 'International', true, true, '{"technique": "transmission"}'),
('ISO-16826', 'NDT - Ultrasonic testing - Examination for discontinuities perpendicular to the surface', 'Standard for detecting surface-perpendicular flaws', '2012', 'International', true, true, '{"focus": "perpendicular discontinuities"}')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    is_free = true,
    is_active = true;

-- Create default "All Standards" bundle for factory deployment
INSERT INTO standard_bundles (name, description, price, discount_percent, is_active) VALUES
('Factory Complete Bundle', 'All standards included - Factory deployment license', 0.00, 100.00, true)
ON CONFLICT DO NOTHING;
