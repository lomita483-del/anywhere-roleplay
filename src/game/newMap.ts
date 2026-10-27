/** Single source of truth for the NEW MAP world layout. Coordinates are game-space units. */
export const NEW_MAP_SCALE = 0.48;
export type NewMapPoiKind = "airport" | "port" | "stadium" | "university" | "lake" | "bank" | "atm" | "shop" | "market" | "hospital" | "police" | "fuel" | "pharmacy" | "mama-put" | "dealership" | "real-estate" | "residential";
export interface NewMapPoi { id: string; label: string; kind: NewMapPoiKind; x: number; z: number; buildingId?: string; }
export interface NewMapBuilding { id: string; label: string; kind: string; district: string; x: number; z: number; w: number; d: number; h: number; color: string; doorSide: "north" | "south" | "east" | "west"; doorX?: number; doorZ?: number; }
export interface NewMapDistrict { id: string; label: string; x: number; z: number; w: number; d: number; color: string; }
export interface NewMapRoadEdge { id: string; from: string; to: string; type: "avenue" | "street" | "boulevard" | "perimeter"; width: number; points: [number, number][]; }
const ring: [number, number][] = Array.from({length: 24}, (_,i) => { const a=(i/24)*Math.PI*2; return [Math.round(Math.cos(a)*78*10)/10,Math.round(Math.sin(a)*78*10)/10]; });
const ringPoints: [number,number][] = [...ring, ring[0]!];
const roadEdges: NewMapRoadEdge[] = [
 {id:"stadium-boulevard",from:"boulevard-west",to:"boulevard-west",type:"boulevard",width:8,points:ringPoints},
 {id:"outer-perimeter",from:"perimeter-nw",to:"perimeter-nw",type:"perimeter",width:8,points:[[-160,-160],[160,-160],[160,160],[-160,160],[-160,-160]]},
 {id:"airport-avenue",from:"boulevard-north",to:"perimeter-north",type:"avenue",width:8,points:[[0,-78],[0,-105],[0,-132],[0,-160]]},
 {id:"port-avenue",from:"boulevard-south-east",to:"perimeter-south-east",type:"avenue",width:8,points:[[55,55],[78,78],[104,104],[132,132],[160,160]]},
 {id:"university-avenue",from:"boulevard-west",to:"perimeter-west",type:"avenue",width:8,points:[[-78,0],[-104,0],[-132,0],[-160,0]]},
 {id:"residential-avenue",from:"boulevard-east",to:"perimeter-east",type:"avenue",width:8,points:[[78,0],[104,0],[132,0],[160,0]]},
 {id:"corporate-street-n",from:"corporate-west",to:"corporate-east",type:"street",width:5,points:[[-154,-137],[-125,-137],[-96,-137]]},
 {id:"corporate-street-s",from:"corporate-west-s",to:"corporate-east-s",type:"street",width:5,points:[[-154,-111],[-125,-111],[-96,-111]]},
 {id:"industrial-street-n",from:"industrial-west",to:"industrial-east",type:"street",width:5,points:[[-154,-83],[-125,-83],[-96,-83]]},
 {id:"industrial-street-s",from:"industrial-west-s",to:"industrial-east-s",type:"street",width:5,points:[[-154,-57],[-125,-57],[-96,-57]]},
 {id:"university-street-n",from:"university-west",to:"university-east",type:"street",width:5,points:[[-154,42],[-125,42],[-96,42]]},
 {id:"university-street-mid",from:"university-west-mid",to:"university-east-mid",type:"street",width:5,points:[[-154,70],[-125,70],[-96,70]]},
 {id:"university-street-s",from:"university-west-s",to:"university-east-s",type:"street",width:5,points:[[-154,98],[-125,98],[-96,98]]},
 ...[96,124,152].map((x,i)=>({id:"residential-ns-"+i,from:"res-ns-"+i,to:"res-ns-"+i,type:"street" as const,width:5,points:[[x,-70],[x,-42],[x,-14],[x,14],[x,42],[x,70]] as [number,number][]})),
 ...[-56,-28,28,56].map((z,i)=>({id:"residential-ew-"+i,from:"res-ew-"+i,to:"res-ew-"+i,type:"street" as const,width:5,points:[[82,z],[96,z],[124,z],[152,z],[174,z]] as [number,number][]})),
 {id:"civic-link",from:"boulevard-east-north",to:"residential-avenue",type:"street",width:5,points:[[82,84],[110,84],[138,84],[160,84]]},
 {id:"market-link",from:"market-west",to:"airport-avenue",type:"street",width:5,points:[[-58,-88],[-32,-88],[0,-88]]},
];
export const NEW_MAP_ROAD_GRAPH = {
 nodes: [
  {id:"boulevard-north",x:0,z:-78},{id:"boulevard-south",x:0,z:78},{id:"boulevard-east",x:78,z:0},{id:"boulevard-west",x:-78,z:0},
  {id:"perimeter-north",x:0,z:-160},{id:"perimeter-east",x:160,z:0},{id:"perimeter-west",x:-160,z:0},{id:"perimeter-south-east",x:160,z:160},
  {id:"market-junction",x:0,z:-104},{id:"civic-junction",x:78,z:0},{id:"port-junction",x:78,z:78},{id:"university-junction",x:-78,z:0}
 ],
 edges: roadEdges
};
export const NEW_MAP_ROADS: [number,number][][] = roadEdges.map(e=>e.points);
export const NEW_MAP_ROAD_WIDTHS = roadEdges.map(e=>e.width);
export const NEW_MAP_LOCAL_ROAD_START_INDEX = roadEdges.findIndex(e=>e.type==="street");

