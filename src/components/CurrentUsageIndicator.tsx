
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CurrentUsageIndicatorProps {
  usage: number;
  max: number;
}

const CurrentUsageIndicator = ({ usage, max }: CurrentUsageIndicatorProps) => {
  const percentage = Math.min(100, Math.max(0, (usage / max) * 100));
  
  let progressColor = "bg-energy-grid";
  if (percentage > 80) {
    progressColor = "bg-energy-load";
  } else if (percentage > 40) {
    progressColor = "bg-energy-solar";
  }
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Current Usage</span>
            <span className="text-sm font-medium">{usage}W / {max}W</span>
          </div>
          <Progress value={percentage} className={progressColor} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentUsageIndicator;
