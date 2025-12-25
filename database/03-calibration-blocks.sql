-- Scan-Master Calibration Blocks Data
-- Pre-populated calibration block catalog for offline factory deployment

-- Create calibration_blocks table if not exists
CREATE TABLE IF NOT EXISTS calibration_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_type TEXT NOT NULL,
    name TEXT NOT NULL,
    material TEXT NOT NULL,
    dimensions JSONB,
    hole_pattern JSONB,
    standard_ref TEXT,
    serial_number TEXT,
    calibration_date DATE,
    next_calibration DATE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calibration_blocks_type ON calibration_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_calibration_blocks_material ON calibration_blocks(material);

-- ASTM E127 Aluminum Reference Blocks (Area-Amplitude)
INSERT INTO calibration_blocks (block_type, name, material, dimensions, hole_pattern, standard_ref, metadata) VALUES
('FBH', 'ASTM E127 #3 FBH Block', 'Aluminum 7075-T6',
 '{"length": 76.2, "width": 38.1, "height": 76.2, "unit": "mm"}',
 '{"holes": [{"diameter": 2.38, "depth": 19.05, "designation": "#3"}]}',
 'ASTM-E127',
 '{"velocity": 6320, "impedance": 17.1}'),

('FBH', 'ASTM E127 #5 FBH Block', 'Aluminum 7075-T6',
 '{"length": 76.2, "width": 38.1, "height": 76.2, "unit": "mm"}',
 '{"holes": [{"diameter": 3.97, "depth": 19.05, "designation": "#5"}]}',
 'ASTM-E127',
 '{"velocity": 6320, "impedance": 17.1}'),

('FBH', 'ASTM E127 #8 FBH Block', 'Aluminum 7075-T6',
 '{"length": 76.2, "width": 38.1, "height": 76.2, "unit": "mm"}',
 '{"holes": [{"diameter": 6.35, "depth": 19.05, "designation": "#8"}]}',
 'ASTM-E127',
 '{"velocity": 6320, "impedance": 17.1}')
ON CONFLICT DO NOTHING;

-- ASTM E428 Steel Reference Blocks
INSERT INTO calibration_blocks (block_type, name, material, dimensions, hole_pattern, standard_ref, metadata) VALUES
('FBH', 'ASTM E428 Steel #3 Block', 'Steel 4340',
 '{"length": 76.2, "width": 38.1, "height": 76.2, "unit": "mm"}',
 '{"holes": [{"diameter": 2.38, "depth": 19.05, "designation": "#3"}]}',
 'ASTM-E428',
 '{"velocity": 5920, "impedance": 46.0}'),

('FBH', 'ASTM E428 Steel #5 Block', 'Steel 4340',
 '{"length": 76.2, "width": 38.1, "height": 76.2, "unit": "mm"}',
 '{"holes": [{"diameter": 3.97, "depth": 19.05, "designation": "#5"}]}',
 'ASTM-E428',
 '{"velocity": 5920, "impedance": 46.0}')
ON CONFLICT DO NOTHING;

-- Titanium Reference Blocks
INSERT INTO calibration_blocks (block_type, name, material, dimensions, hole_pattern, standard_ref, metadata) VALUES
('FBH', 'Ti-6Al-4V #3 FBH Block', 'Titanium Ti-6Al-4V',
 '{"length": 76.2, "width": 38.1, "height": 76.2, "unit": "mm"}',
 '{"holes": [{"diameter": 2.38, "depth": 19.05, "designation": "#3"}]}',
 'AMS-2631',
 '{"velocity": 6100, "impedance": 27.3}'),

('FBH', 'Ti-6Al-4V #5 FBH Block', 'Titanium Ti-6Al-4V',
 '{"length": 76.2, "width": 38.1, "height": 76.2, "unit": "mm"}',
 '{"holes": [{"diameter": 3.97, "depth": 19.05, "designation": "#5"}]}',
 'AMS-2631',
 '{"velocity": 6100, "impedance": 27.3}')
ON CONFLICT DO NOTHING;

-- Distance-Amplitude Blocks (DAC)
INSERT INTO calibration_blocks (block_type, name, material, dimensions, hole_pattern, standard_ref, metadata) VALUES
('DAC', 'Aluminum DAC Block - Multi-depth', 'Aluminum 7075-T6',
 '{"length": 152.4, "width": 50.8, "height": 25.4, "unit": "mm"}',
 '{"holes": [
   {"diameter": 3.18, "depth": 6.35, "designation": "0.25in"},
   {"diameter": 3.18, "depth": 12.7, "designation": "0.5in"},
   {"diameter": 3.18, "depth": 25.4, "designation": "1.0in"},
   {"diameter": 3.18, "depth": 50.8, "designation": "2.0in"},
   {"diameter": 3.18, "depth": 76.2, "designation": "3.0in"}
 ]}',
 'ASTM-E127',
 '{"type": "DAC", "velocity": 6320}'),