export const NEW_MAP_DISTRICTS: NewMapDistrict[] = [
 {id:"corporate",label:"CORPORATE DISTRICT",x:-126,z:-124,w:70,d:42,color:"#819b83"},
 {id:"industrial",label:"INDUSTRIAL DISTRICT",x:-126,z:-70,w:70,d:40,color:"#a29a7b"},
 {id:"market",label:"CENTRAL MARKET & DEPOT",x:-34,z:-104,w:42,d:25,color:"#bda16f"},
 {id:"university",label:"UNIVERSITY DISTRICT",x:-126,z:70,w:70,d:70,color:"#a98f7b"},
 {id:"residential",label:"RESIDENTIAL GRID",x:135,z:0,w:78,d:145,color:"#bdb79c"},
 {id:"civic",label:"CIVIC & OFFICE STRIP",x:112,z:52,w:52,d:34,color:"#b3a895"},
 {id:"port",label:"PORT & LOGISTICS",x:132,z:126,w:55,d:42,color:"#9c9e91"},
 {id:"lake-park",label:"LAKE PARK & RESORT",x:-112,z:126,w:62,d:54,color:"#789b76"},
 {id:"airport",label:"INTERNATIONAL AIRPORT",x:34,z:-140,w:68,d:42,color:"#9ba9a5"}
];

