export interface LalamoveQuote {
  vehicleType: 'motorcycle' | 'car' | 'pickup';
  vehicleName: string;
  vehicleNameTh: string;
  baseFare: number;
  distanceKm: number;
  distanceFee: number;
  totalFare: number;
  etaMinutes: number;
}

// Lalamove Thailand Pricing Rates
// Motorcycle: Base 33 THB (0-3km), 3-10km (+7.2 THB/km), 10-15km (+8 THB/km), >15km (+14 THB/km)
// Car: Base 85 THB (0-3km), 3-10km (+12 THB/km), 10-20km (+14 THB/km), >20km (+18 THB/km)
// Pickup: Base 250 THB (0-3km), 3-10km (+15 THB/km), 10-30km (+20 THB/km), >30km (+25 THB/km)

export function getLalamoveQuote(distanceKm: number): LalamoveQuote[] {
  if (distanceKm <= 0) return [];

  const roundDistance = Math.max(0.1, Math.round(distanceKm * 100) / 100);

  // 1. Motorcycle
  let mcDistFee = 0;
  if (roundDistance > 3) {
    const remaining = roundDistance - 3;
    if (remaining <= 7) { // up to 10km total
      mcDistFee += remaining * 7.2;
    } else {
      mcDistFee += 7 * 7.2; // for 3-10km
      const remaining2 = remaining - 7;
      if (remaining2 <= 5) { // up to 15km total
        mcDistFee += remaining2 * 8.0;
      } else {
        mcDistFee += 5 * 8.0; // for 10-15km
        const remaining3 = remaining2 - 5;
        mcDistFee += remaining3 * 14.0;
      }
    }
  }
  const mcTotal = Math.round(33 + mcDistFee);

  // 2. Car
  let carDistFee = 0;
  if (roundDistance > 3) {
    const remaining = roundDistance - 3;
    if (remaining <= 7) { // up to 10km total
      carDistFee += remaining * 12.0;
    } else {
      carDistFee += 7 * 12.0;
      const remaining2 = remaining - 7;
      if (remaining2 <= 10) { // up to 20km total
        carDistFee += remaining2 * 14.0;
      } else {
        carDistFee += 10 * 14.0;
        const remaining3 = remaining2 - 10;
        carDistFee += remaining3 * 18.0;
      }
    }
  }
  const carTotal = Math.round(85 + carDistFee);

  // 3. Pickup
  let pickDistFee = 0;
  if (roundDistance > 3) {
    const remaining = roundDistance - 3;
    if (remaining <= 7) {
      pickDistFee += remaining * 15.0;
    } else {
      pickDistFee += 7 * 15.0;
      const remaining2 = remaining - 7;
      if (remaining2 <= 20) {
        pickDistFee += remaining2 * 20.0;
      } else {
        pickDistFee += 20 * 20.0;
        const remaining3 = remaining2 - 20;
        pickDistFee += remaining3 * 25.0;
      }
    }
  }
  const pickTotal = Math.round(250 + pickDistFee);

  return [
    {
      vehicleType: 'motorcycle',
      vehicleName: 'Motorcycle (Speedy)',
      vehicleNameTh: 'รถจักรยานยนต์ (ด่วนที่สุด)',
      baseFare: 33,
      distanceKm: roundDistance,
      distanceFee: Math.round(mcDistFee),
      totalFare: mcTotal,
      etaMinutes: Math.round(5 + roundDistance * 2.5),
    },
    {
      vehicleType: 'car',
      vehicleName: 'Car (4-Wheel)',
      vehicleNameTh: 'รถยนต์ 4 ล้อ (ถนอมอาหาร)',
      baseFare: 85,
      distanceKm: roundDistance,
      distanceFee: Math.round(carDistFee),
      totalFare: carTotal,
      etaMinutes: Math.round(10 + roundDistance * 3.5),
    },
    {
      vehicleType: 'pickup',
      vehicleName: 'Pickup Truck',
      vehicleNameTh: 'รถกระบะขนส่ง (ปาร์ตี้ใหญ่)',
      baseFare: 250,
      distanceKm: roundDistance,
      distanceFee: Math.round(pickDistFee),
      totalFare: pickTotal,
      etaMinutes: Math.round(15 + roundDistance * 4.0),
    }
  ];
}

export interface MockRider {
  name: string;
  phone: string;
}

const MOCK_RIDERS: MockRider[] = [
  { name: 'สมชาย แสนดี (Somchai S.)', phone: '089-123-4567' },
  { name: 'อนันต์ เรืองฤทธิ์ (Anan R.)', phone: '081-987-6543' },
  { name: 'เกียรติศักดิ์ มั่นคง (Kiattisak M.)', phone: '086-555-7788' },
  { name: 'วิชัย ชนะภัย (Wichai C.)', phone: '092-444-1122' }
];

export function getRandomMockRider(): MockRider {
  const index = Math.floor(Math.random() * MOCK_RIDERS.length);
  return MOCK_RIDERS[index];
}
