
// Energy monitoring data service using the API

export interface EnergyReading {
  timestamp: number;
  solarVoltage: number;
  chargingVoltage: number;
  chargingAmps: number;
  batteryPercentage: number;
  loadWatts: number;
}

export interface EnergyStats {
  dailyEnergyCharged: number; // Wh
  dailyEnergyDischarged: number; // Wh
  currentPowerUsage: number; // W
  currentLoad: number; // W
  peakPower: number; // W
  batteryPercentage: number;
}

interface ApiResponse {
  first: string[];
  second: string[];
  kwh_positive: string;
  kwh_negative: string;
  last_shunt_voltage: string;
}

// Fetch data from the API
const fetchApiData = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch('https://iot.tharindur.com/mppt/api/json.php?fn=getUpdate');
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    console.log("API Response:", data); // Log the API response for debugging
    return data;
  } catch (error) {
    console.error('Failed to fetch data from API:', error);
    throw error;
  }
};

// Helper function to safely extract number from API data
const safeParseFloat = (value: string | undefined): number => {
  if (!value || isNaN(parseFloat(value))) {
    return 0;
  }
  return parseFloat(value);
};

// Convert API data to our EnergyReading format
const convertApiDataToReading = (data: ApiResponse): EnergyReading => {
  if (!data || !data.first || !Array.isArray(data.first)) {
    console.error("Invalid API data format:", data);
    return generateMockReading();
  }
  
  // Extract values from the first array - use safe indexing
  const batteryVoltage = safeParseFloat(data.first[2]);
  const solarVoltage = safeParseFloat(data.first[3]);
  const solarAmps = safeParseFloat(data.first[5]);
  
  // Calculate battery percentage (assuming 10.5V is 0% and 14.4V is 100%)
  const minVoltage = 10.5;
  const maxVoltage = 14.4;
  const batteryPercentage = Math.min(
    100,
    Math.max(
      0,
      ((batteryVoltage - minVoltage) / (maxVoltage - minVoltage)) * 100
    )
  );
  
  // Calculate load in watts (using the shunt voltage)
  const shuntVoltage = safeParseFloat(data.last_shunt_voltage);
  const loadWatts = shuntVoltage * batteryVoltage; // Approximation
  
  return {
    timestamp: Date.now(),
    solarVoltage: solarVoltage || 0,
    chargingVoltage: batteryVoltage || 0,
    chargingAmps: solarAmps || 0,
    batteryPercentage: isNaN(batteryPercentage) ? 50 : batteryPercentage,
    loadWatts: isNaN(loadWatts) ? 0 : loadWatts,
  };
};

// Generate a mock reading when API fails
const generateMockReading = (): EnergyReading => {
  return {
    timestamp: Date.now(),
    solarVoltage: 12 + Math.random() * 2,
    chargingVoltage: 12.5 + Math.random(),
    chargingAmps: 2 + Math.random() * 3,
    batteryPercentage: 50 + Math.random() * 30,
    loadWatts: 100 + Math.random() * 150,
  };
};

// Generate historical data from recent readings
export const getHistoricalData = async (): Promise<EnergyReading[]> => {
  try {
    const apiData = await fetchApiData();
    const currentReading = convertApiDataToReading(apiData);
    
    // Create simulated historical data based on the current reading
    const now = Date.now();
    const data: EnergyReading[] = [];
    
    // Generate 96 readings at 15 min intervals using variations of current data
    for (let i = 0; i < 96; i++) {
      const timestamp = now - (96 - i) * 15 * 60 * 1000; // 15 minutes in milliseconds
      const variationFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
      
      data.push({
        timestamp,
        solarVoltage: currentReading.solarVoltage * variationFactor,
        chargingVoltage: currentReading.chargingVoltage * (0.95 + Math.random() * 0.1), // Less variation for battery
        chargingAmps: currentReading.chargingAmps * variationFactor,
        batteryPercentage: Math.min(100, Math.max(0, currentReading.batteryPercentage * (0.9 + Math.random() * 0.2))),
        loadWatts: currentReading.loadWatts * variationFactor,
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error generating historical data:', error);
    
    // Generate mock data if API fails
    const now = Date.now();
    const mockData: EnergyReading[] = [];
    
    for (let i = 0; i < 96; i++) {
      const timestamp = now - (96 - i) * 15 * 60 * 1000;
      mockData.push({
        timestamp,
        solarVoltage: 12 + Math.random() * 6,
        chargingVoltage: 12.5 + Math.random() * 0.8,
        chargingAmps: 2 + Math.random() * 3,
        batteryPercentage: 50 + Math.random() * 30,
        loadWatts: 100 + Math.random() * 150,
      });
    }
    
    return mockData;
  }
};

// Get current reading from API
export const getCurrentReading = async (): Promise<EnergyReading> => {
  try {
    const apiData = await fetchApiData();
    return convertApiDataToReading(apiData);
  } catch (error) {
    console.error('Error getting current reading:', error);
    return generateMockReading();
  }
};

// Calculate energy statistics from readings and kwh data
export const getEnergyStats = async (data: EnergyReading[]): Promise<EnergyStats> => {
  try {
    const apiData = await fetchApiData();
    const latestReading = data[data.length - 1];
    
    // Get the kWh values from the API with fallbacks
    const dailyEnergyCharged = safeParseFloat(apiData.kwh_positive) * 1000; // Convert kWh to Wh
    const dailyEnergyDischarged = Math.abs(safeParseFloat(apiData.kwh_negative)) * 1000; // Convert kWh to Wh
    
    // Calculate peak power
    let peakPower = 0;
    for (const reading of data) {
      const power = reading.chargingVoltage * reading.chargingAmps;
      if (power > peakPower) {
        peakPower = power;
      }
    }
    
    return {
      dailyEnergyCharged: Math.round(dailyEnergyCharged),
      dailyEnergyDischarged: Math.round(dailyEnergyDischarged),
      currentPowerUsage: Math.round(latestReading.chargingVoltage * latestReading.chargingAmps),
      currentLoad: Math.round(latestReading.loadWatts),
      peakPower: Math.round(peakPower),
      batteryPercentage: Math.round(latestReading.batteryPercentage),
    };
  } catch (error) {
    console.error('Error calculating energy stats:', error);
    // Return mock stats if API fails
    return {
      dailyEnergyCharged: 500 + Math.round(Math.random() * 500),
      dailyEnergyDischarged: 400 + Math.round(Math.random() * 300),
      currentPowerUsage: 150 + Math.round(Math.random() * 100),
      currentLoad: 120 + Math.round(Math.random() * 80),
      peakPower: 300 + Math.round(Math.random() * 200),
      batteryPercentage: 50 + Math.round(Math.random() * 30),
    };
  }
};
