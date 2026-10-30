export type InteriorAction = string;
export interface InteriorProp { type: string; x: number; z: number; rotY: number; scale: [number,number,number]; color: string; }
export interface InteriorNpc { role: string; x: number; z: number; lines: string[]; }
export interface InteriorHotspot { id: string; label: string; x: number; z: number; action: InteriorAction; }
export interface InteriorDef {
  name: string; size: [number,number]; floorColor: string; wallColor: string; accent: string;
  props: InteriorProp[]; npcs: InteriorNpc[]; hotspots: InteriorHotspot[]; exit: {x:number;z:number};
}
const p=(type:string,x:number,z:number,color="#76533b",scale:[number,number,number]=[1,1,1],rotY=0):InteriorProp=>({type,x,z,color,scale,rotY});
const npc=(role:string,x:number,z:number,lines:string[]):InteriorNpc=>({role,x,z,lines:lines.slice(0,3)});
const h=(id:string,label:string,x:number,z:number,action:InteriorAction):InteriorHotspot=>({id,label,x,z,action});
const commonHome=[
 p("sofa",-2,-1,"#537d77",[2.2,.65,.8]),p("table",0,-1,"#8c6748",[1.2,.35,.7]),p("tv",2.4,-1.4,"#1c282d",[.8,.6,.18]),
 p("bed",-2.2,1.8,"#b5a2a0",[1.8,.45,1.4]),p("fridge",2.5,2.1,"#c6d2d1",[.55,1.5,.55]),p("counter",1.3,2.1,"#80644a",[1.4,.8,.65]),
 p("wardrobe",-3.4,1.7,"#79543e",[.7,1.7,.6]),p("plant",3.4,-2.4,"#3c875a",[.6,1,.6])
];
export const INTERIOR_DEFS: Record<string, InteriorDef> = {
  home:{name:"Your 3-Room Flat",size:[34,26],floorColor:"#eeeae0",wallColor:"#087b70",accent:"#39d5b0",props:[
    // Living room
    p("sofa",-9,-5,"#147b68",[5,.9,1.8]),p("table",-5,-5,"#8c6748",[2,.45,1.2]),p("tv",-1,-8,"#17252a",[2,.9,.25]),p("plant",-13,-9,"#27834e",[1.1,2,1.1]),
    // Bedroom / study
    p("bed",8,-6,"#d6d0c5",[4,.55,5]),p("wardrobe",14,-8,"#80563e",[1.6,3,.9]),p("desk",8,1,"#76543b",[3,.9,1.5]),p("computer",8,0,"#263b45",[.9,1.1,.65]),p("chair",8,3,"#394d54",[.8,1,.8]),
    // Kitchen
    p("counter",-9,7,"#80644a",[5,1.2,1.2]),p("stove",-12,7,"#303638",[1.5,.8,1.2]),p("fridge",-4,7,"#d9e1de",[1.5,2.8,1.3]),p("cabinet",-9,9,"#b78c62",[4,1.4,.8]),
    // Bathroom
    p("bath",-14,2,"#dce8e6",[2.4,.8,1.5]),p("sink",-11,2,"#f3f3ec",[1.1,.9,.8]),p("toilet",-14,5,"#f1f1eb",[.9,.8,1.2]),
    // Doorstep, circular garden, paving and carport
    p("path",0,13,"#b9b9ad",[5,.12,8]),p("step",0,10,"#d5d2c8",[4,.25,1.2]),p("lawn",0,17,"#3d914c",[30,.08,12]),p("carport",13,15,"#56636a",[8,.25,7]),p("car",13,15,"#b6a24d",[3,1.2,5])
  ],npcs:[],hotspots:[
    h("sofa","Sit on sofa",-9,-5,"openModal:sofa"),h("bed","Sleep / rest",8,-6,"sleep"),h("laptop","Study / use laptop",8,1,"study:computer"),h("tv","Watch television",-1,-8,"openModal:news"),h("stove","Cook a meal",-12,7,"eat"),h("fridge","Open refrigerator",-4,7,"openPhone:food"),h("shower","Take a shower",-14,2,"openModal:shower"),h("bathroom","Use bathroom",-14,5,"openModal:bathroom"),h("wardrobe","Change outfit",14,-8,"openPhone:wardrobe")
  ],exit:{x:0,z:12}},
  bank:{name:"Bank Lobby",size:[12,10],floorColor:"#4d5e61",wallColor:"#b5c1bd",accent:"#d5b86a",props:[p("counter",-3,-1,"#a68b5e",[2,.8,.55]),p("counter",0,-1,"#a68b5e",[2,.8,.55]),p("counter",3,-1,"#a68b5e",[2,.8,.55]),p("atm",-4,1.6,"#263c47",[.65,1.2,.5]),p("atm",-2.5,1.6,"#263c47",[.65,1.2,.5]),p("desk",3.5,2.3,"#6e5138",[1.4,.8,.8]),p("vault",4.6,-3.1,"#59676b",[1.2,2,.35]),p("chair",-3,-2,"#394d54",[.5,.7,.5]),p("chair",0,-2,"#394d54",[.5,.7,.5]),p("chair",3,-2,"#394d54",[.5,.7,.5])],npcs:[npc("Teller",0,-.4,["Good day, how can I help?","Please join the queue, oga."]),npc("Bank manager",3.5,1.6,["We offer personal loans to qualified customers.","Bring your account details and let's talk."])],hotspots:[h("teller","Teller",0,-1,"openPhone:bank"),h("atm","ATM",-4,1.6,"openPhone:bank"),h("manager","Manager",3.5,2.3,"openModal:loan")],exit:{x:0,z:4.5}},
  "mama-put":{name:"Mama Put Buka",size:[11,10],floorColor:"#8c7357",wallColor:"#d4b98c",accent:"#e4a544",props:[p("counter",0,-2,"#89512e",[3,.9,.7]),p("stove",2,-3,"#363b3c",[1,.7,.8]),p("table",-2,0,"#9a7048",[1.5,.45,.8]),p("table",1,0,"#9a7048",[1.5,.45,.8]),p("bench",-2,.6,"#68452f",[1.8,.35,.35]),p("bench",1,.6,"#68452f",[1.8,.35,.35]),p("menu",0,-3.4,"#f1d487",[1.6,.9,.1])],npcs:[npc("Customer 1",-3,1,["Aunty, one plate rice please.","This stew sweet die!"]),npc("Customer 2",-1,1.5,["Abeg add small meat.","Na this buka I dey come every day."]),npc("Customer 3",2,1.5,["How much be the beans today?","No wahala, I go pay."]),npc("Customer 4",3,0,["The food hot well well.","Make I sit small."])],hotspots:[h("counter","Counter",0,-2,"openPhone:food"),h("seat","Seat",-2,.6,"eat")],exit:{x:0,z:4.5}},
  hospital:{name:"City Hospital",size:[12,10],floorColor:"#d3dfdf",wallColor:"#e9efeb",accent:"#59b9b1",props:[p("desk",-3,-2,"#6f927e",[2,.9,.7]),p("bed",0,1,"#d7e8e8",[1.7,.4,.8]),p("bed",3,1,"#d7e8e8",[1.7,.4,.8]),p("cabinet",3,-2,"#8ea6a2",[.8,1.3,.5]),p("medical",0,-2,"#eef8f5",[.7,1.1,.6])],npcs:[npc("Nurse",-2,-1,["Welcome, please tell me how you feel.","The doctor will see you shortly."]),npc("Nurse",2,2,["Take it easy, you go dey alright.","Please rest on the bed."])],hotspots:[h("checkup","Check-up",-3,-2,"heal"),h("reception","Reception",-3,-2,"openModal:hospital")],exit:{x:0,z:4.5}},
  pharmacy:{name:"Pharmacy",size:[10,9],floorColor:"#c9d7cf",wallColor:"#e4ebe4",accent:"#4aa87b",props:[p("counter",0,-2,"#9a7956",[2.4,.9,.65]),p("shelf",-3,0,"#7d9586",[.7,1.6,.5]),p("shelf",-3,2,"#7d9586",[.7,1.6,.5]),p("shelf",3,0,"#7d9586",[.7,1.6,.5]),p("shelf",3,2,"#7d9586",[.7,1.6,.5])],npcs:[npc("Pharmacist",0,-1,["Good afternoon. What do you need?","We have first aid and basic medicine."])],hotspots:[h("counter","Counter",0,-2,"heal")],exit:{x:0,z:4}},
  police:{name:"Police Station",size:[12,10],floorColor:"#65727b",wallColor:"#aab8bf",accent:"#6da9db",props:[p("desk",-3,-2,"#694f3b",[2,.8,.8]),p("cell",3,-1,"#505e66",[1.5,2,.15]),p("cell",3,1.5,"#505e66",[1.5,2,.15]),p("locker",-2,2,"#627c8c",[1.2,1.8,.6]),p("chair",-3,-.8,"#3d4b52",[.6,.7,.6])],npcs:[npc("Chief",0,-2,["Officer, ready for patrol?","Keep the streets safe, no wahala."]),npc("Desk officer",-3,-1,["State your business, please.","You can report a crime at the front desk."])],hotspots:[h("desk","Desk",-3,-2,"openModal:police"),h("locker","Locker",-2,2,"openModal:uniform"),h("chief","Chief",0,-2,"startShift:security")],exit:{x:0,z:4.5}},
  market:{name:"Central Market",size:[14,11],floorColor:"#89704d",wallColor:"#b9a27b",accent:"#e0ad52",props:Array.from({length:8},(_,i)=>p("stall",-4+(i%4)*2.7,-1+Math.floor(i/4)*3.2,["#d84f3f","#e2b74f","#347c9d","#4e8052"][i%4]!,[.9,1.1,.8])),npcs:[npc("Vendor A",-4,0,["Come see fine things, my customer!","Price no be problem, let's talk."]),npc("Vendor B",0,2,["Oga, buy two and I go reduce price.","Anything you need, I get am."]),npc("Vendor C",4,0,["Market price dey fair today.","Take your time, no rush."])],hotspots:Array.from({length:4},(_,i)=>h("stall-"+i,"Stall "+(i+1),-4+i*2.7,-1,"openPhone:market")).concat([h("haggle","Haggle",0,2,"haggle:market")]),exit:{x:0,z:5}},
  depot:{name:"Bus & Goods Depot",size:[13,10],floorColor:"#777b72",wallColor:"#c5c4b8",accent:"#e2b43d",props:[p("counter",-3,-2,"#936b42",[2,.8,.6]),p("bench",0,0,"#806449",[2,.35,.5]),p("bench",0,1,"#806449",[2,.35,.5]),p("bus",3,1,"#e1bc3c",[2,1.4,3]),p("desk",3,-2,"#6d513a",[1.3,.8,.7])],npcs:[npc("Dispatcher",3,-1,["Boss, I get a delivery for you.","You fit handle one courier run?"]),npc("Ticket clerk",-3,-1,["Where you dey go today?","Buy ticket here, my guy."])],hotspots:[h("ticket","Ticket counter",-3,-2,"openModal:bus-route"),h("dispatcher","Dispatcher",3,-2,"startShift:courier")],exit:{x:0,z:4.5}},
  fuel:{name:"Fuel Station Mini-mart",size:[10,9],floorColor:"#4e6260",wallColor:"#aabcb4",accent:"#e3b847",props:[p("shelf",-3,0,"#7c9a8b",[.7,1.5,.5]),p("shelf",-3,2,"#7c9a8b",[.7,1.5,.5]),p("counter",0,-2,"#9c7953",[2,.8,.7]),p("fridge",3,0,"#c9dfdf",[.7,1.4,.6]),p("pump",3,2,"#db5145",[.6,1.1,.6])],npcs:[npc("Cashier",0,-1,["Welcome to the mini-mart.","You need water, snacks or airtime?"])],hotspots:[h("counter","Counter",0,-2,"openPhone:fuel")],exit:{x:0,z:4}},
  dealership:{name:"Car Dealership",size:[14,11],floorColor:"#48535a",wallColor:"#aab5b7",accent:"#e1bd5a",props:Array.from({length:5},(_,i)=>p("car-display",-4+i*2,0,["#d94f45","#e0c24d","#508fc1","#d5d9dc","#5aaf82"][i]!,[.7,.5,1.2])),npcs:[npc("Salesperson",0,-2,["Welcome to our showroom, take a look.","We can find a car for your budget."])],hotspots:Array.from({length:5},(_,i)=>h("car-"+i,"Display car "+(i+1),-4+i*2,0,"buyCar:sedan")).concat([h("salesperson","Salesperson",0,-2,"openModal:dealer")]),exit:{x:0,z:5}},
  "real-estate":{name:"Real Estate Office",size:[10,9],floorColor:"#76634f",wallColor:"#d2c3a7",accent:"#d7ad5c",props:[p("desk",0,-1,"#6d4e36",[2,.8,.8]),p("board",2,-2,"#b9c9b4",[1.6,1.3,.15]),p("chair",-1,0,"#685a4e",[.5,.7,.5])],npcs:[npc("Property agent",0,-2,["Looking for a place to rent or buy?","I get options for every budget."])],hotspots:[h("board","Property board",2,-2,"openPhone:market"),h("agent","Agent",0,-1,"openModal:property")],exit:{x:0,z:4}},
  tower:{name:"Corporate Towers",size:[14,11],floorColor:"#596a70",wallColor:"#c4d0cf",accent:"#77b8ce",props:[p("desk",-4,0,"#71573d",[1.4,.8,.8]),p("desk",-1,0,"#71573d",[1.4,.8,.8]),p("desk",2,0,"#71573d",[1.4,.8,.8]),p("desk",-4,2,"#71573d",[1.4,.8,.8]),p("elevator",4,-2,"#71898b",[1.2,2,.3]),p("meeting-table",0,-2,"#785d41",[2,.5,1]),p("plant",5,2,"#3b8959",[.7,1.2,.7])],npcs:[npc("Receptionist",-3,-2,["Good morning. Do you have an interview?","Please sign in before going upstairs."]),npc("Manager",2,-2,["We need people who are ready to work.","Finish your tasks in order, please."])],hotspots:[h("reception","Reception",-3,-2,"openModal:interview"),h("phone","Answer phone",-4,0,"startShift:office-clerk"),h("files","File documents",-1,0,"startShift:office-clerk"),h("boss","Deliver to boss",2,-2,"startShift:office-clerk")],exit:{x:0,z:5}},
  factory:{name:"Factory & Warehouse",size:[14,11],floorColor:"#5d625e",wallColor:"#a5aaa4",accent:"#e2a64b",props:[p("conveyor",-2,0,"#4a5153",[3,.5,.7]),p("rack",3,0,"#7c8b83",[1,2,.7]),p("rack",4,2,"#7c8b83",[1,2,.7]),p("forklift",-4,2,"#d2a52d",[1.2,1.1,1.8]),p("locker",-4,-2,"#71868a",[.7,1.5,.6])],npcs:[npc("Foreman",0,-2,["Helmet first, then clock in.","Let's move those packages, no delay."])],hotspots:[h("helmet","Locker",-4,-2,"openModal:uniform"),h("packer","Packer shift",-2,0,"startShift:packer"),h("loader","Loader shift",3,0,"startShift:loader")],exit:{x:0,z:5}},
  university:{name:"City University Campus",size:[16,12],floorColor:"#7c7868",wallColor:"#d7d1bd",accent:"#c6b0e5",props:[p("desk",-5,-2,"#7d6043",[2,.8,.7]),p("desk",-2,0,"#7d6043",[2,.8,.7]),p("desk",1,0,"#7d6043",[2,.8,.7]),p("shelf",5,-1,"#71563e",[.8,1.9,.65]),p("shelf",5,1,"#71563e",[.8,1.9,.65]),p("board",0,-4,"#426d72",[2,1.1,.1]),p("table",-3,3,"#92724f",[2,.55,1]),p("bench",1,3,"#72563d",[2,.4,.5]),p("computer",3,-2,"#293e4a",[.65,.8,.55]),p("plant",-6,3,"#3b8959",[.7,1.2,.7])],npcs:[npc("Admissions officer",-5,-2,["Welcome to City University. How can I help?","Course registration is at this desk."]),npc("Lecturer",-2,0,["Welcome to class, take a seat.","Today we learn skills for your future."]),npc("Librarian",5,-1,["Please keep the library quiet.","You can study here any time."]),npc("Student adviser",1,2,["Need help with campus services?","The student union can help with enquiries."])],hotspots:[h("admissions","Admissions",-5,-2,"openModal:enrol"),h("lecture","Lecture",-2,0,"study:skill"),h("library","Library",5,0,"study:education"),h("computer","Computer lab",3,-2,"study:education"),h("student-services","Student services",1,2,"openModal:enrol")],exit:{x:0,z:5}},
  school:{name:"Secondary School",size:[12,10],floorColor:"#8b8065",wallColor:"#d7d0b8",accent:"#6e9fd1",props:[p("desk",-2,-1,"#75583c",[1.5,.8,.7]),p("desk",0,0,"#75583c",[1.5,.8,.7]),p("desk",2,1,"#75583c",[1.5,.8,.7]),p("board",0,-3,"#3b6d70",[2,1.1,.1])],npcs:[npc("Teacher",0,-2,["Good morning class, settle down.","Education go open doors for you."])],hotspots:[h("teacher","Teacher shift",0,-2,"startShift:teacher")],exit:{x:0,z:4.5}},
  airport:{name:"International Airport Terminal",size:[14,11],floorColor:"#718087",wallColor:"#d4dedc",accent:"#7bc4e4",props:[p("counter",-4,-2,"#9b8b72",[1.8,.9,.7]),p("counter",-1,-2,"#9b8b72",[1.8,.9,.7]),p("counter",2,-2,"#9b8b72",[1.8,.9,.7]),p("board",2,-3,"#25383e",[2,1,.1]),p("gate",4,0,"#6d8e95",[.5,2,.3]),p("seat",-2,1,"#485b65",[1.8,.5,.5]),p("seat",1,1,"#485b65",[1.8,.5,.5])],npcs:[npc("Check-in agent",-2,-1,["Welcome aboard. May I see your ticket?","Check in here before security."]),npc("Security officer",4,-1,["Please keep your documents ready.","Safe travels, boss."])],hotspots:[h("checkin","Check-in desk",-4,-2,"openPhone:travel"),h("security","Security lane",4,0,"openModal:security")],exit:{x:0,z:5}},
  port:{name:"Port Terminal",size:[14,11],floorColor:"#5e6b68",wallColor:"#b8c4bd",accent:"#d8a64d",props:[p("desk",-3,-2,"#74543b",[2,.8,.7]),p("container",2,0,"#bd594b",[1.4,1.4,2.2]),p("container",4,0,"#3f8296",[1.4,1.4,2.2]),p("container",2,2,"#d2a84b",[1.4,1.4,2.2]),p("rack",-3,1,"#697e79",[1,1.5,.7])],npcs:[npc("Dock supervisor",0,-2,["Cargo needs to move before tide changes.","Ready for a shift?"]),npc("Customs clerk",-3,-1,["Show the manifest, please.","No paperwork, no clearance."])],hotspots:[h("dock","Dock worker shift",2,0,"startShift:dock-worker"),h("customs","Customs clerk",-3,-2,"startShift:customs-clerk")],exit:{x:0,z:5}},
  resort:{name:"Lake Park Resort",size:[12,10],floorColor:"#9b896d",wallColor:"#d9d1b9",accent:"#5cbba4",props:[p("desk",-3,-2,"#9b7651",[1.8,.8,.7]),p("table",0,-1,"#906e4d",[1.5,.5,1]),p("chair",1,0,"#4b7775",[.5,.8,.5]),p("pool",3,1,"#277f9b",[2,.2,1.4]),p("plant",-4,2,"#3e8b58",[.8,1.4,.8])],npcs:[npc("Receptionist",-3,-1,["Welcome to the resort, relax small.","A short rest will help you recharge."]),npc("Lifeguard",3,0,["Pool is open, enjoy yourself.","Please be safe in the water."])],hotspots:[h("reception","Reception",-3,-2,"heal"),h("pool","Pool",3,1,"openModal:swim")],exit:{x:0,z:4.5}},
  court:{name:"City Court Complex",size:[14,12],floorColor:"#777b78",wallColor:"#d7d5ca",accent:"#b99a5a",props:[
    p("desk",-4,-2,"#76583e",[2,.9,.8]),p("desk",0,-3,"#76583e",[4,.9,.9]),p("desk",0,-1,"#8d6b49",[2.5,.8,.8]),
    p("chair",-4,0,"#4a555b",[.55,.8,.55]),p("chair",-2,0,"#4a555b",[.55,.8,.55]),p("chair",2,0,"#4a555b",[.55,.8,.55]),p("chair",4,0,"#4a555b",[.55,.8,.55]),
    p("bench",-3,3,"#76583e",[2,.45,.6]),p("bench",0,3,"#76583e",[2,.45,.6]),p("bench",3,3,"#76583e",[2,.45,.6]),
    p("board",5,-2,"#385a62",[1.2,1.5,.12])
  ],npcs:[npc("Court clerk",-4,-1,["Welcome to the court registry.","Please take a seat until your matter is called."]),npc("Court usher",4,1,["The courtroom is this way.","Please keep the aisle clear."]),npc("Registrar",0,-2,["Documents can be filed at the registry desk."])],hotspots:[h("registry","Court registry",-4,-2,"openModal:court"),h("hearing","Court hearing",0,-3,"openModal:court"),h("usher","Court usher",4,1,"openModal:court")],exit:{x:0,z:5}},
  government:{name:"Government House",size:[14,12],floorColor:"#8b8578",wallColor:"#e0d8c7",accent:"#c6a45c",props:[
    p("desk",-3,-2,"#76583e",[2,.9,.8]),p("desk",2,-2,"#76583e",[2,.9,.8]),p("meeting-table",0,1,"#76583e",[3,.65,1.3]),
    p("chair",-3,0,"#45545a",[.55,.8,.55]),p("chair",3,0,"#45545a",[.55,.8,.55]),p("chair",-2,2,"#45545a",[.55,.8,.55]),p("chair",2,2,"#45545a",[.55,.8,.55]),
    p("plant",-5,3,"#3e8055",[.7,1.3,.7]),p("plant",5,3,"#3e8055",[.7,1.3,.7]),p("board",0,-3,"#36545c",[1.8,1.2,.12])
  ],npcs:[npc("Reception officer",-3,-2,["Welcome to Government House.","Please sign in at reception."]),npc("Administrative aide",2,-2,["The meeting room is prepared.","Appointments are handled at reception."])],hotspots:[h("reception","Reception",-3,-2,"openModal:government"),h("meeting","Meeting room",0,1,"openModal:government"),h("admin","Administrative office",2,-2,"openModal:government")],exit:{x:0,z:5}},
  generic:{name:"City Interior",size:[10,9],floorColor:"#777a73",wallColor:"#c7c8bd",accent:"#d6b15e",props:[p("counter",0,-2,"#80664a",[2,.8,.7]),p("chair",-2,0,"#705744",[.6,.7,.6]),p("plant",3,1,"#3b8052",[.7,1.2,.7])],npcs:[npc("Staff member",1,-1,["Welcome in, how can I help?","Please ask if you need anything."])],hotspots:[h("service","Service counter",0,-2,"openModal:service")],exit:{x:0,z:4}}
};