('DAC', 'Steel DAC Block - Multi-depth', 'Steel 4340',
 '{"length": 152.4, "width": 50.8, "height": 25.4, "unit": "mm"}',
 '{"holes": [
   {"diameter": 3.18, "depth": 12.7, "designation": "0.5in"},
   {"diameter": 3.18, "depth": 25.4, "designation": "1.0in"},
   {"diameter": 3.18, "depth": 50.8, "designation": "2.0in"},
   {"diameter": 3.18, "depth": 76.2, "designation": "3.0in"},
   {"diameter": 3.18, "depth": 101.6, "designation": "4.0in"}
 ]}',
 'ASTM-E428',
 '{"type": "DAC", "velocity": 5920}')
ON CONFLICT DO NOTHING;

-- IIW/V1 Type Reference Blocks (Angle Beam Calibration)
INSERT INTO calibration_blocks (block_type, name, material, dimensions, hole_pattern, standard_ref, metadata) VALUES
('IIW', 'IIW Type 1 (V1) Block', 'Steel Low Carbon',
 '{"length": 300, "width": 100, "height": 25, "radius": 100, "unit": "mm"}',
 '{"features": ["100mm radius", "1.5mm SDH", "50mm reference arc"]}',
 'EN-12668-2',
 '{"type": "IIW-V1", "velocity": 5920, "angles": [45, 60, 70]}'),

('IIW', 'IIW Type 2 (V2) Miniature Block', 'Steel Low Carbon',
 '{"length": 75, "width": 43, "height": 12.5, "radius": 25, "unit": "mm"}',
 '{"features": ["25mm radius", "miniature"]}',
 'EN-12668-2',
 '{"type": "IIW-V2", "velocity": 5920}')
ON CONFLICT DO NOTHING;

-- AWS/ASME Angle Beam Blocks
INSERT INTO calibration_blocks (block_type, name, material, dimensions, hole_pattern, standard_ref, metadata) VALUES
('DSC', 'AWS DSC Block', 'Steel Carbon',
 '{"length": 178, "width": 76, "height": 19, "unit": "mm"}',
 '{"features": ["distance calibration", "side-drilled holes"]}',
 'AWS-D1.1',
 '{"type": "DSC", "application": "weld inspection"}'),

('SC', 'ASME Basic Calibration Block', 'Steel Carbon',
 '{"length": 152, "width": 76, "height": 51, "unit": "mm"}',
 '{"features": ["notches", "side-drilled holes", "various depths"]}',
 'ASME-V',
 '{"type": "basic", "application": "general calibration"}')
ON CONFLICT DO NOTHING;

-- Common SDH (Side-Drilled Hole) Blocks
INSERT INTO calibration_blocks (block_type, name, material, dimensions, hole_pattern, standard_ref, metadata) VALUES
('SDH', 'SDH Block 1.5mm', 'Steel 4340',
 '{"length": 150, "width": 50, "height": 50, "unit": "mm"}',
 '{"holes": [{"diameter": 1.5, "type": "through", "positions": [12.5, 25, 37.5]}]}',
 'ASTM-A388',
 '{"type": "SDH", "velocity": 5920}'),

('SDH', 'SDH Block 3mm', 'Steel 4340',
 '{"length": 150, "width": 50, "height": 50, "unit": "mm"}',
 '{"holes": [{"diameter": 3.0, "type": "through", "positions": [12.5, 25, 37.5]}]}',
 'ASTM-A388',
 '{"type": "SDH", "velocity": 5920}')
ON CONFLICT DO NOTHING;

-- Step Wedge / Thickness Calibration Blocks
INSERT INTO calibration_blocks (block_type, name, material, dimensions, hole_pattern, standard_ref, metadata) VALUES
('STEP', 'Aluminum Step Wedge 5-50mm', 'Aluminum 7075-T6',
 '{"length": 150, "width": 25, "steps": [5, 10, 15, 20, 25, 30, 40, 50], "unit": "mm"}',
 '{"type": "step_wedge", "step_count": 8}',
 'ASTM-E797',
 '{"type": "thickness_calibration", "velocity": 6320}'),

('STEP', 'Steel Step Wedge 10-100mm', 'Steel 4340',
 '{"length": 200, "width": 25, "steps": [10, 20, 30, 40, 50, 60, 80, 100], "unit": "mm"}',
 '{"type": "step_wedge", "step_count": 8}',
 'ASTM-E797',
 '{"type": "thickness_calibration", "velocity": 5920}')
ON CONFLICT DO NOTHING;

-- Create view for easy block lookup
CREATE OR REPLACE VIEW calibration_block_catalog AS
SELECT
    id,
    block_type,
    name,
    material,
    standard_ref,
    dimensions->>'length' || 'x' || dimensions->>'width' || 'x' || dimensions->>'height' || ' ' || dimensions->>'unit' as size,
    is_active
FROM calibration_blocks
WHERE is_active = true
ORDER BY block_type, material, name;
