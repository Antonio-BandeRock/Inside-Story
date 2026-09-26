const fs=require('fs'),path=require('path');
const lines=fs.readFileSync(path.join(__dirname,'items.txt'),'utf8').split(/\r?\n/);
const items=[];let group='';
for(const l of lines){if(!l.trim()||l.startsWith('# '))continue;if(l.startsWith('## ')){group=l.slice(3).trim();continue;}
const [id,phase,ship,size,tabs,comps,title,...rest]=l.split('|');items.push({id,phase:+phase,ship,size,tabs,comps,title,how:rest.join('|'),group});}
const SHIP={OTA:'Over the air (JS)',R1:'Android rebuild R1',R2:'iPhone build R2',WK:'Cloudflare Worker',RL:'Relay (Worker plus push)',DB:'Live database, needs owner yes',DEC:'Owner decision first',OPT:'Explicit opt-in only',SRV:'Needs a company server',DOC:'Reading content'};
const PH={0:'Phase 0. Decisions only the owner can make',1:'Phase 1. Foundations',2:'Phase 2. Quick wins over the air',3:'Phase 3. Larger builds over the air',4:'Phase 4. The Android rebuild (R1)',5:'Phase 5. The Worker and the relay',6:'Phase 6. The iPhone build (R2)',7:'Phase 7. Opt-in, server and ruled-out items'};
const item=i=>`### ${i.id}. ${i.title}\n- **Ships by:** ${SHIP[i.ship]} · **Size:** ${i.size} · **Tabs:** ${i.tabs}\n- **Answers:** ${i.comps} · **Theme:** ${i.group}\n- **How:** ${i.how}\n`;
const out=path.join(__dirname,'md');fs.mkdirSync(out,{recursive:true});
let all='';
for(const n of Object.keys(PH)){const list=items.filter(i=>i.phase==+n);
 const body=list.map(item).join('\n');fs.writeFileSync(path.join(out,`phase${n}.md`),body);
 all+=`## ${PH[n]} (${list.length} items)\n\n${body}\n`;}
fs.writeFileSync(path.join(out,'items.md'),all);
console.log(items.length, fs.statSync(path.join(out,'items.md')).size);
