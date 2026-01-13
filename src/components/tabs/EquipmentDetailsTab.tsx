import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { EquipmentDetails } from "@/types/inspectionReport";

interface EquipmentDetailsTabProps {
  data: EquipmentDetails;
  onChange: (data: EquipmentDetails) => void;
}

export const EquipmentDetailsTab = ({ data, onChange }: EquipmentDetailsTabProps) => {
  const updateField = <K extends keyof EquipmentDetails>(field: K, value: EquipmentDetails[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4 p-2">
      {/* Ultrasonic Generator */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">
          Ultrasonic Generator / Générateur ultrasonore
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Make / Manufacturer</Label>
            <Input
              value={data.generatorMake}
              onChange={(e) => updateField('generatorMake', e.target.value)}
              placeholder="METALSCAN"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Model</Label>
            <Input
              value={data.generatorModel}
              onChange={(e) => updateField('generatorModel', e.target.value)}
              placeholder="DIGIT2"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Serial N° / N° de série</Label>
            <Input
              value={data.generatorSerial}
              onChange={(e) => updateField('generatorSerial', e.target.value)}
              placeholder="n°207 + MSPR2 n°211"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Last Calibration Date</Label>
            <Input
              type="date"
              value={data.generatorCalibrationDate}
              onChange={(e) => updateField('generatorCalibrationDate', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Immersion Transducer */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">
          Immersion Transducer / Traducteur immersion
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Model</Label>
            <Input
              value={data.immersionTransducerModel}
              onChange={(e) => updateField('immersionTransducerModel', e.target.value)}
              placeholder="AERO C"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Serial N°</Label>
            <Input
              value={data.immersionTransducerSerial}
              onChange={(e) => updateField('immersionTransducerSerial', e.target.value)}
              placeholder="061303-5"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Last Calibration Date</Label>
            <Input
              type="date"
              value={data.immersionTransducerCalibrationDate}
              onChange={(e) => updateField('immersionTransducerCalibrationDate', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Contact Transducer */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">
          Contact Transducer / Traducteurs contact
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Model</Label>
            <Input
              value={data.contactTransducerModel}
              onChange={(e) => updateField('contactTransducerModel', e.target.value)}
              placeholder="Contact probe model"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Serial N°</Label>
            <Input
              value={data.contactTransducerSerial}
              onChange={(e) => updateField('contactTransducerSerial', e.target.value)}
              placeholder="Serial number"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Last Calibration Date</Label>
            <Input
              type="date"
              value={data.contactTransducerCalibrationDate}
              onChange={(e) => updateField('contactTransducerCalibrationDate', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Scan Parameters */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">
          Scan Parameters / Paramètres
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Frequency / Fréquence</Label>
            <Input
              value={data.frequency}
              onChange={(e) => updateField('frequency', e.target.value)}
              placeholder="5 MHz"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Probe Diameter / Diamètre</Label>
            <Input
              value={data.probeDiameter}
              onChange={(e) => updateField('probeDiameter', e.target.value)}
              placeholder="19 mm"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Water Path / Hauteur d'eau</Label>
            <Input
              value={data.waterPath}
              onChange={(e) => updateField('waterPath', e.target.value)}
              placeholder="160 mm"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Software */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">
          Software / Logiciel
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Software Name</Label>
            <Input
              value={data.softwareName}
              onChange={(e) => updateField('softwareName', e.target.value)}
              placeholder="Winscan"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Version</Label>
            <Input
              value={data.softwareVersion}
              onChange={(e) => updateField('softwareVersion', e.target.value)}
              placeholder="v4.1.3"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">UT Config / Setup Name</Label>
            <Input
              value={data.utConfigName}
              onChange={(e) => updateField('utConfigName', e.target.value)}
              placeholder="Forgital_FMDL"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
