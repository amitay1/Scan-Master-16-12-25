-- Scan-Master Standards Data
-- Pre-populated UT standards for offline factory deployment
-- All standards set to is_free = true for factory installations

-- AMS Standards (Aerospace Material Specifications)
INSERT INTO standards (code, name, description, version, category, is_free, is_active, metadata) VALUES
('AMS-STD-2154', 'Inspection, Ultrasonic, Wrought Metals', 'Aerospace standard for ultrasonic inspection of wrought metal products including acceptance criteria classes AAA, AA, A, B, C', '2019', 'Aerospace', true, true, '{"classes": ["AAA", "AA", "A", "B", "C"], "materials": ["aluminum", "titanium", "steel", "nickel"]}'),
('AMS-2631', 'Ultrasonic Inspection, Titanium and Titanium Alloy Bar and Billet', 'Standard for ultrasonic inspection of titanium bars and billets', '2020', 'Aerospace', true, true, '{"material": "titanium", "forms": ["bar", "billet"]}'),
('AMS-2632', 'Ultrasonic Inspection, Titanium and Titanium Alloy Plate', 'Standard for ultrasonic inspection of titanium plate products', '2020', 'Aerospace', true, true, '{"material": "titanium", "forms": ["plate"]}'),
('AMS-2628', 'Ultrasonic Inspection, Aluminum Alloy Wrought Products', 'Standard for ultrasonic inspection of aluminum wrought products', '2019', 'Aerospace', true, true, '{"material": "aluminum", "forms": ["plate", "bar", "forging"]}')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    is_free = true,
    is_active = true;

-- ASTM Standards
INSERT INTO standards (code, name, description, version, category, is_free, is_active, metadata) VALUES
('ASTM-E2375', 'Standard Practice for Ultrasonic Testing of Wrought Products', 'ASTM standard for ultrasonic examination of wrought products', '2021', 'Industrial', true, true, '{"methods": ["contact", "immersion"], "techniques": ["straight beam", "angle beam"]}'),
('ASTM-E127', 'Practice for Fabricating and Checking Aluminum Alloy Ultrasonic Standard Reference Blocks', 'Standard for aluminum reference blocks with flat-bottom holes', '2020', 'Calibration', true, true, '{"blockType": "FBH", "material": "aluminum"}'),
('ASTM-E428', 'Practice for Fabrication and Control of Metal, Other than Aluminum, Reference Blocks', 'Standard for steel and other metal reference blocks', '2021', 'Calibration', true, true, '{"blockType": "FBH", "materials": ["steel", "titanium"]}'),
('ASTM-E317', 'Practice for Evaluating Performance Characteristics of Ultrasonic Pulse-Echo Testing Instruments', 'Standard for evaluating UT instrument performance', '2020', 'Equipment', true, true, '{"testTypes": ["linearity", "resolution", "sensitivity"]}'),
('ASTM-A388', 'Practice for Ultrasonic Examination of Steel Forgings', 'Standard for UT of steel forgings', '2019', 'Industrial', true, true, '{"material": "steel", "form": "forging"}'),
('ASTM-E164', 'Practice for Contact Ultrasonic Testing of Weldments', 'Standard for UT of welds using contact method', '2019', 'Welding', true, true, '{"method": "contact", "application": "weldments"}')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    is_free = true,
    is_active = true;

-- TUV Standards (German/European)
INSERT INTO standards (code, name, description, version, category, is_free, is_active, metadata) VALUES
('EN-12668-1', 'NDT - Characterization and verification of UT equipment - Part 1: Instruments', 'European standard for UT instrument verification', '2010', 'European', true, true, '{"focus": "instruments", "region": "EU"}'),
('EN-12668-2', 'NDT - Characterization and verification of UT equipment - Part 2: Probes', 'European standard for UT probe verification', '2010', 'European', true, true, '{"focus": "probes", "region": "EU"}'),
('EN-12668-3', 'NDT - Characterization and verification of UT equipment - Part 3: Combined equipment', 'European standard for combined UT equipment', '2013', 'European', true, true, '{"focus": "combined", "region": "EU"}'),
('EN-ISO-16810', 'NDT - Ultrasonic testing - General principles', 'General principles for ultrasonic testing', '2014', 'European', true, true, '{"type": "general", "region": "EU/ISO"}'),
('EN-ISO-16811', 'NDT - Ultrasonic testing - Sensitivity and range setting', 'Standard for UT sensitivity and range calibration', '2014', 'European', true, true, '{"focus": "calibration", "region": "EU/ISO"}')
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
