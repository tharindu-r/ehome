
// Energy monitoring data service using the API

export interface EnergyReading {
  timestamp: number;
  solarVoltage: number;
  chargingVoltage: number;
  chargingAmps: number;
  batteryPercentage: number;
  loadWatts: number;
  solarPower: number;
  inverterLoad: number;
}

export interface EnergyStats {
  dailyEnergyCharged: number; // Wh
  dailyEnergyDischarged: number; // Wh
  currentPowerUsage: number; // W
  currentLoad: number; // W
  peakPower: number; // W
  batteryPercentage: number;
  solarGeneration: number; // kWh
  totalCharge: number; // kWh
}

interface ApiResponse {
  0: Array<Array<string>>;  // MPPT data
  1: Array<Array<string>>;  // Power data
  2: Array<Array<string>>;  // Monthly data
  3: {                      // Charge data
    kwh_positive: string;
    kwh_negative: string;
    last_shunt_v: string;
  };
}

// Mock data for fallback in case the API is unavailable
const generateMockData = (): ApiResponse => {
  const now = new Date();
  const mockMpptData: string[][] = [];
  const mockPowerData: string[][] = [];

  // Generate 24 hours of mock data
  for (let i = 0; i < 96; i++) {
    const time = new Date(now.getTime() - (i * 15 * 60000));
    const dateStr = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;
    
    // Mock MPPT data: date, time, battery voltage, solar voltage, ?, solar amps, etc.
    const batteryVoltage = (12 + Math.sin(i / 10) * 0.5).toFixed(2);
    const solarVoltage = i < 48 ? (36 + Math.sin(i / 5) * 8).toFixed(2) : "1.88";
    const solarAmps = i < 48 ? (0.5 + Math.sin(i / 8)).toFixed(2) : "0.37";
    const shuntV = (i < 48 ? -1.2 : -5).toFixed(2);
    
    mockMpptData.push([
      dateStr, timeStr, 
      batteryVoltage, solarVoltage, 
      "0", solarAmps, shuntV, 
      i < 48 ? "10" : "0", 
      i < 48 ? "MPPT" : "OFF", "", "0"
    ]);
    
    // Mock power data
    mockPowerData.push([
      dateStr, timeStr, (i < 48 ? 0.8 : 0.2).toString(), "0", "0"
    ]);
  }

  return {
    0: mockMpptData,
    1: mockPowerData,
    2: [["2025-04", "5000"], ["2025-03", "4800"], ["2025-02", "4600"]],
    3: {
      kwh_positive: "1.25",
      kwh_negative: "-0.75",
      last_shunt_v: "-2.5"
    }
  };
};

