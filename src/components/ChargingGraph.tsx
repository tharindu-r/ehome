
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ComposedChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";
import { EnergyReading } from "@/services/energyData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ChargingGraphProps {
  data: EnergyReading[];
}

const formatXAxis = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{new Date(label).toLocaleString()}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toFixed(2)} ${entry.unit}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChargingGraph = ({ data }: ChargingGraphProps) => {
  const isMobile = useIsMobile();

  if (!data || data.length === 0 || data.every(item => 
    item.solarVoltage === 0 && item.chargingVoltage === 0)) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Charging Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No charging data available</AlertDescription>
          </Alert>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Waiting for data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Charging Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              interval={isMobile ? "preserveStartEnd" : "equidistantPreserveStart"} 
              tick={{ fontSize: 12 }}
              stroke="currentColor"
            />
            <YAxis 
              yAxisId="voltage"
              orientation="left"
              domain={[0, 'auto']}
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="current"
              orientation="right"
              domain={[0, 'auto']}
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              label={{ value: 'Current (A)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="voltage"
              type="monotone"
              dataKey="solarVoltage"
              name="Solar Voltage"
              stroke="#FFB800"
              unit="V"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="voltage"
              type="monotone"
              dataKey="chargingVoltage"
              name="Battery Voltage"
              stroke="#8B5CF6"
              unit="V"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="current"
              type="monotone"
              dataKey="chargingAmps"
              name="Charging Current"
              stroke="#10B981"
              unit="A"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ChargingGraph;
