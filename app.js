const KEY = "grace-community-church-v1";
const today = new Date();
const dateAt = (offset = 0) => { const d = new Date(today); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const seed = {
  members: [
    ["Olivia Bennett","olivia.bennett@email.com","(555) 208-4912","Worship",-5],
    ["Noah Williams","noah.williams@email.com","(555) 310-6284","Community care",-8],
    ["Emma Davis","emma.davis@email.com","(555) 921-4407","Youth",-12],
    ["Liam Anderson","liam.anderson@email.com","(555) 670-1235","Hospitality",-17],
    ["Ava Martinez","ava.martinez@email.com","(555) 498-7062","Children",-23],
    ["Ethan Wilson","ethan.wilson@email.com","(555) 337-8421","Music",-30],
    ["Mia Thompson","mia.thompson@email.com","(555) 772-5138","Outreach",-35],
    ["James Taylor","james.taylor@email.com","(555) 205-9993","Welcome team",-40]
  ].map(([name,email,phone,ministry,days],i)=>({id:`m${i}`,name,email,phone,ministry,joined:dateAt(days),status:"Active"})),
  events: [
    ["Sunday Worship Service",2,"9:00 AM","Main sanctuary",128,"Worship"],
    ["Community Bible Study",4,"6:30 PM","Fellowship hall",24,"Community"],
    ["Youth Night",6,"5:00 PM","Youth room",32,"Youth"],
    ["Community Pantry",9,"10:00 AM","Church garden",18,"Outreach"]
  ].map(([name,days,time,location,attendees,category],i)=>({id:`e${i}`,name,date:dateAt(days),time,location,attendees,category})),
  giving: [
    ["Grace Lee",-1,"General fund",250],["Michael Chen",-2,"Community outreach",100],
    ["Sarah Johnson",-3,"Building fund",500],["David Kim",-4,"General fund",75],
    ["Rachel Adams",-5,"Youth ministry",150],["Daniel Green",-7,"General fund",200]
  ].map(([name,days,fund,amount],i)=>({id:`g${i}`,name,date:dateAt(days),fund,amount})),
  attendance:[154,178,162,201,187,223,208,236],
  baptisms:[],
  marriages:[]
};
const emptyChurchData = () => ({members:[],events:[],giving:[],attendance:[0],baptisms:[],marriages:[]});
const cleanChurchName = value => value.trim().replace(/\s+/g," ").slice(0,60);
const churchInitials = name => name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase() || "CH";
let workspaceStore, data;
try {
  const current = JSON.parse(localStorage.getItem(`${KEY}:workspaces`));
  if (current && Array.isArray(current.churches) && current.churches.length) {
    workspaceStore = current;
  } else {
    const legacy = JSON.parse(localStorage.getItem(KEY));
    const legacyData = legacy && ["members","events","giving","attendance"].every(k=>Array.isArray(legacy[k])) ? legacy : structuredClone(seed);
    workspaceStore = {activeId:"grace-community",churches:[{id:"grace-community",name:"Grace Community",data:legacyData}]};
  }
  let activeChurch = workspaceStore.churches.find(church=>church.id===workspaceStore.activeId);
  if (!activeChurch) {
    activeChurch = workspaceStore.churches[0];
    workspaceStore.activeId = activeChurch.id;
  }
  data = activeChurch.data;
} catch {
  workspaceStore = {activeId:"grace-community",churches:[{id:"grace-community",name:"Grace Community",data:structuredClone(seed)}]};
  data = workspaceStore.churches[0].data;
}
if (!Array.isArray(data.baptisms)) data.baptisms = [];
if (!Array.isArray(data.marriages)) data.marriages = [];
let active = "dashboard", modalType = "", recordTab = "baptisms", toastTimer;
const $ = s => document.querySelector(s);
const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initials = name => name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const fmtDate = (date,opts={month:"short",day:"numeric"}) => date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US",opts) : "—";
const money = value => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
function currentChurch(){return workspaceStore.churches.find(church=>church.id===workspaceStore.activeId)}
function renderWorkspaceIdentity(){
  const name=currentChurch().name;
  $("#church-name").textContent=name;$("#church-breadcrumb").textContent=name;$("#brand-name").textContent=name;
  $("#church-avatar").textContent=churchInitials(name);document.title=`${name} — Church management`;
}
function save(){try{currentChurch().data=data;localStorage.setItem(`${KEY}:workspaces`,JSON.stringify(workspaceStore))}catch(error){notify("Could not save changes in this browser.");console.error("Unable to save church records.",error)}}
function renderWorkspaceChooser(){
  $("#modal-title").textContent="Church workspaces";
  $("#submit").textContent="Add church";
  $("#fields").innerHTML=`<p class="form-intro">Each church has its own separate member, attendance, giving, and life-event records on this device.</p><div class="workspace-list">${workspaceStore.churches.map(church=>`<div class="workspace-option ${church.id===workspaceStore.activeId?"current":""}"><span class="church-avatar">${esc(churchInitials(church.name))}</span><span><strong>${esc(church.name)}</strong><small>${church.id===workspaceStore.activeId?"Current workspace":"Separate church records"}</small></span>${church.id===workspaceStore.activeId?'<span class="workspace-current">Current</span>':`<button type="button" class="button secondary workspace-switch" data-switch-workspace="${esc(church.id)}">Switch</button>`}</div>`).join("")}</div><div class="workspace-create"><label class="field"><span>Set up another church</span><input id="new-church-name" name="churchName" maxlength="60" placeholder="Enter church or congregation name"></label><p class="workspace-hint">A fresh workspace will be created. Existing church records will not be copied.</p></div>`;
  $("#form-error").textContent="";$("#backdrop").hidden=false;document.body.style.overflow="hidden";$("#new-church-name").focus();
}
function switchChurch(id){
  const church=workspaceStore.churches.find(item=>item.id===id);
  if(!church){notify("That church workspace could not be found.");return}
  currentChurch().data=data;workspaceStore.activeId=id;data=church.data;
  if(!Array.isArray(data.baptisms))data.baptisms=[];if(!Array.isArray(data.marriages))data.marriages=[];
  closeModal();renderWorkspaceIdentity();render();notify(`Switched to ${church.name}.`);
}
function createChurch(name){
  const churchName=cleanChurchName(name);
  if(!churchName){$("#form-error").textContent="Enter a church name to continue.";return}
  if(workspaceStore.churches.some(church=>church.name.toLowerCase()===churchName.toLowerCase())){$("#form-error").textContent="A workspace with that church name already exists.";return}
  const church={id:uid(),name:churchName,data:emptyChurchData()};
  currentChurch().data=data;workspaceStore.churches.push(church);workspaceStore.activeId=church.id;data=church.data;
  save();closeModal();renderWorkspaceIdentity();render();notify(`${churchName} workspace created.`);
}
function notify(text){const t=$("#toast");t.textContent=text;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2600)}
function personAvatar(name,index=0){return `<span class="person-avatar tone-${index%4}">${esc(initials(name))}</span>`}
function showView(view){
  if(!["dashboard","members","attendance","events","giving","records"].includes(view))view="dashboard";
  active=view;document.querySelectorAll(".view").forEach(el=>el.classList.toggle("active",el.id===`view-${view}`));
  document.querySelectorAll(".nav-link").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
  $("#crumb").textContent=({dashboard:"Overview",members:"Members",attendance:"Attendance",events:"Events",giving:"Giving",records:"Life event records"})[view];
  $("#sidebar").classList.remove("open");render();
  if(location.hash!==`#${view}`)history.replaceState(null,"",`#${view}`);
}
function renderDashboard(){
  const month=data.giving.filter(g=>{const d=new Date(`${g.date}T12:00:00`);return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear()}).reduce((n,g)=>n+Number(g.amount),0);
  const events=[...data.events].filter(e=>e.date>=dateAt()).sort((a,b)=>a.date.localeCompare(b.date));
  $("#today-label").textContent=today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  $("#stat-members").textContent=data.members.length.toLocaleString();$("#stat-attendance").textContent=(data.attendance.at(-1)||0).toLocaleString();
  $("#stat-giving").textContent=money(month);$("#stat-events").textContent=events.length;$("#member-count").textContent=data.members.length;
  $("#records-count").textContent=data.baptisms.length+data.marriages.length;
  $("#next-event").textContent=events[0]?fmtDate(events[0].date):"None scheduled";$("#chart-total").textContent=data.attendance.at(-1)||0;
  const values=data.attendance.slice($("#period").value==="Last 4 weeks"?-4:-8),max=Math.max(...values,1)*1.15;
  $("#chart").innerHTML=values.map((v,i)=>`<div class="bar-group"><span class="tooltip">${v} people</span><div class="bar ${i===values.length-1?"current":""}" style="height:${Math.max(5,v/max*100)}%"></div><span class="bar-label">${i===values.length-1?"This wk":`${values.length-i}w ago`}</span></div>`).join("");
  $("#upcoming").innerHTML=events.length?events.slice(0,3).map(e=>`<div class="event-row"><span class="date-tile"><strong>${fmtDate(e.date,{day:"numeric"})}</strong><small>${fmtDate(e.date,{month:"short"})}</small></span><span class="event-copy"><strong>${esc(e.name)}</strong><small>${esc(e.time)} · ${esc(e.location)}</small></span><span class="event-count">${Number(e.attendees)||0} going</span></div>`).join(""):`<div class="empty">No upcoming events yet.</div>`;
  $("#recent-members").innerHTML=`<div class="compact-list">${[...data.members].sort((a,b)=>b.joined.localeCompare(a.joined)).slice(0,3).map((m,i)=>`<div class="compact-row">${personAvatar(m.name,i)}<span class="compact-copy"><strong>${esc(m.name)}</strong><small>${esc(m.ministry)} · joined ${fmtDate(m.joined)}</small></span><span class="compact-meta">${esc(m.status)}</span></div>`).join("")||'<div class="empty">Add your first member to get started.</div>'}</div>`;
  $("#recent-giving").innerHTML=`<div class="compact-list">${[...data.giving].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map((g,i)=>`<div class="compact-row">${personAvatar(g.name,i)}<span class="compact-copy"><strong>${esc(g.name)}</strong><small>${esc(g.fund)} · ${fmtDate(g.date)}</small></span><span class="compact-meta giving-amount">${money(g.amount)}</span></div>`).join("")||'<div class="empty">Giving records will appear here.</div>'}</div>`;
}
function memberRows(rows){return rows.length?rows.map((m,i)=>`<tr><td><span class="table-person">${personAvatar(m.name,i)}<strong>${esc(m.name)}</strong></span></td><td>${esc(m.email||"—")}</td><td>${esc(m.ministry||"—")}</td><td>${fmtDate(m.joined)}</td><td><span class="status">${esc(m.status)}</span></td><td><button class="row-action" data-delete="members" data-id="${esc(m.id)}" aria-label="Remove ${esc(m.name)}">···</button></td></tr>`).join(""):'<tr><td colspan="6" class="table-empty">No members match your search.</td></tr>'}
function renderMembers(query="", ministry=""){
  const rows=data.members.filter(m=>(!ministry||m.ministry===ministry)&&[m.name,m.email,m.phone,m.ministry,m.status].some(v=>String(v).toLowerCase().includes(query.toLowerCase())));
  $("#members-view").innerHTML=`<div class="view-header"><div><p class="eyebrow">YOUR CHURCH FAMILY</p><h1 class="page-title">Members</h1><p class="subtitle">${data.members.length} people in your community</p></div><button class="button primary" data-action="add-member"><svg><use href="#plus"/></svg> Add a member</button></div><div class="toolbar"><label class="table-search"><svg><use href="#search"/></svg><input id="member-filter" type="search" value="${esc(query)}" placeholder="Search members..."></label><select class="filter-select" id="ministry-filter"><option value="">All ministries</option>${[...new Set(data.members.map(m=>m.ministry).filter(Boolean))].sort().map(m=>`<option>${esc(m)}</option>`).join("")}</select></div><div class="table-card"><div class="table-scroll"><table><thead><tr><th>NAME</th><th>EMAIL</th><th>MINISTRY</th><th>JOINED</th><th>STATUS</th><th></th></tr></thead><tbody id="member-rows">${memberRows(rows)}</tbody></table></div><div class="table-footer"><span id="member-results">Showing ${rows.length} of ${data.members.length} members</span><span>Member directory</span></div></div>`;
}
function renderAttendance(){
  const count=data.attendance.at(-1)||0;
  $("#attendance-view").innerHTML=`<div class="view-header"><div><p class="eyebrow">GATHERING TOGETHER</p><h1 class="page-title">Attendance</h1><p class="subtitle">Keep track of your community at each service.</p></div></div><div class="attendance-date"><div><strong>This Sunday · ${fmtDate(dateAt(),{weekday:"long",month:"long",day:"numeric"})}</strong><br><span>${count} people checked in</span></div><button class="checkin" data-action="check-in">＋ Check in a person</button></div><article class="panel"><div class="panel-head"><div><h2>Recent Sundays</h2><p>Attendance totals for your latest services</p></div></div><div class="chart-wrap" style="height:210px;margin-top:24px"><div class="y-labels"><span>300</span><span>200</span><span>100</span><span>0</span></div><div class="chart">${data.attendance.slice(-8).map((v,i,a)=>`<div class="bar-group"><span class="tooltip">${v} people</span><div class="bar ${i===a.length-1?"current":""}" style="height:${Math.max(5,v/300*100)}%"></div><span class="bar-label">${i===a.length-1?"Today":`${a.length-i}w ago`}</span></div>`).join("")}</div></div><div class="table-footer"><span>Average attendance</span><b>${Math.round(data.attendance.reduce((a,b)=>a+b,0)/Math.max(1,data.attendance.length))} people</b></div></article>`;
}
function renderEvents(query=""){
  const rows=[...data.events].filter(e=>`${e.name} ${e.location} ${e.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>a.date.localeCompare(b.date));
  $("#events-view").innerHTML=`<div class="view-header"><div><p class="eyebrow">LIFE AT GRACE COMMUNITY</p><h1 class="page-title">Events</h1><p class="subtitle">${data.events.length} upcoming gatherings and activities</p></div><button class="button primary" data-action="add-event"><svg><use href="#plus"/></svg> Create an event</button></div><div class="toolbar"><label class="table-search"><svg><use href="#search"/></svg><input id="event-filter" type="search" value="${esc(query)}" placeholder="Search events..."></label></div><div class="event-grid">${rows.length?rows.map(e=>`<article class="event-card"><span class="date-tile"><strong>${fmtDate(e.date,{day:"numeric"})}</strong><small>${fmtDate(e.date,{month:"short"})}</small></span><h3>${esc(e.name)}</h3><p>${esc(e.category||"Church event")}</p><span class="event-detail"><svg><use href="#clock"/></svg>${esc(e.time)}</span><span class="event-detail"><svg><use href="#pin"/></svg>${esc(e.location)}</span><div class="event-bottom"><span>${Number(e.attendees)||0} expected</span><button class="row-action" data-delete="events" data-id="${esc(e.id)}" aria-label="Remove ${esc(e.name)}">···</button></div></article>`).join(""):'<div class="panel empty">No events found. Create an event to bring everyone together.</div>'}</div>`;
}
function renderGiving(query=""){
  const month=data.giving.filter(g=>{const d=new Date(`${g.date}T12:00:00`);return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear()}),total=data.giving.reduce((a,g)=>a+Number(g.amount),0);
  const rows=[...data.giving].filter(g=>`${g.name} ${g.fund}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));
  $("#giving-view").innerHTML=`<div class="view-header"><div><p class="eyebrow">A SPIRIT OF GENEROSITY</p><h1 class="page-title">Giving</h1><p class="subtitle">A clear, thoughtful record of community giving.</p></div><button class="button primary" data-action="add-gift"><svg><use href="#plus"/></svg> Record a gift</button></div><div class="giving-summary"><div class="giving-stat"><span>Given this month</span><strong>${money(month.reduce((a,g)=>a+Number(g.amount),0))}</strong><small>${month.length} gifts this month</small></div><div class="giving-stat"><span>Total recorded gifts</span><strong>${money(total)}</strong><small>${data.giving.length} contributions</small></div><div class="giving-stat"><span>Average gift</span><strong>${money(data.giving.length?total/data.giving.length:0)}</strong><small>Across all records</small></div></div><div class="toolbar"><label class="table-search"><svg><use href="#search"/></svg><input id="giving-filter" type="search" value="${esc(query)}" placeholder="Search contributions..."></label><button class="button secondary" data-action="export">↓ Export CSV</button></div><div class="table-card"><div class="table-scroll"><table><thead><tr><th>GIVER</th><th>DATE</th><th>FUND</th><th>AMOUNT</th><th></th></tr></thead><tbody>${rows.length?rows.map((g,i)=>`<tr><td><span class="table-person">${personAvatar(g.name,i)}<strong>${esc(g.name)}</strong></span></td><td>${fmtDate(g.date)}</td><td>${esc(g.fund)}</td><td><strong>${money(g.amount)}</strong></td><td><button class="row-action" data-delete="giving" data-id="${esc(g.id)}" aria-label="Remove gift from ${esc(g.name)}">···</button></td></tr>`).join(""):'<tr><td colspan="5" class="table-empty">No contributions match your search.</td></tr>'}</tbody></table></div><div class="table-footer"><span>Showing ${rows.length} of ${data.giving.length} gifts</span><span>All values in USD</span></div></div>`;
}
function renderRecords(){
  const baptisms=data.baptisms,marriages=data.marriages,rows=recordTab==="baptisms"?baptisms:marriages;
  const latest=records=>[...records].sort((a,b)=>(b.baptismDate||b.marriageDate||"").localeCompare(a.baptismDate||a.marriageDate||""))[0];
  $("#records-view").innerHTML=`<div class="records-hero"><div><p class="eyebrow">ADMINISTRATOR WORKSPACE</p><h1 class="page-title">Life event records</h1><p class="subtitle">Honor important milestones and keep each family’s church records together.</p></div><span class="hero-flower">✳</span></div>
  <div class="record-summary"><article class="record-stat baptism-stat"><span class="record-icon">✧</span><span><small>Baptism cards</small><strong>${baptisms.length}</strong><small class="record-latest">${latest(baptisms)?`Latest · ${fmtDate(latest(baptisms).baptismDate)}`:"No records yet"}</small></span></article><article class="record-stat marriage-stat"><span class="record-icon">♡</span><span><small>Marriage certificates</small><strong>${marriages.length}</strong><small class="record-latest">${latest(marriages)?`Latest · ${fmtDate(latest(marriages).marriageDate)}`:"No records yet"}</small></span></article><article class="record-stat records-total"><span class="record-icon">✦</span><span><small>Total milestones</small><strong>${baptisms.length+marriages.length}</strong><small class="record-latest">Kept in your church register</small></span></article></div>
  <div class="record-toolbar"><div><h2>Church register</h2><p>Administered privately by your church team.</p></div><div class="record-actions"><button class="button baptism-button" data-action="add-baptism">＋ Add baptism card</button><button class="button marriage-button" data-action="add-marriage">＋ Add marriage certificate</button></div></div>
  <div class="record-tabs" role="tablist" aria-label="Life event records"><button class="record-tab ${recordTab==="baptisms"?"selected":""}" data-record-tab="baptisms" role="tab" aria-selected="${recordTab==="baptisms"}">Baptisms <span>${baptisms.length}</span></button><button class="record-tab ${recordTab==="marriages"?"selected":""}" data-record-tab="marriages" role="tab" aria-selected="${recordTab==="marriages"}">Marriages <span>${marriages.length}</span></button></div>
  <div class="table-card"><div class="table-scroll"><table><thead>${recordTab==="baptisms"?'<tr><th>PERSON BAPTIZED</th><th>BAPTISM DATE</th><th>DATE OF BIRTH</th><th>PARENTS / GUARDIANS</th><th>OFFICIANT</th><th>CARD NO.</th><th></th></tr>':'<tr><th>COUPLE</th><th>MARRIAGE DATE</th><th>LOCATION</th><th>OFFICIANT</th><th>WITNESSES</th><th>CERTIFICATE NO.</th><th></th></tr>'}</thead><tbody>${rows.length?rows.map((r,i)=>recordTab==="baptisms"?`<tr><td><span class="table-person">${personAvatar(r.fullName,i)}<strong>${esc(r.fullName)}</strong></span></td><td>${fmtDate(r.baptismDate)}</td><td>${fmtDate(r.dateOfBirth)}</td><td>${esc(r.parents||"—")}</td><td>${esc(r.officiant)}</td><td><span class="certificate-number">${esc(r.certificateNo)}</span></td><td><button class="row-action" data-delete="baptisms" data-id="${esc(r.id)}" aria-label="Remove baptism record">···</button></td></tr>`:`<tr><td><span class="couple-name"><strong>${esc(r.spouseOne)}</strong><span> & </span><strong>${esc(r.spouseTwo)}</strong></span></td><td>${fmtDate(r.marriageDate)}</td><td>${esc(r.location)}</td><td>${esc(r.officiant)}</td><td>${esc([r.witnessOne,r.witnessTwo].filter(Boolean).join(" & ")||"—")}</td><td><span class="certificate-number">${esc(r.certificateNo)}</span></td><td><button class="row-action" data-delete="marriages" data-id="${esc(r.id)}" aria-label="Remove marriage record">···</button></td></tr>`).join(""):`<tr><td colspan="7" class="table-empty">No ${recordTab} on file yet. Use the buttons above to add the first record.</td></tr>`}</tbody></table></div><div class="table-footer"><span>${rows.length} ${recordTab==="baptisms"?"baptism cards":"marriage certificates"} in this register</span><span>Administrator records</span></div></div>
  <p class="privacy-note">These records are stored in this browser only. For sensitive family information, use a secure, backed-up system with access controls.</p>`;
}
function render(){renderDashboard();if(active==="members")renderMembers($("#member-filter")?.value||"");if(active==="attendance")renderAttendance();if(active==="events")renderEvents($("#event-filter")?.value||"");if(active==="giving")renderGiving($("#giving-filter")?.value||"");if(active==="records")renderRecords()}
const input=(label,name,type="text",opts={})=>`<div class="field ${opts.full?"full":""}"><label for="f-${name}">${label}${opts.required?" *":""}</label>${type==="select"?`<select id="f-${name}" name="${name}">${opts.values.map(v=>`<option>${esc(v)}</option>`).join("")}</select>`:`<input id="f-${name}" name="${name}" type="${type}" ${opts.required?"required":""} ${opts.placeholder?`placeholder="${esc(opts.placeholder)}"`:""} ${opts.min!==undefined?`min="${opts.min}"`:""} ${opts.step?`step="${opts.step}"`:""} ${opts.value?`value="${opts.value}"`:""}>`}</div>`;
function openModal(type){
  modalType=type;
  if(type==="workspace"){renderWorkspaceChooser();return}
  const forms={
    member:["Add a member","Save member",`<div class="form-grid">${input("Full name","name","text",{required:true,placeholder:"e.g. Alex Morgan"})}${input("Email address","email","email",{required:true,placeholder:"alex@example.com"})}${input("Phone number","phone","tel",{placeholder:"(555) 000-0000"})}${input("Ministry","ministry","select",{values:["Community","Worship","Children","Youth","Hospitality","Outreach","Music","Community care"]})}${input("Join date","joined","date",{required:true,value:dateAt()})}</div>`],
    event:["Create an event","Create event",`<div class="form-grid">${input("Event name","name","text",{required:true,full:true,placeholder:"e.g. Sunday worship"})}${input("Date","date","date",{required:true,value:dateAt(2)})}${input("Start time","time","time",{required:true})}${input("Location","location","text",{required:true,full:true,placeholder:"e.g. Main sanctuary"})}${input("Category","category","select",{values:["Worship","Community","Youth","Outreach","Children","Other"]})}${input("Expected attendees","attendees","number",{min:0,value:"0"})}</div>`],
    gift:["Record a gift","Save contribution",`<div class="form-grid">${input("Giver name","name","text",{required:true,placeholder:"e.g. Alex Morgan"})}${input("Amount (USD)","amount","number",{required:true,min:0.01,step:"0.01",placeholder:"0.00"})}${input("Fund","fund","select",{values:["General fund","Community outreach","Building fund","Youth ministry","Children's ministry","Other"],full:true})}${input("Date","date","date",{required:true,value:dateAt()})}</div>`],
    baptism:["Add a baptism card","Save baptism card",`<p class="form-intro">Record the baptism details for your church register.</p><div class="form-grid">${input("Full name","fullName","text",{required:true,placeholder:"Name as it should appear on the card",full:true})}${input("Date of birth","dateOfBirth","date")}${input("Baptism date","baptismDate","date",{required:true,value:dateAt()})}${input("Parent(s) / guardian(s)","parents","text",{placeholder:"Parent or guardian names",full:true})}${input("Godparent(s)","godparents","text",{placeholder:"Optional",full:true})}${input("Officiating minister","officiant","text",{required:true,placeholder:"Minister's full name"})}${input("Church / location","location","text",{placeholder:"Church or venue"})}${input("Baptism card number","certificateNo","text",{placeholder:"Leave blank to assign automatically"})}${input("Notes","notes","text",{placeholder:"Optional",full:true})}</div>`],
    marriage:["Add a marriage certificate","Save marriage record",`<p class="form-intro">Record the marriage details for your church register.</p><div class="form-grid">${input("First spouse full name","spouseOne","text",{required:true,placeholder:"Full legal name"})}${input("Second spouse full name","spouseTwo","text",{required:true,placeholder:"Full legal name"})}${input("Marriage date","marriageDate","date",{required:true,value:dateAt()})}${input("Ceremony location","location","text",{required:true,placeholder:"Church or venue"})}${input("Officiating minister","officiant","text",{required:true,placeholder:"Minister's full name",full:true})}${input("Witness one","witnessOne","text",{placeholder:"Full name"})}${input("Witness two","witnessTwo","text",{placeholder:"Full name"})}${input("Certificate number","certificateNo","text",{placeholder:"Leave blank to assign automatically"})}${input("Notes","notes","text",{placeholder:"Optional",full:true})}</div>`]
  }[type];
  $("#modal-title").textContent=forms[0];$("#submit").textContent=forms[1];$("#fields").innerHTML=forms[2];$("#form-error").textContent="";$("#backdrop").hidden=false;document.body.style.overflow="hidden";$("#fields input")?.focus();
}
function closeModal(){$("#backdrop").hidden=true;document.body.style.overflow="";modalType=""}
function submitRecord(form){
  const v=Object.fromEntries(new FormData(form).entries());
  if(modalType==="member"){
    if(data.members.some(m=>m.email.toLowerCase()===v.email.toLowerCase())){$("#form-error").textContent="A member with this email address already exists.";return}
    data.members.push({...v,id:uid(),status:"Active"});notify(`${v.name} has been added to your members.`);
  }else if(modalType==="event"){data.events.push({...v,attendees:Number(v.attendees)||0,id:uid()});notify(`${v.name} has been added to your events.`)}
  else if(modalType==="baptism"||modalType==="marriage"){
    const collection=modalType==="baptism"?"baptisms":"marriages",dateField=modalType==="baptism"?"baptismDate":"marriageDate",prefix=modalType==="baptism"?"BAP":"MAR";
    let number=v.certificateNo.trim();
    if(!number){let serial=data[collection].length+1;do{number=`${prefix}-${v[dateField].slice(0,4)}-${String(serial++).padStart(3,"0")}`}while(data[collection].some(record=>record.certificateNo===number))}
    if(data[collection].some(record=>record.certificateNo.toLowerCase()===number.toLowerCase())){$("#form-error").textContent="That certificate number is already in use.";return}
    data[collection].push({...v,certificateNo:number,id:uid()});recordTab=collection;
    notify(modalType==="baptism"?"Baptism card saved to the church register.":"Marriage certificate saved to the church register.");
  }else{data.giving.push({...v,amount:Number(v.amount),id:uid()});notify("Contribution recorded successfully.")}
  save();closeModal();render();
}
function exportCsv(){
  const rows=[["Giver","Date","Fund","Amount (USD)"],...data.giving.map(g=>[g.name,g.date,g.fund,Number(g.amount).toFixed(2)])];
  const csv=rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");
  a.href=url;a.download=`grace-community-giving-${dateAt()}.csv`;a.click();URL.revokeObjectURL(url);notify("Your giving report has been downloaded.");
}
document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-view]");if(nav){e.preventDefault();showView(nav.dataset.view);return}
  const switchButton=e.target.closest("[data-switch-workspace]");if(switchButton){switchChurch(switchButton.dataset.switchWorkspace);return}
  const tab=e.target.closest("[data-record-tab]");if(tab){recordTab=tab.dataset.recordTab;renderRecords();return}
  const action=e.target.closest("[data-action]");
  if(action){const a=action.dataset.action;if(a==="add-member")openModal("member");if(a==="add-event")openModal("event");if(a==="add-gift")openModal("gift");if(a==="add-baptism")openModal("baptism");if(a==="add-marriage")openModal("marriage");if(a==="export")exportCsv();if(a==="check-in"){data.attendance[data.attendance.length-1]=(data.attendance.at(-1)||0)+1;save();render();notify("One person checked in for this Sunday.")}return}
  const del=e.target.closest("[data-delete]");if(del){const list=del.dataset.delete,item=data[list].find(x=>x.id===del.dataset.id),label=item?.name||item?.fullName||(item?`${item.spouseOne} and ${item.spouseTwo}`:"");if(item&&confirm(`Remove ${label} from your records?`)){data[list]=data[list].filter(x=>x.id!==del.dataset.id);save();render();notify("Record removed.")}}
});
document.addEventListener("input",e=>{
  if(e.target.id==="member-filter"||e.target.id==="ministry-filter"){const q=$("#member-filter").value.toLowerCase(),ministry=$("#ministry-filter").value,rows=data.members.filter(m=>(!ministry||m.ministry===ministry)&&[m.name,m.email,m.phone,m.ministry,m.status].some(v=>String(v).toLowerCase().includes(q)));$("#member-rows").innerHTML=memberRows(rows);$("#member-results").textContent=`Showing ${rows.length} of ${data.members.length} members`}
  if(e.target.id==="event-filter")renderEvents(e.target.value);
  if(e.target.id==="giving-filter")renderGiving(e.target.value);
  if(e.target.id==="global-search"&&e.target.value.trim()){
    const q=e.target.value.trim().toLowerCase();
    if(data.members.some(m=>`${m.name} ${m.email}`.toLowerCase().includes(q))){showView("members");$("#member-filter").value=e.target.value;$("#member-filter").dispatchEvent(new Event("input"))}
    else if(data.events.some(v=>v.name.toLowerCase().includes(q))){showView("events");$("#event-filter").value=e.target.value;renderEvents(e.target.value)}
    else if(data.giving.some(v=>`${v.name} ${v.fund}`.toLowerCase().includes(q))){showView("giving");$("#giving-filter").value=e.target.value;renderGiving(e.target.value)}
  }
});
document.addEventListener("change",e=>{if(e.target.id==="ministry-filter")e.target.dispatchEvent(new Event("input",{bubbles:true}))});
$("#form").addEventListener("submit",e=>{e.preventDefault();if(modalType==="workspace"){createChurch(new FormData(e.currentTarget).get("churchName")?.toString()||"");return}if(e.currentTarget.reportValidity())submitRecord(e.currentTarget)});
document.querySelectorAll(".close").forEach(b=>b.addEventListener("click",closeModal));
$("#backdrop").addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal()});
$("#period").addEventListener("change",renderDashboard);$("#menu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#workspace-picker").addEventListener("click",()=>openModal("workspace"));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();$("#sidebar").classList.remove("open")}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#global-search").focus()}});
window.addEventListener("hashchange",()=>showView(location.hash.slice(1)||"dashboard"));
renderWorkspaceIdentity();
showView(location.hash.slice(1)||"dashboard");
