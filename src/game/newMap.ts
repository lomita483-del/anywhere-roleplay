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
 {id:"outer-perimeter",from:"perimeter-nw",to:"perimeter-nw",type:"perimeter",width:8,points:[[-178,-178],[178,-178],[178,178],[-178,178],[-178,-178]]},
 {id:"airport-avenue",from:"boulevard-north",to:"perimeter-north",type:"avenue",width:8,points:[[0,-78],[0,-105],[0,-132],[0,-178]]},
 {id:"airport-terminal-access",from:"airport-avenue",to:"airport-terminal",type:"street",width:5,points:[[0,-106],[17,-106],[34,-106]]},
 {id:"port-avenue",from:"boulevard-south-east",to:"perimeter-south-east",type:"avenue",width:8,points:[[55,55],[78,78],[104,104],[132,132],[178,178]]},
 {id:"university-avenue",from:"boulevard-west",to:"perimeter-west",type:"avenue",width:8,points:[[-78,0],[-104,0],[-132,0],[-178,0]]},
 {id:"residential-avenue",from:"boulevard-east",to:"perimeter-east",type:"avenue",width:8,points:[[78,0],[104,0],[132,0],[178,0]]},
 {id:"corporate-street-n",from:"corporate-west",to:"corporate-east",type:"street",width:5,points:[[-154,-137],[-125,-137],[-96,-137]]},
 {id:"corporate-street-s",from:"corporate-west-s",to:"corporate-east-s",type:"street",width:5,points:[[-154,-111],[-125,-111],[-96,-111]]},
 {id:"industrial-street-n",from:"industrial-west",to:"industrial-east",type:"street",width:5,points:[[-154,-83],[-125,-83],[-96,-83]]},
 {id:"industrial-street-s",from:"industrial-west-s",to:"industrial-east-s",type:"street",width:5,points:[[-154,-57],[-125,-57],[-96,-57]]},
 {id:"university-street-n",from:"university-west",to:"university-east",type:"street",width:5,points:[[-154,42],[-125,42],[-96,42]]},
 {id:"university-street-mid",from:"university-west-mid",to:"university-east-mid",type:"street",width:5,points:[[-154,70],[-125,70],[-96,70]]},
 {id:"university-street-s",from:"university-west-s",to:"university-east-s",type:"street",width:5,points:[[-154,98],[-125,98],[-96,98]]},
 ...[96,124,152].map((x,i)=>({id:"residential-ns-"+i,from:"res-ns-"+i,to:"res-ns-"+i,type:"street" as const,width:5,points:[[x,-70],[x,-42],[x,-14],[x,14],[x,42],[x,70]] as [number,number][]})),
 ...[-56,-28,28,56].map((z,i)=>({id:"residential-ew-"+i,from:"res-ew-"+i,to:"res-ew-"+i,type:"street" as const,width:5,points:[[82,z],[96,z],[124,z],[152,z],[174,z]] as [number,number][]})),
 {id:"civic-link",from:"boulevard-east-north",to:"residential-avenue",type:"street",width:5,points:[[82,96],[110,96],[138,96],[160,96]]},
 {id:"market-link",from:"market-west",to:"airport-avenue",type:"street",width:5,points:[[-58,-88],[-32,-88],[0,-88]]},
];
function roadIntersections() {
 const out:[number,number][]=[];
 const cross=(a:[number,number],b:[number,number],c:[number,number],d:[number,number]):[number,number]|null=>{
  const den=(a[0]-b[0])*(c[1]-d[1])-(a[1]-b[1])*(c[0]-d[0]);if(Math.abs(den)<1e-8)return null;
  const t=((a[0]-c[0])*(c[1]-d[1])-(a[1]-c[1])*(c[0]-d[0]))/den;
  const u=-((a[0]-b[0])*(a[1]-c[1])-(a[1]-b[1])*(a[0]-c[0]))/den;
  if(t<0||t>1||u<0||u>1)return null;return [Math.round((a[0]+t*(b[0]-a[0]))*10)/10,Math.round((a[1]+t*(b[1]-a[1]))*10)/10];
 };
 for(let i=0;i<roadEdges.length;i++)for(let j=i+1;j<roadEdges.length;j++){const e=roadEdges[i]!,f=roadEdges[j]!;for(let a=1;a<e.points.length;a++)for(let b=1;b<f.points.length;b++){const p=cross(e.points[a-1]!,e.points[a]!,f.points[b-1]!,f.points[b]!);if(p&&!out.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<1))out.push(p);}}
 return out;
}
export const NEW_MAP_JUNCTIONS = roadIntersections();
const roadNodeId=(p:[number,number])=>`road-node-${p[0]}-${p[1]}`;
export const NEW_MAP_ROAD_GRAPH = {
 nodes: Array.from(new Map(roadEdges.flatMap(e=>e.points.map(p=>[roadNodeId(p),{id:roadNodeId(p),x:p[0],z:p[1]}] as const)).concat(NEW_MAP_JUNCTIONS.map(p=>[roadNodeId(p),{id:roadNodeId(p),x:p[0],z:p[1]}] as const))).values()),
 edges: roadEdges.map(e=>({...e,from:roadNodeId(e.points[0]!),to:roadNodeId(e.points[e.points.length-1]!)}))
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
 {id:"airport",label:"INTERNATIONAL AIRPORT",x:34,z:-112,w:68,d:100,color:"#9ba9a5"}
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
 {id:"market",label:"CENTRAL MARKET",kind:"market",district:"market",x:-34,z:-104,w:20,d:14,h:6,color:"#c7864b",doorSide:"south"},
 {id:"depot",label:"BUS & GOODS DEPOT",kind:"depot",district:"market",x:-63,z:-104,w:14,d:12,h:5,color:"#b9a17c",doorSide:"south"},
 {id:"university",label:"CITY UNIVERSITY",kind:"university",district:"university",x:-145,z:56,w:16,d:12,h:10,color:"#b8a28d",doorSide:"south"},
 {id:"school",label:"COMMUNITY SECONDARY SCHOOL",kind:"school",district:"university",x:-119,z:56,w:16,d:12,h:7,color:"#d8c7a5",doorSide:"south"},
 {id:"pharmacy",label:"NEIGHBOURHOOD PHARMACY",kind:"pharmacy",district:"university",x:-145,z:84,w:10,d:8,h:5,color:"#b8c7b9",doorSide:"north"},
 {id:"lake-hall",label:"LAKE PARK RESORT",kind:"resort",district:"lake-park",x:-125,z:126,w:14,d:10,h:6,color:"#c8b78c",doorSide:"east"},
 {id:"airport-terminal",label:"NEW MAP INTERNATIONAL AIRPORT",kind:"airport",district:"airport",x:34,z:-92,w:34,d:12,h:8,color:"#c5c9c6",doorSide:"north"},
 {id:"fuel",label:"FUEL STATION",kind:"fuel",district:"civic",x:110,z:84,w:12,d:10,h:5,color:"#d7bd65",doorSide:"south"},
 {id:"bank",label:"COMMUNITY BANK & ATM",kind:"bank",district:"civic",x:138,z:84,w:12,d:10,h:9,color:"#c8b78c",doorSide:"south"},
 {id:"hospital",label:"CITY HOSPITAL",kind:"hospital",district:"civic",x:138,z:110,w:16,d:12,h:10,color:"#d9d2bd",doorSide:"south"},
 {id:"dealership",label:"CAR DEALERSHIP",kind:"dealership",district:"civic",x:82,z:132,w:14,d:10,h:7,color:"#b5b6a7",doorSide:"south"},
 {id:"real-estate",label:"REAL ESTATE OFFICE",kind:"real-estate",district:"civic",x:140,z:160,w:12,d:9,h:7,color:"#c7b89c",doorSide:"south"},
 {id:"mama-put",label:"MAMA PUT BUKA",kind:"mama-put",district:"market",x:-12,z:-132,w:9,d:7,h:4,color:"#d7b37a",doorSide:"south"},
 {id:"port-terminal",label:"PORT OF LAGOS",kind:"port",district:"port",x:105,z:142,w:23,d:15,h:8,color:"#b7a58a",doorSide:"west"},
 ...Array.from({length:18},(_,i)=>({id:"home-"+i,label:i%3===0?"Walk-up Apartments":"Residential Home",kind:"residential",district:"residential",x:[106,134,162][i%3]!,z:[-70,-42,-14,14,42,70][Math.floor(i/3)]!,w:i%3===0?9:8,d:8,h:i%3===0?13:6.5,color:["#d9c9a8","#d7d4c8","#c9b39a"][i%3]!,doorSide:"south" as const})),
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
export interface NewMapHill {x:number;z:number;w:number;d:number;h:number}
const treeCandidates: NewMapTree[] = [
 ...Array.from({length:14},(_,i)=>({x:-137+(i%7)*7,z:119+Math.floor(i/7)*8,type:(i%3===0?"palm":"round") as "palm"|"round",h:2.4,park:"lake-park"})),
 ...Array.from({length:12},(_,i)=>({x:104+(i%6)*9,z:112+Math.floor(i/6)*8,type:(i%3===0?"palm":"round") as "palm"|"round",h:2.2,park:"port"})),
 ...Array.from({length:12},(_,i)=>({x:75+(i%6)*8,z:94+Math.floor(i/6)*8,type:(i%3===0?"palm":"round") as "palm"|"round",h:2.1,park:"civic"})),

];
function pointSegmentDistance(px:number,pz:number,a:[number,number],b:[number,number]) { const dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz;const t=den?Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/den)):0;return Math.hypot(px-(a[0]+t*dx),pz-(a[1]+t*dz)); }
export function newMapPointOnRoad(x:number,z:number,margin=0) { return NEW_MAP_ROAD_GRAPH.edges.some(e=>e.points.slice(1).some((p,i)=>pointSegmentDistance(x,z,e.points[i]!,p)<e.width/2+margin)); }
export const NEW_MAP_GROUND_PATCHES = [{x:-163,z:143,w:12,d:9},{x:-130,z:153,w:13,d:8},{x:-75,z:148,w:12,d:10},{x:-151,z:99,w:10,d:9},{x:-88,z:112,w:11,d:9},{x:-145,z:160,w:9,d:8}];
export const NEW_MAP_HILLS: NewMapHill[] = [{x:-158,z:130,w:9,h:1.8,d:7},{x:-151,z:151,w:11,h:2.1,d:8},{x:-88,z:147,w:8,h:1.4,d:7}];
export const NEW_MAP_TREES: NewMapTree[] = treeCandidates.filter(t=>!newMapPointOnRoad(t.x,t.z,3)&&!NEW_MAP_BUILDINGS.some(b=>Math.abs(t.x-b.x)<b.w/2+2&&Math.abs(t.z-b.z)<b.d/2+2)&&Math.hypot(t.x,t.z)>88);
export const NEW_MAP_MARKET_STALLS: NewMapStall[] = Array.from({length:12},(_,i)=>({id:"stall-"+i,x:-88+(i%6)*4.8,z:-124+Math.floor(i/6)*6,w:3.4,d:2.4,color:["#d84f3f","#e2b74f","#347c9d","#4e8052"][i%4]!})).filter(s=>!newMapPointOnRoad(s.x,s.z,2)&&!NEW_MAP_BUILDINGS.some(b=>Math.abs(s.x-b.x)<b.w/2+s.w/2+1&&Math.abs(s.z-b.z)<b.d/2+s.d/2+1));