// Career-specific workplace variants keep each employment route visually distinct.
INTERIOR_DEFS["courier-depot"] = { ...INTERIOR_DEFS.depot, name: "Courier Logistics Hub", props: [...INTERIOR_DEFS.depot.props, p("rack",-4,2,"#66877d",[1,1.8,.7]), p("counter",0,2,"#8e6948",[2,.8,.7])], hotspots: [...INTERIOR_DEFS.depot.hotspots, h("dispatch","Dispatch desk",0,2,"openModal:service")] };
INTERIOR_DEFS["transport-depot"] = { ...INTERIOR_DEFS.depot, name: "City Transport Terminal", props: [...INTERIOR_DEFS.depot.props, p("bench",-3,2,"#765b43",[2,.4,.6]), p("board",0,-3,"#253b42",[2,1,.12])] };
INTERIOR_DEFS["construction-site"] = { ...INTERIOR_DEFS.factory, name: "Construction Site Office", props: [...INTERIOR_DEFS.factory.props, p("desk",0,-3,"#76543b",[2,.8,.8]), p("rack",5,2,"#8b927d",[1,1.8,.7])] };
INTERIOR_DEFS["retail-workplace"] = { ...INTERIOR_DEFS.tower, name: "Retail & Corporate Plaza", props: [...INTERIOR_DEFS.tower.props, p("shelf",5,0,"#8b7658",[.8,1.7,.5]), p("counter",5,2,"#a27b50",[1.8,.9,.7])] };
INTERIOR_DEFS["estate-office"] = { ...INTERIOR_DEFS["real-estate"], name: "Property & Estate Office", props: [...INTERIOR_DEFS["real-estate"].props, p("chair",2,1,"#66594d",[.6,.8,.6]), p("board",-3,-2,"#b9c9b4",[1.6,1.3,.15])] };

