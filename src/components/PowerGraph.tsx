
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { EnergyReading } from "@/services/energyData";
import { useIsMobile } from "@/hooks/use-mobile";

interface PowerGraphProps {
  data: EnergyReading[];
}

const formatXAxis = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const calculatePower = (item: EnergyReading): number => {
  return item.chargingVoltage * item.chargingAmps;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow border">
        <p className="text-sm font-semibold">{new Date(label).toLocaleString()}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          {`Power: ${payload[0].value.toFixed(0)} W`}
        </p>
      </div>
    );
  }
  return null;
};

const PowerGraph = ({ data }: PowerGraphProps) => {
  const isMobile = useIsMobile();
  
  // Transform data to calculate power
  const powerData = data.map(item => ({
    timestamp: item.timestamp,
    power: calculatePower(item)
  }));
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Power Output</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={powerData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              interval={isMobile ? "preserveStartEnd" : "equidistantPreserveStart"} 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="power" 
              stroke="#8B5CF6" 
              fillOpacity={1}
              fill="url(#colorPower)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PowerGraph;
