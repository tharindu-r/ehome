
import { useEffect, useState } from "react";
import { 
  getHistoricalData, 
  getCurrentReading, 
  getEnergyStats,
  EnergyReading,
  EnergyStats
} from "@/services/energyData";
import EnergyHeader from "@/components/EnergyHeader";
import EnergyStatsComponent from "@/components/EnergyStats";
import EnergyChart from "@/components/EnergyChart";
import PowerGraph from "@/components/PowerGraph";
import CurrentUsageIndicator from "@/components/CurrentUsageIndicator";
import LoadDistribution from "@/components/LoadDistribution";
import { toast } from "sonner";

const Index = () => {
  const [historicalData, setHistoricalData] = useState<EnergyReading[]>([]);
  const [currentReading, setCurrentReading] = useState<EnergyReading | null>(null);
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);

  // Load distribution data (simulated)
  const loadDistribution = [
    { name: "Lights", value: 35, color: "#8B5CF6" },
    { name: "HVAC", value: 45, color: "#10B981" },
    { name: "Appliances", value: 85, color: "#F43F5E" },
    { name: "Other", value: 20, color: "#FFB800" }
  ];

  useEffect(() => {
    // Load initial data
    const fetchData = async () => {
      try {
        const data = await getHistoricalData();
        const reading = await getCurrentReading();
        const energyStats = await getEnergyStats([...data, reading]);
        
        setHistoricalData(data);
        setCurrentReading(reading);
        setStats(energyStats);
        setLastUpdated(Date.now());
        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error("Error fetching energy data:", error);
        setError("Failed to load energy data");
        toast.error("Failed to load energy data. Please try again.");
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up polling for real-time updates
    const interval = setInterval(async () => {
      try {
        const newReading = await getCurrentReading();
        setCurrentReading(newReading);
        setLastUpdated(Date.now());
        
        setHistoricalData(prev => {
          const newData = [...prev, newReading].slice(-96); // Keep last 96 readings
          
          // Update stats with new data
          getEnergyStats(newData)
            .then(updatedStats => setStats(updatedStats))
            .catch(err => console.error("Error updating stats:", err));
            
          return newData;
        });
      } catch (error) {
        console.error("Error updating energy data:", error);
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

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
        batteryPercentage={stats.batteryPercentage} 
        currentPower={stats.currentPowerUsage}
        lastUpdated={lastUpdated}
      />
      
      <EnergyStatsComponent stats={stats} />
      
      <CurrentUsageIndicator usage={stats.currentLoad} max={500} />
      
      <EnergyChart data={historicalData} />
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <PowerGraph data={historicalData} />
        <LoadDistribution data={loadDistribution} />
      </div>
    </div>
  );
};

export default Index;
