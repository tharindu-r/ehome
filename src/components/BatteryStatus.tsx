
import { Battery, BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BatteryStatusProps {
  voltage: number;
  percentage: number;
}

const getBatteryIcon = (percentage: number) => {
  if (percentage > 80) return <BatteryFull className="h-6 w-6 text-green-500" />;
  if (percentage > 40) return <BatteryMedium className="h-6 w-6 text-orange-400" />;
  return <BatteryLow className="h-6 w-6 text-red-500" />;
};

const getBatteryColor = (percentage: number) => {
  if (percentage > 80) return "text-green-500";
  if (percentage > 40) return "text-orange-400";
  return "text-red-500";
};

const BatteryStatus = ({ voltage, percentage }: BatteryStatusProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {getBatteryIcon(percentage)}
          Battery Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Voltage</span>
            <span className="text-xl font-semibold">{voltage.toFixed(2)}V</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Charge</span>
            <span className={`text-xl font-semibold ${getBatteryColor(percentage)}`}>
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatteryStatus;
