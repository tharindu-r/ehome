
import { Battery, Sun, ZapIcon, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

interface EnergyHeaderProps {
  batteryPercentage: number;
  currentPower: number;
  lastUpdated: number; // Add this new prop
}

const EnergyHeader = ({ batteryPercentage, currentPower, lastUpdated }: EnergyHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-full">
          <Sun className="h-6 w-6 text-energy-solar" />
        </div>
        <h1 className="text-xl font-semibold md:text-2xl">Solar Monitor</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ZapIcon className={`h-5 w-5 ${currentPower > 0 ? 'text-energy-grid animate-pulse-slow' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium">{currentPower}W</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Battery className={`h-5 w-5 ${batteryPercentage > 80 ? 'text-energy-battery' : batteryPercentage > 20 ? 'text-energy-grid' : 'text-energy-load'}`} />
          <span className="text-sm font-medium">{batteryPercentage}%</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {format(lastUpdated, 'HH:mm:ss')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnergyHeader;
