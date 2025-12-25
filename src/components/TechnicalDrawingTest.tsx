import { useState } from 'react';
import { RealTimeTechnicalDrawing } from './RealTimeTechnicalDrawing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const geometryTypes = [
  'box',
  'plate',
  'bar',
  'cylinder',
  'tube',
  'rectangular_tube',
  'sphere',
  'cone',
  'hexagon',
  'disk',
  'ring',
  'pyramid',
  'ellipse',
  'forging',
  'irregular'
];

export function TechnicalDrawingTest() {
  const [selectedGeometry, setSelectedGeometry] = useState('disk');
  const [dimensions, setDimensions] = useState({
    length: 200,
    width: 150,
    thickness: 30,
    diameter: 180,
    innerDiameter: 100,
    outerDiameter: 180,
    wallThickness: 10
  });
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showScanCoverage, setShowScanCoverage] = useState(true);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Technical Drawing Test - All Geometry Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="geometry">Geometry Type</Label>
              <Select value={selectedGeometry} onValueChange={setSelectedGeometry}>
                <SelectTrigger id="geometry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {geometryTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="length">Length (mm)</Label>
              <Input
                id="length"
                type="number"
                value={dimensions.length}
                onChange={(e) => setDimensions({...dimensions, length: parseInt(e.target.value) || 100})}
              />
            </div>
            
            <div>
              <Label htmlFor="width">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                value={dimensions.width}
                onChange={(e) => setDimensions({...dimensions, width: parseInt(e.target.value) || 50})}
              />
            </div>
            
            <div>
              <Label htmlFor="thickness">Thickness (mm)</Label>
              <Input
                id="thickness"
                type="number"
                value={dimensions.thickness}
                onChange={(e) => setDimensions({...dimensions, thickness: parseInt(e.target.value) || 10})}
              />
            </div>
            
            <div>
              <Label htmlFor="diameter">Diameter (mm)</Label>
              <Input
                id="diameter"
                type="number"
                value={dimensions.diameter}
                onChange={(e) => setDimensions({...dimensions, diameter: parseInt(e.target.value) || 100})}
              />
            </div>
            
            <div>
              <Label htmlFor="innerDiameter">Inner Diameter (mm)</Label>
              <Input
                id="innerDiameter"
                type="number"
                value={dimensions.innerDiameter}
                onChange={(e) => setDimensions({...dimensions, innerDiameter: parseInt(e.target.value) || 80})}
              />
            </div>
          </div>
          
          <div className="flex gap-6 mb-6">
            <div className="flex items-center space-x-2">
              <Switch id="grid" checked={showGrid} onCheckedChange={setShowGrid} />
              <Label htmlFor="grid">Show Grid</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="dimensions" checked={showDimensions} onCheckedChange={setShowDimensions} />
              <Label htmlFor="dimensions">Show Dimensions</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="scan" checked={showScanCoverage} onCheckedChange={setShowScanCoverage} />
              <Label htmlFor="scan">Show Scan Coverage</Label>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-900">
            <RealTimeTechnicalDrawing
              partType={selectedGeometry as any}
              dimensions={dimensions}
              showGrid={showGrid}
              showDimensions={showDimensions}
              showScanCoverage={showScanCoverage}
              viewMode="multi"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}