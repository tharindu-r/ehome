import { useEffect, useState } from "react";
import { 
  getHistoricalData, 
  getCurrentReading,
  getEnergyStats,
  EnergyReading,
  EnergyStats
} from "@/services/energyData";
import EnergyHeader from "@/components/EnergyHeader";
import PowerGraph from "@/components/PowerGraph";
import ChargingGraph from "@/components/ChargingGraph";
import BatteryStatus from "@/components/BatteryStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Index = () => {
  const [historicalData, setHistoricalData] = useState<EnergyReading[]>([]);
  const [currentReading, setCurrentReading] = useState<EnergyReading | null>(null);
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const data = await getHistoricalData();
        if (data.length === 0) {
          throw new Error("No historical data received");
        }
        
        const reading = await getCurrentReading();
        const energyStats = await getEnergyStats([...data, reading]);
        
        setHistoricalData(data);
        setCurrentReading(reading);
        setStats(energyStats);
        setLastUpdated(Date.now());
        setIsLoading(false);
        setError(null);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error("Error fetching energy data:", error);
        
        // Increment retry count
        setRetryCount(prev => prev + 1);
        
        if (retryCount < 3) {
          // Auto-retry up to 3 times
          toast.error("Connection issue. Retrying...");
          setTimeout(fetchData, 3000); // Retry after 3 seconds
        } else {
          setError("Failed to load energy data. Please try again.");
          toast.error("Failed to load energy data. Please try again.");
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
  }, [error, retryCount]);

  // Separate effect for regular updates to ensure energy balance is updated
  useEffect(() => {
    const updateInterval = setInterval(async () => {
      if (!error && currentReading) {
        try {
          const newReading = await getCurrentReading();
          setCurrentReading(newReading);
          setLastUpdated(Date.now());
          
          // Update historical data
          setHistoricalData(prev => {
            const newData = [...prev, newReading].slice(-96); // Keep last 96 readings
            return newData;
          });
          
          // Update stats independently to ensure they refresh
          const updatedStats = await getEnergyStats([...historicalData, newReading]);
          setStats(updatedStats);
        } catch (err) {
          console.error("Error in update interval:", err);
        }
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(updateInterval);
  }, [error, currentReading, historicalData]);

  if (isLoading) {
    return (
      <div className="container px-4 py-8 max-w-6xl mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading solar monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error || !currentReading || !stats) {
    return (
      <div className="container px-4 py-8 max-w-6xl mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">{error || "Failed to load data"}</p>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              setRetryCount(0);
              window.location.reload();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-6xl mx-auto">
      <EnergyHeader 
        batteryPercentage={stats?.batteryPercentage || 0}
        currentPower={stats?.currentPowerUsage || 0}
        lastUpdated={lastUpdated}
      />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Inverter Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-energy-load">
              {Math.round(currentReading?.inverterLoad || 0)}W
            </div>
            <p className="text-sm text-muted-foreground">Current consumption</p>
          </CardContent>
        </Card>

        <BatteryStatus 
          voltage={currentReading?.chargingVoltage || 0}
          percentage={stats?.batteryPercentage || 0}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Energy Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Charged</span>
                <span className="text-xl font-semibold text-energy-grid">
                  {stats?.dailyEnergyCharged.toFixed(2)}Wh
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Discharged</span>
                <span className="text-xl font-semibold text-energy-load">
                  {stats?.dailyEnergyDischarged.toFixed(2)}Wh
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Net</span>
                <span className="text-xl font-semibold">
                  {((stats?.dailyEnergyCharged || 0) - (stats?.dailyEnergyDischarged || 0)).toFixed(2)}Wh
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mb-6">
        <ChargingGraph data={historicalData} />
        <PowerGraph data={historicalData} />
      </div>
    </div>
  );
};

export default Index;
