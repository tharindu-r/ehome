
// Simulated energy monitoring data service

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

// Generate random data within reasonable ranges
const generateRandomReading = (timestamp: number): EnergyReading => {
  const solarVoltage = 15 + Math.random() * 10; // 15-25V
  const chargingVoltage = 12 + Math.random() * 2; // 12-14V
  const chargingAmps = Math.random() * 10; // 0-10A
  const batteryPercentage = 30 + Math.random() * 70; // 30-100%
  const loadWatts = 10 + Math.random() * 190; // 10-200W

  return {
    timestamp,
    solarVoltage,
    chargingVoltage,
    chargingAmps,
    batteryPercentage,
    loadWatts,
  };
};

// Generate historical data for the past 24 hours, with readings every 15 minutes
export const getHistoricalData = (): EnergyReading[] => {
  const now = Date.now();
  const data: EnergyReading[] = [];
  
  // Generate data for the past 24 hours (96 readings at 15 min intervals)
  for (let i = 0; i < 96; i++) {
    const timestamp = now - (96 - i) * 15 * 60 * 1000; // 15 minutes in milliseconds
    data.push(generateRandomReading(timestamp));
  }
  
  return data;
};

// Simulated real-time reading
export const getCurrentReading = (): EnergyReading => {
  return generateRandomReading(Date.now());
};

// Calculate energy statistics
export const getEnergyStats = (data: EnergyReading[]): EnergyStats => {
  // Calculate energy charged in Wh (Voltage * Amps * Hours)
  let totalEnergyCharged = 0;
  let totalEnergyDischarged = 0;
  let peakPower = 0;
  
  for (let i = 0; i < data.length - 1; i++) {
    const duration = (data[i + 1].timestamp - data[i].timestamp) / 1000 / 60 / 60; // hours
    const power = data[i].chargingVoltage * data[i].chargingAmps; // Watts
    
    if (power > peakPower) {
      peakPower = power;
    }
    
    if (power > 0) {
      totalEnergyCharged += power * duration;
    } else {
      totalEnergyDischarged += Math.abs(power) * duration;
    }
  }
  
  const latestReading = data[data.length - 1];
  
  return {
    dailyEnergyCharged: Math.round(totalEnergyCharged),
    dailyEnergyDischarged: Math.round(totalEnergyDischarged),
    currentPowerUsage: Math.round(latestReading.chargingVoltage * latestReading.chargingAmps),
    currentLoad: Math.round(latestReading.loadWatts),
    peakPower: Math.round(peakPower),
    batteryPercentage: Math.round(latestReading.batteryPercentage),
  };
};