const rawBuildings: Omit<NewMapBuilding,"doorX"|"doorZ">[] = [
 {id:"tower-a",label:"NORTHSTAR TOWER",kind:"tower",district:"corporate",x:-145,z:-124,w:14,d:12,h:40,color:"#8daab5",doorSide:"south"},
 {id:"tower-b",label:"CROWN BUSINESS CENTRE",kind:"tower",district:"corporate",x:-119,z:-124,w:14,d:12,h:34,color:"#b3b9b7",doorSide:"south"},
 {id:"tower-c",label:"MERIDIAN PLAZA",kind:"tower",district:"corporate",x:-145,z:-98,w:14,d:12,h:28,color:"#d0c4ad",doorSide:"north"},
 {id:"tower-d",label:"FINANCIAL HOUSE",kind:"tower",district:"corporate",x:-119,z:-98,w:14,d:12,h:32,color:"#728d9b",doorSide:"north"},
 {id:"factory-a",label:"INDUSTRIAL WORKS",kind:"factory",district:"industrial",x:-145,z:-70,w:15,d:12,h:9,color:"#a8a69a",doorSide:"south"},
 {id:"factory-b",label:"ASSEMBLY DEPOT",kind:"factory",district:"industrial",x:-119,z:-70,w:15,d:12,h:8,color:"#b5a18b",doorSide:"south"},
 {id:"factory-c",label:"WAREHOUSE 01",kind:"warehouse",district:"industrial",x:-145,z:-44,w:15,d:12,h:7,color:"#c8bca5",doorSide:"north"},
 {id:"police",label:"POLICE STATION",kind:"police",district:"industrial",x:-119,z:-44,w:12,d:10,h:8,color:"#8ba2b4",doorSide:"north"},
 {id:"market",label:"CENTRAL MARKET",kind:"market",district:"market",x:-34,z:-104,w:24,d:14,h:6,color:"#c7864b",doorSide:"south"},
 {id:"depot",label:"BUS & GOODS DEPOT",kind:"depot",district:"market",x:-63,z:-104,w:14,d:12,h:5,color:"#b9a17c",doorSide:"south"},
 {id:"university",label:"CITY UNIVERSITY",kind:"university",district:"university",x:-145,z:56,w:20,d:14,h:10,color:"#b8a28d",doorSide:"south"},
 {id:"school",label:"COMMUNITY SECONDARY SCHOOL",kind:"school",district:"university",x:-119,z:56,w:18,d:12,h:7,color:"#d8c7a5",doorSide:"south"},
 {id:"pharmacy",label:"NEIGHBOURHOOD PHARMACY",kind:"pharmacy",district:"university",x:-145,z:84,w:10,d:8,h:5,color:"#b8c7b9",doorSide:"north"},
 {id:"lake-hall",label:"LAKE PARK RESORT",kind:"resort",district:"lake-park",x:-125,z:126,w:14,d:10,h:6,color:"#c8b78c",doorSide:"east"},
 {id:"airport-terminal",label:"NEW MAP INTERNATIONAL AIRPORT",kind:"airport",district:"airport",x:34,z:-140,w:34,d:12,h:8,color:"#c5c9c6",doorSide:"south"},
 {id:"fuel",label:"FUEL STATION",kind:"fuel",district:"civic",x:110,z:84,w:12,d:10,h:5,color:"#d7bd65",doorSide:"south"},
 {id:"bank",label:"COMMUNITY BANK & ATM",kind:"bank",district:"civic",x:138,z:84,w:12,d:10,h:9,color:"#c8b78c",doorSide:"south"},
 {id:"hospital",label:"CITY HOSPITAL",kind:"hospital",district:"civic",x:110,z:108,w:16,d:12,h:10,color:"#d9d2bd",doorSide:"south"},
 {id:"dealership",label:"CAR DEALERSHIP",kind:"dealership",district:"civic",x:138,z:108,w:14,d:10,h:7,color:"#b5b6a7",doorSide:"south"},
 {id:"real-estate",label:"REAL ESTATE OFFICE",kind:"real-estate",district:"civic",x:110,z:132,w:12,d:9,h:7,color:"#c7b89c",doorSide:"south"},
 {id:"mama-put",label:"MAMA PUT BUKA",kind:"mama-put",district:"market",x:-8,z:-104,w:9,d:7,h:4,color:"#d7b37a",doorSide:"south"},
 {id:"port-terminal",label:"PORT OF LAGOS",kind:"port",district:"port",x:105,z:142,w:23,d:15,h:8,color:"#b7a58a",doorSide:"west"},
 ...[0,1,2,3,4,5,6,7,8].map(i=>({id:"home-"+i,label:i%3===0?"Walk-up Apartments":"Residential Home",kind:"residential",district:"residential",x:[106,134,162][i%3]!,z:[-42,-14,42][Math.floor(i/3)]!,w:i%3===0?9:8,d:8,h:i%3===0?13:6.5,color:["#d9c9a8","#d7d4c8","#c9b39a"][i%3]!,doorSide:"south" as const})),
];
export const NEW_MAP_BUILDINGS: NewMapBuilding[] = rawBuildings.map(b=>{
 const doorOffset= b.doorSide==="north" ? -b.d/2-1.4 : b.doorSide==="south" ? b.d/2+1.4 : b.doorSide==="east" ? b.w/2+1.4 : -b.w/2-1.4;
 return {...b,doorX:b.x+(b.doorSide==="east"?doorOffset:b.doorSide==="west"?doorOffset:0),doorZ:b.z+(b.doorSide==="north"||b.doorSide==="south"?doorOffset:0)};
});
export const NEW_MAP_POIS: NewMapPoi[] = [
 ...NEW_MAP_BUILDINGS.filter(b=>["airport","port","stadium","university","lake","bank","police","fuel","pharmacy","mama-put","dealership","real-estate","hospital","market"].includes(b.kind)||b.id==="school"||b.id.startsWith("home-")).map(b=>({id:b.id,label:b.label,kind:(b.kind==="tower"||b.kind==="factory"||b.kind==="warehouse"||b.kind==="depot"||b.kind==="school"||b.kind==="residential"?"shop":b.kind) as NewMapPoiKind,x:b.doorX!,z:b.doorZ!,buildingId:b.id})),
 {id:"stadium",label:"CITY STADIUM",kind:"stadium",x:0,z:0},
 {id:"lake",label:"LAKE PARK & RESORT",kind:"lake",x:-112,z:118},
 {id:"atm-market",label:"MARKET ATM",kind:"atm",x:-18,z:-94,buildingId:"market"},
 {id:"atm-university",label:"UNIVERSITY ATM",kind:"atm",x:-130,z:44,buildingId:"university"}
];
export const NEW_MAP_BOUNDS = { minX: -180, maxX: 180, minZ: -180, maxZ: 180 };

