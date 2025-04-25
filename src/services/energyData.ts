
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

// Fetch data from the API
const fetchApiData = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch('https://iot.tharindur.com/mppt/api/json.php?fn=fetchData');
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    console.log("API Response:", data);
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
  
  return {
    timestamp: Date.now(),
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
