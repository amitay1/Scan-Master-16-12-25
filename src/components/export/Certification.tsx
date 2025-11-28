/**
 * Certification Component for TÜV Export System
 * Handles Level II/III certification information and signatures
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Award, Shield } from 'lucide-react';

export interface CertificationData {
  inspectorName: string;
  inspectorLevel: "Level I" | "Level II" | "Level III";
  inspectorCertification: string;
  reviewerName?: string;
  reviewerLevel?: "Level II" | "Level III";
  reviewerCertification?: string;
  approverName?: string;
  approverLevel?: "Level III";
  approverCertification?: string;
  customerRepresentative?: string;
}

interface CertificationProps {
  data: CertificationData;
  onChange: (data: CertificationData) => void;
}

export const Certification: React.FC<CertificationProps> = ({
  data,
  onChange
}) => {
  const handleChange = (field: keyof CertificationData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const getLevelColor = (level?: string): string => {
    switch (level) {
      case "Level I": return "bg-green-100 text-green-700";
      case "Level II": return "bg-blue-100 text-blue-700";
      case "Level III": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getLevelIcon = (level?: string) => {
    switch (level) {
      case "Level I": return <Shield className="w-3 h-3" />;
      case "Level II": return <Award className="w-3 h-3" />;
      case "Level III": return <UserCheck className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Inspector Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="w-5 h-5" />
            Inspector Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspector-name">Inspector Name *</Label>
              <Input
                id="inspector-name"
                value={data.inspectorName}
                onChange={(e) => handleChange('inspectorName', e.target.value)}
                placeholder="Full name of inspector"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inspector-level">Certification Level *</Label>
              <Select
                value={data.inspectorLevel}
                onValueChange={(value) => handleChange('inspectorLevel', value as "Level I" | "Level II" | "Level III")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Level I">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Level I - Trainee
                    </div>
                  </SelectItem>
                  <SelectItem value="Level II">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Level II - Technician
                    </div>
                  </SelectItem>
                  <SelectItem value="Level III">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Level III - Specialist
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspector-cert">Certificate Number *</Label>
            <Input
              id="inspector-cert"
              value={data.inspectorCertification}
              onChange={(e) => handleChange('inspectorCertification', e.target.value)}
              placeholder="SNT-TC-1A or equivalent certificate number"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge className={getLevelColor(data.inspectorLevel)}>
              {getLevelIcon(data.inspectorLevel)}
              <span className="ml-1">{data.inspectorLevel}</span>
            </Badge>
            <span className="text-sm text-gray-500">Current certification level</span>
          </div>
        </CardContent>
      </Card>

      {/* Reviewer Information (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5" />
            Reviewer Information (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reviewer-name">Reviewer Name</Label>
              <Input
                id="reviewer-name"
                value={data.reviewerName || ''}
                onChange={(e) => handleChange('reviewerName', e.target.value)}
                placeholder="Level II/III reviewer"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reviewer-level">Reviewer Level</Label>
              <Select
                value={data.reviewerLevel || ''}
                onValueChange={(value) => handleChange('reviewerLevel', value as "Level II" | "Level III")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Level II">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Level II - Technician
                    </div>
                  </SelectItem>
                  <SelectItem value="Level III">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Level III - Specialist
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewer-cert">Reviewer Certificate Number</Label>
            <Input
              id="reviewer-cert"
              value={data.reviewerCertification || ''}
              onChange={(e) => handleChange('reviewerCertification', e.target.value)}
              placeholder="SNT-TC-1A or equivalent certificate number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Approver Information (Level III Required) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Approver Information (Level III)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="approver-name">Approver Name</Label>
              <Input
                id="approver-name"
                value={data.approverName || ''}
                onChange={(e) => handleChange('approverName', e.target.value)}
                placeholder="Level III approver"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="approver-level">Approver Level</Label>
              <Select
                value={data.approverLevel || 'Level III'}
                onValueChange={(value) => handleChange('approverLevel', value as "Level III")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Level III">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Level III - Specialist
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approver-cert">Approver Certificate Number</Label>
            <Input
              id="approver-cert"
              value={data.approverCertification || ''}
              onChange={(e) => handleChange('approverCertification', e.target.value)}
              placeholder="SNT-TC-1A Level III certificate number"
            />
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              <strong>Note:</strong> Level III certification is required for final approval of inspection procedures and results.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Customer Representative */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="w-5 h-5" />
            Customer Representative (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-rep">Customer Representative Name</Label>
            <Input
              id="customer-rep"
              value={data.customerRepresentative || ''}
              onChange={(e) => handleChange('customerRepresentative', e.target.value)}
              placeholder="Customer witness/representative"
            />
            <p className="text-xs text-gray-500">
              Optional customer representative to witness inspection
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Certification Standards Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Certification Standards</span>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          All personnel certifications must comply with SNT-TC-1A, EN ISO 9712, or equivalent national standards. 
          Level II personnel may independently perform inspections, while Level III personnel provide technical 
          leadership and final approval authority.
        </p>
      </div>
    </div>
  );
};

export default Certification;