export function getInteriorKind(label: string, kind?: string): string {
  const k=(kind??"").toLowerCase();
  const known=["home","courier-depot","transport-depot","construction-site","retail-workplace","estate-office","bank","mama-put","hospital","pharmacy","police","market","depot","fuel","dealership","real-estate","tower","factory","university","school","airport","port","resort","court","government"];
  if(known.includes(k))return k;
  const s=label.toLowerCase();
  if(/bank|atm/.test(s))return "bank";
  if(/mama put|buka/.test(s))return "mama-put";
  if(/hospital|clinic/.test(s))return "hospital";
  if(/pharmacy|chemist/.test(s))return "pharmacy";
  if(/police/.test(s))return "police";
  if(/court|justice|judicial|magistrate/.test(s))return "court";
  if(/government house|governor|government complex|administrative house/.test(s))return "government";
  if(/market/.test(s))return "market";
  if(/depot|bus|transport/.test(s))return "depot";
  if(/fuel|oando|petrol/.test(s))return "fuel";
  if(/dealership|motors|car dealer/.test(s))return "dealership";
  if(/real estate|property/.test(s))return "real-estate";
  if(/tower|corporate|business centre|plaza|office/.test(s))return "tower";
  if(/factory|warehouse|industrial/.test(s))return "factory";
  if(/university|polytechnic/.test(s))return "university";
  if(/school|classroom/.test(s))return "school";
  if(/airport|terminal/.test(s))return "airport";
  if(/port|harbour|harbor/.test(s))return "port";
  if(/resort|lake park/.test(s))return "resort";
  if(/home|apartment|studio|house|bungalow|residential/.test(s))return "home";
  return "generic";
}
export function getInteriorDefinition(label: string, kind?: string): InteriorDef {
  const key = getInteriorKind(label,kind);
  return INTERIOR_DEFS[key] ?? INTERIOR_DEFS["generic"]!;
}
