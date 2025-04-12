
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, BatteryCharging, Gauge, Zap } from "lucide-react";
import { EnergyStats as EnergyStatsType } from "@/services/energyData";

interface EnergyStatsProps {
  stats: EnergyStatsType;
}

const StatCard = ({ title, value, icon, description, color }: { 
  title: string; 
  value: React.ReactNode; 
  icon: React.ReactNode;
  description?: string;
  color?: string;
}) => (
  <Card className="overflow-hidden">
    <CardHeader className={`p-4 ${color}`}>
      <CardTitle className="text-sm flex justify-between items-center">
        {title}
        {icon}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-2">
      <div className="text-2xl font-bold">{value}</div>
      {description && <CardDescription>{description}</CardDescription>}
    </CardContent>
  </Card>
);

const EnergyStatsComponent = ({ stats }: EnergyStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard 
        title="Battery" 
        value={`${stats.batteryPercentage}%`} 
        icon={<Battery className="h-4 w-4" />}
        description="Current charge"
        color="bg-energy-battery/10"
      />
      <StatCard 
        title="Charged" 
        value={`${stats.dailyEnergyCharged}Wh`} 
        icon={<BatteryCharging className="h-4 w-4" />}
        description="Today"
        color="bg-energy-solar/10"
      />
      <StatCard 
        title="Power Usage" 
        value={`${stats.currentPowerUsage}W`} 
        icon={<Gauge className="h-4 w-4" />}
        description="Current"
        color="bg-energy-grid/10"
      />
      <StatCard 
        title="Load" 
        value={`${stats.currentLoad}W`} 
        icon={<Zap className="h-4 w-4" />}
        description="Current draw"
        color="bg-energy-load/10"
      />
    </div>
  );
};

export default EnergyStatsComponent;
