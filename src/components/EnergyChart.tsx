
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
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

interface EnergyChartProps {
  data: EnergyReading[];
}

const formatXAxis = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow border">
        <p className="text-sm font-semibold">{new Date(label).toLocaleString()}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toFixed(2)} ${entry.unit}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EnergyChart = ({ data }: EnergyChartProps) => {
  const [timeRange, setTimeRange] = useState("6h");
  const isMobile = useIsMobile();
  
  const filterDataByTimeRange = (data: EnergyReading[], range: string): EnergyReading[] => {
    const now = Date.now();
    let timeInMillis: number;
    
    switch (range) {
      case "1h":
        timeInMillis = 60 * 60 * 1000;
        break;
      case "6h":
        timeInMillis = 6 * 60 * 60 * 1000;
        break;
      case "12h":
        timeInMillis = 12 * 60 * 60 * 1000;
        break;
      case "24h":
        timeInMillis = 24 * 60 * 60 * 1000;
        break;
      default:
        timeInMillis = 6 * 60 * 60 * 1000;
    }
    
    return data.filter(item => item.timestamp > (now - timeInMillis));
  };
  
  const filteredData = filterDataByTimeRange(data, timeRange);
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Energy Metrics</CardTitle>
          <Tabs value={timeRange} onValueChange={setTimeRange} className="w-[160px]">
            <TabsList className="grid grid-cols-4 h-8">
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="6h">6h</TabsTrigger>
              <TabsTrigger value="12h">12h</TabsTrigger>
              <TabsTrigger value="24h">24h</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={filteredData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              interval={isMobile ? "preserveStartEnd" : "equidistantPreserveStart"} 
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="solarVoltage" 
              name="Solar Voltage" 
              stroke="#FFB800" 
              activeDot={{ r: 6 }} 
              unit="V"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="chargingVoltage" 
              name="Charging Voltage" 
              stroke="#8B5CF6" 
              activeDot={{ r: 6 }} 
              unit="V"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="chargingAmps" 
              name="Charging Amps" 
              stroke="#10B981" 
              activeDot={{ r: 6 }} 
              unit="A"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EnergyChart;
