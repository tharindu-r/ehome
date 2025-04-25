
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ComposedChart, 
  Area, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { EnergyReading } from "@/services/energyData";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PowerGraphProps {
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
            {`${entry.name}: ${entry.value.toFixed(1)} W`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PowerGraph = ({ data }: PowerGraphProps) => {
  const isMobile = useIsMobile();
  const [hasData, setHasData] = useState(true);
  
  useEffect(() => {
    // Check if we have valid data
    if (!data || data.length === 0 || data.every(item => 
      item.solarPower === 0 && item.inverterLoad === 0)) {
      setHasData(false);
    } else {
      setHasData(true);
    }
  }, [data]);

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Power Output</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No power data available</AlertDescription>
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
        <CardTitle className="text-lg font-semibold">Power Output</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="solarPowerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              interval={isMobile ? "preserveStartEnd" : "equidistantPreserveStart"} 
              tick={{ fontSize: 12 }}
              stroke="currentColor"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              stroke="currentColor"
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="solarPower"
              name="Solar Power"
              stroke="#FFB800"
              fill="url(#solarPowerGradient)"
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="inverterLoad"
              name="Inverter Load"
              stroke="#F43F5E"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PowerGraph;