// Fetch data from the API with improved error handling and retry logic
const fetchApiData = async (): Promise<ApiResponse> => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch('https://iot.tharindur.com/mppt/api/json.php?fn=fetchData', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      // Validate data structure
      if (!data || !Array.isArray(data[0]) || !Array.isArray(data[1]) || !data[3]) {
        console.error("Invalid data structure received from API:", data);
        throw new Error("Invalid data structure");
      }
      
      return data;
    } catch (error) {
      retries++;
      console.error(`API fetch attempt ${retries} failed:`, error);
      
      if (retries >= maxRetries) {
        console.warn("Using mock data after failed API attempts");
        return generateMockData();
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  // This should never be reached due to the mock data fallback
  return generateMockData();
};

// Helper function to safely extract number from API data
const safeParseFloat = (value: string | undefined): number => {
  if (!value || isNaN(parseFloat(value))) {
    return 0;
  }
  return parseFloat(value);
};

// Convert API data to our EnergyReading format
const convertApiDataToReading = (mpptData: string[], powerData: string[], chargeData: any): EnergyReading => {
  const batteryVoltage = safeParseFloat(mpptData[2]);
  const solarVoltage = safeParseFloat(mpptData[3]);
  const solarAmps = safeParseFloat(mpptData[5]);
  const batteryLoad = safeParseFloat(chargeData.last_shunt_v);
  
  // Calculate battery percentage (assuming 10.5V is 0% and 14.4V is 100%)
  const batteryPercentage = Math.min(
    100,
    Math.max(
      0,
      ((batteryVoltage - 10.5) / (14.4 - 10.5)) * 100
    )
  );
  
  // Calculate solar power and inverter load
  const solarPower = solarVoltage * solarAmps;
  let inverterLoad = 0;
  
  if (batteryLoad > 0) {
    inverterLoad = Math.abs(solarPower - ((batteryLoad * 2) * batteryVoltage));
  } else {
    inverterLoad = Math.abs(batteryLoad * 37.77);
  }
  
  // Create timestamp from date and time in data
  let timestamp;
  try {
    if (mpptData[0] && mpptData[1]) {
      const [year, month, day] = mpptData[0].split('-').map(Number);
      const [hours, minutes, seconds] = mpptData[1].split(':').map(Number);
      timestamp = new Date(year, month - 1, day, hours, minutes, seconds).getTime();
    } else {
      timestamp = Date.now();
    }
  } catch (e) {
    timestamp = Date.now();
  }
  
  return {
    timestamp,
    solarVoltage,
    chargingVoltage: batteryVoltage,
    chargingAmps: solarAmps,
    batteryPercentage,
    loadWatts: Math.abs(batteryLoad * batteryVoltage * 2),
    solarPower,
    inverterLoad
  };
};

// Generate historical data from recent readings
export const getHistoricalData = async (): Promise<EnergyReading[]> => {
  try {
    const apiData = await fetchApiData();
    const mpptData = apiData[0].reverse();
    const powerData = apiData[1].reverse();
    
    return mpptData.map((mpptRecord, index) => {
      const powerRecord = powerData[index] || powerData[powerData.length - 1];
      return convertApiDataToReading(mpptRecord, powerRecord, apiData[3]);
    });
  } catch (error) {
    console.error('Error generating historical data:', error);
    return [];
  }
};

// Get current reading from API
export const getCurrentReading = async (): Promise<EnergyReading> => {
  try {
    const apiData = await fetchApiData();
    const latestMpptData = apiData[0][apiData[0].length - 1];
    const latestPowerData = apiData[1][apiData[1].length - 1];
    return convertApiDataToReading(latestMpptData, latestPowerData, apiData[3]);
  } catch (error) {
    console.error('Error getting current reading:', error);
    throw error;
  }
};

// Calculate energy statistics
export const getEnergyStats = async (data: EnergyReading[]): Promise<EnergyStats> => {
  try {
    const apiData = await fetchApiData();
    const chargeData = apiData[3];
    const latestReading = data[data.length - 1];
    
    const dailyEnergyCharged = safeParseFloat(chargeData.kwh_positive) * 1000;
    const dailyEnergyDischarged = Math.abs(safeParseFloat(chargeData.kwh_negative)) * 1000;
    
    // Calculate solar generation
    const solarGeneration = data.reduce((total, reading) => 
      total + (reading.solarVoltage * reading.chargingAmps), 0) / 60000;
    
    let peakPower = 0;
    data.forEach(reading => {
      const power = reading.solarPower;
      if (power > peakPower) {
        peakPower = power;
      }
    });
    
    return {
      dailyEnergyCharged: Math.round(dailyEnergyCharged),
      dailyEnergyDischarged: Math.round(dailyEnergyDischarged),
      currentPowerUsage: Math.round(latestReading.solarPower),
      currentLoad: Math.round(latestReading.loadWatts),
      peakPower: Math.round(peakPower),
      batteryPercentage: Math.round(latestReading.batteryPercentage),
      solarGeneration: Math.round(solarGeneration * 100) / 100,
      totalCharge: Math.round((dailyEnergyCharged - dailyEnergyDischarged) / 1000 * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating energy stats:', error);
    throw error;
  }
};