export interface NewMapTree {x:number;z:number;type:"round"|"palm";h:number;park?:string}
export interface NewMapStall {x:number;z:number;w:number;d:number;id:string;color:string}
const treeCandidates: NewMapTree[] = [
 ...Array.from({length:14},(_,i)=>({x:-137+(i%7)*7,z:119+Math.floor(i/7)*8,type:(i%3===0?"palm":"round") as "palm"|"round",h:2.4,park:"lake-park"})),
 ...Array.from({length:12},(_,i)=>({x:104+(i%6)*9,z:112+Math.floor(i/6)*8,type:(i%3===0?"palm":"round") as "palm"|"round",h:2.2,park:"port"})),
 ...Array.from({length:12},(_,i)=>({x:75+(i%6)*8,z:94+Math.floor(i/6)*8,type:(i%3===0?"palm":"round") as "palm"|"round",h:2.1,park:"civic"})),
 ...Array.from({length:10},(_,i)=>({x:-145+(i%5)*12,z:126+Math.floor(i/5)*8,type:(i%2===0?"palm":"round") as "palm"|"round",h:2.4,park:"lake-park"}))
];
function pointSegmentDistance(px:number,pz:number,a:[number,number],b:[number,number]) { const dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz;const t=den?Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/den)):0;return Math.hypot(px-(a[0]+t*dx),pz-(a[1]+t*dz)); }
export function newMapPointOnRoad(x:number,z:number,margin=0) { return NEW_MAP_ROAD_GRAPH.edges.some(e=>e.points.slice(1).some((p,i)=>pointSegmentDistance(x,z,e.points[i]!,p)<e.width/2+margin)); }
export const NEW_MAP_TREES: NewMapTree[] = treeCandidates.filter(t=>!newMapPointOnRoad(t.x,t.z,3)&&!NEW_MAP_BUILDINGS.some(b=>Math.abs(t.x-b.x)<b.w/2+2&&Math.abs(t.z-b.z)<b.d/2+2)&&Math.hypot(t.x,t.z)>88);
export const NEW_MAP_MARKET_STALLS: NewMapStall[] = Array.from({length:12},(_,i)=>({id:"stall-"+i,x:-48+(i%6)*5.2,z:-121+Math.floor(i/6)*5.2,w:3.4,d:2.4,color:["#d84f3f","#e2b74f","#347c9d","#4e8052"][i%4]!})).filter(s=>!newMapPointOnRoad(s.x,s.z,2)&&!NEW_MAP_BUILDINGS.some(b=>Math.abs(s.x-b.x)<b.w/2+s.w/2+1&&Math.abs(s.z-b.z)<b.d/2+s.d/2+1));

export function validateNewMapLayout() {
 const errors:string[]=[];
 for(let i=0;i<NEW_MAP_BUILDINGS.length;i++){
  const a=NEW_MAP_BUILDINGS[i]!;
  if(Math.hypot(a.x,a.z)<28)errors.push(`building ${a.id} overlaps stadium plaza`);
  for(const e of NEW_MAP_ROAD_GRAPH.edges)for(let j=1;j<e.points.length;j++){
   const dist=pointSegmentDistance(a.x,a.z,e.points[j-1]!,e.points[j]!);
   if(dist < e.width/2+Math.min(a.w,a.d)/2+3) { errors.push(`building ${a.id} too close to road ${e.id}`); break; }
  }
  for(let j=i+1;j<NEW_MAP_BUILDINGS.length;j++){const b=NEW_MAP_BUILDINGS[j]!;if(Math.abs(a.x-b.x)<(a.w+b.w)/2+1&&Math.abs(a.z-b.z)<(a.d+b.d)/2+1)errors.push(`building collision: ${a.id} / ${b.id}`);}
 }
 for(const s of NEW_MAP_MARKET_STALLS){if(newMapPointOnRoad(s.x,s.z,s.d/2+1))errors.push(`stall ${s.id} intersects road corridor`);}
 for(const t of NEW_MAP_TREES){if(newMapPointOnRoad(t.x,t.z,3))errors.push(`tree intersects road corridor at ${t.x},${t.z}`);if(NEW_MAP_BUILDINGS.some(b=>Math.abs(t.x-b.x)<b.w/2+2&&Math.abs(t.z-b.z)<b.d/2+2))errors.push(`tree intersects building at ${t.x},${t.z}`);}
 return errors;
}
