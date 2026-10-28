export type VehicleModel = "sedan" | "taxi" | "danfo" | "suv" | "sports" | "police";

export type VehicleSpec = {
  model: VehicleModel;
  name: string;
  price: number;
  level: number;
  topSpeed: number;
  accel: number;
  grip: number;
  seats: number;
  tank: number;
  blurb: string;
};

export const VEHICLES: Record<VehicleModel, VehicleSpec> = {
  sedan: { model: "sedan", name: "Corolla Classic", price: 0, level: 1, topSpeed: 30, accel: 11, grip: 6, seats: 1, tank: 60, blurb: "Reliable starter. Does everything okay." },
  taxi: { model: "taxi", name: "Eko Cab", price: 1800, level: 2, topSpeed: 31, accel: 11.5, grip: 6.2, seats: 1, tank: 70, blurb: "Unlocks taxi fares with a meter bonus." },
  danfo: { model: "danfo", name: "Yellow Danfo", price: 4200, level: 3, topSpeed: 26, accel: 8.5, grip: 4.8, seats: 4, tank: 90, blurb: "Carries 4 passengers. Danfo routes pay big." },
  suv: { model: "suv", name: "Highlander SUV", price: 7500, level: 4, topSpeed: 34, accel: 12.5, grip: 7, seats: 2, tank: 80, blurb: "Tough body, takes less damage." },
  sports: { model: "sports", name: "Lekki GT", price: 15000, level: 6, topSpeed: 46, accel: 18, grip: 8.5, seats: 1, tank: 50, blurb: "Built for street races. Very fast." },
  police: { model: "police", name: "Police Interceptor", price: Infinity, level: 99, topSpeed: 38, accel: 14, grip: 7.5, seats: 1, tank: 80, blurb: "Not for sale." },
};

export const DEALER_LIST: VehicleModel[] = ["sedan", "taxi", "danfo", "suv", "sports"];

export const TRAFFIC_TINTS = ["#d94848", "#3a6fd9", "#e8e8e8", "#2b2b2b", "#2fa36b", "#d9a43a", "#8a4fd9"];