export function validateNewMapLayout() {
 const errors:string[]=[];
 for(let i=0;i<NEW_MAP_GROUND_PATCHES.length;i++){const p=NEW_MAP_GROUND_PATCHES[i]!;if(Math.hypot(p.x,p.z)<31)errors.push(`ground patch overlaps stadium plaza at ${p.x},${p.z}`);for(const e of NEW_MAP_ROAD_GRAPH.edges)for(let j=1;j<e.points.length;j++){const a=e.points[j-1]!,b=e.points[j]!,dx=Math.abs(b[0]-a[0]),dz=Math.abs(b[1]-a[1]),extent=dx>dz?p.d/2:dz>dx?p.w/2:Math.max(p.w,p.d)/2;if(pointSegmentDistance(p.x,p.z,a,b)<e.width/2+extent+1)errors.push(`ground patch intersects road at ${p.x},${p.z}`);}if(NEW_MAP_BUILDINGS.some(b=>Math.abs(p.x-b.x)<(p.w+b.w)/2&&Math.abs(p.z-b.z)<(p.d+b.d)/2))errors.push(`ground patch intersects building at ${p.x},${p.z}`);if(NEW_MAP_HILLS.some(h=>Math.abs(p.x-h.x)<(p.w+h.w)/2&&Math.abs(p.z-h.z)<(p.d+h.d)/2))errors.push(`ground patch intersects hill at ${p.x},${p.z}`);for(let j=i+1;j<NEW_MAP_GROUND_PATCHES.length;j++){const q=NEW_MAP_GROUND_PATCHES[j]!;if(Math.abs(p.x-q.x)<(p.w+q.w)/2&&Math.abs(p.z-q.z)<(p.d+q.d)/2)errors.push(`ground patch collision at ${p.x},${p.z} / ${q.x},${q.z}`);}}
 for(let i=0;i<NEW_MAP_BUILDINGS.length;i++){
  const a=NEW_MAP_BUILDINGS[i]!;
  if(Math.hypot(a.x,a.z)<28)errors.push(`building ${a.id} overlaps stadium plaza`);
  for(const e of NEW_MAP_ROAD_GRAPH.edges)for(let j=1;j<e.points.length;j++){
   const p0=e.points[j-1]!,p1=e.points[j]!,dx=Math.abs(p1[0]-p0[0]),dz=Math.abs(p1[1]-p0[1]);const extent=dx>dz?a.d/2:dz>dx?a.w/2:Math.max(a.w,a.d)/2;const dist=pointSegmentDistance(a.x,a.z,p0,p1);
   if(dist < e.width/2+extent+3) { errors.push(`building ${a.id} too close to road ${e.id}`); break; }
  }
  for(let j=i+1;j<NEW_MAP_BUILDINGS.length;j++){const b=NEW_MAP_BUILDINGS[j]!;if(Math.abs(a.x-b.x)<(a.w+b.w)/2+1&&Math.abs(a.z-b.z)<(a.d+b.d)/2+1)errors.push(`building collision: ${a.id} / ${b.id}`);}
 }
 for(let i=0;i<NEW_MAP_MARKET_STALLS.length;i++){const s=NEW_MAP_MARKET_STALLS[i]!;if(newMapPointOnRoad(s.x,s.z,Math.max(s.w,s.d)/2+1))errors.push(`stall ${s.id} intersects road corridor`);if(Math.hypot(s.x,s.z)<28)errors.push(`stall ${s.id} overlaps stadium plaza`);for(let j=i+1;j<NEW_MAP_MARKET_STALLS.length;j++){const q=NEW_MAP_MARKET_STALLS[j]!;if(Math.abs(s.x-q.x)<(s.w+q.w)/2&&Math.abs(s.z-q.z)<(s.d+q.d)/2)errors.push(`stall collision: ${s.id} / ${q.id}`);}}
 for(let i=0;i<NEW_MAP_TREES.length;i++){const t=NEW_MAP_TREES[i]!;if(newMapPointOnRoad(t.x,t.z,3))errors.push(`tree intersects road corridor at ${t.x},${t.z}`);if(Math.hypot(t.x,t.z)<31)errors.push(`tree overlaps stadium plaza at ${t.x},${t.z}`);if(NEW_MAP_BUILDINGS.some(b=>Math.abs(t.x-b.x)<b.w/2+2&&Math.abs(t.z-b.z)<b.d/2+2))errors.push(`tree intersects building at ${t.x},${t.z}`);if(NEW_MAP_MARKET_STALLS.some(s=>Math.abs(t.x-s.x)<s.w/2+1&&Math.abs(t.z-s.z)<s.d/2+1))errors.push(`tree intersects market stall at ${t.x},${t.z}`);for(let j=i+1;j<NEW_MAP_TREES.length;j++){const q=NEW_MAP_TREES[j]!;if(Math.hypot(t.x-q.x,t.z-q.z)<3.5)errors.push(`tree collision at ${t.x},${t.z} / ${q.x},${q.z}`);}}
 for(const h of NEW_MAP_HILLS){if(newMapPointOnRoad(h.x,h.z,Math.max(h.w,h.d)/2+1))errors.push(`hill intersects road corridor at ${h.x},${h.z}`);if(Math.hypot(h.x,h.z)<31)errors.push(`hill overlaps stadium plaza at ${h.x},${h.z}`);if(NEW_MAP_BUILDINGS.some(b=>Math.abs(h.x-b.x)<b.w/2+h.w/2&&Math.abs(h.z-b.z)<b.d/2+h.d/2))errors.push(`hill intersects building at ${h.x},${h.z}`);if(NEW_MAP_TREES.some(t=>Math.abs(h.x-t.x)<h.w/2+2&&Math.abs(h.z-t.z)<h.d/2+2))errors.push(`hill intersects tree at ${h.x},${h.z}`);}
 return errors;
}
