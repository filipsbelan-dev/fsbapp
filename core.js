export const ITERATIONS = 600000;
const enc = new TextEncoder(), dec = new TextDecoder();
export const b64 = bytes => { let s=''; for(const b of new Uint8Array(bytes)) s+=String.fromCharCode(b); return btoa(s); };
export const un64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
export async function derive(secret, salt) {
 const material=await crypto.subtle.importKey('raw',enc.encode(secret),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt:un64(salt),iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function seal(data,key,salt) {
 const iv=crypto.getRandomValues(new Uint8Array(12));
 return {format:'FSB',version:1,iterations:ITERATIONS,salt,iv:b64(iv),cipher:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(data))))};
}
export function validEnvelope(e) {return e && e.format==='FSB' && e.version===1 && e.iterations===ITERATIONS && typeof e.salt==='string' && typeof e.iv==='string' && typeof e.cipher==='string' && un64(e.salt).length===16 && un64(e.iv).length===12;}
export async function open(e,key) {
 if(!validEnvelope(e)) throw Error('Neplatný formát zálohy.');
 return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(e.iv)},key,un64(e.cipher))));
}
export async function createEnvelope(data,secret) {const salt=b64(crypto.getRandomValues(new Uint8Array(16)));const key=await derive(secret,salt);return {key,envelope:await seal(data,key,salt)};}
export const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function monthCells(year,month) { const first=new Date(year,month,1),offset=(first.getDay()+6)%7;return Array.from({length:Math.ceil((offset+new Date(year,month+1,0).getDate())/7)*7},(_,i)=>{const d=new Date(year,month,1-offset+i);return {date:dateKey(d),day:d.getDate(),current:d.getMonth()===month};});}
export const money = n => new Intl.NumberFormat('sk-SK',{style:'currency',currency:'EUR'}).format(Number(n)||0);
export function emptyData() {return {schema:1,recurring:[],income:[],payments:[],notes:[],events:[],expenses:[],cards:[],tasks:[],shopping:[],shoppingLists:[],cars:[],service:[],vault:null};}
export function validateData(d) {if(d?.schema!==1 || !['notes','events','expenses','cards','tasks','shopping','cars','service'].every(k=>Array.isArray(d[k]))) throw Error('Záloha neobsahuje údaje FSB.');for(const k of ['recurring','income','payments']){if(d[k]===undefined)d[k]=[];if(!Array.isArray(d[k]))throw Error('Neplatné finančné údaje.');}return migrateShopping(d);}


// Money calculations use integer cents. Installment balances are the remaining
// agreed payments at the beginning of tracking, including any known interest.
export const cents = value => Math.round((Number(value)||0)*100);
export function installmentInfo(r,payments,month='9999-12') {
 const total=Math.max(0,cents(r.balance));
 const paid=payments.filter(p=>p.recurringId===r.id&&(p.month||p.date?.slice(0,7))>=r.start&&(p.month||p.date?.slice(0,7))<=month).reduce((n,p)=>n+cents(p.amount),0);
 const remaining=Math.max(0,total-paid),amount=cents(r.amount);
 return {total:total/100,paid:Math.min(total,paid)/100,remaining:remaining/100,count:amount>0?Math.ceil(remaining/amount):0,percent:total?Math.min(100,Math.round(paid/total*100)):0};
}
export function recurringDue(r,payments,month) {
 if(r.start>month||(r.end&&r.end<month))return 0;
 if(r.kind!=='Splátka')return Math.max(0,cents(r.amount))/100;
 const before=payments.filter(p=>(p.month||p.date?.slice(0,7))<month);
 return Math.min(Math.max(0,cents(r.amount)),cents(installmentInfo(r,before,month).remaining))/100;
}
export function financeSummary(d,month) {
 const income=(d.income||[]).filter(r=>r.date?.startsWith(month)).reduce((n,r)=>n+cents(r.amount),0);
 const spent=[...(d.expenses||[]),...(d.service||[]),...(d.payments||[])].filter(r=>r.date?.startsWith(month)).reduce((n,r)=>n+cents(r.amount),0);
 const due=(d.recurring||[]).reduce((n,r)=>n+((d.payments||[]).some(p=>p.recurringId===r.id&&p.month===month)?0:cents(recurringDue(r,d.payments||[],month))),0);
 return {income:income/100,spent:spent/100,due:due/100,available:(income-spent)/100,afterBills:(income-spent-due)/100};
}


export function migrateShopping(d){
 if(d.shoppingLists===undefined)d.shoppingLists=[];
 if(!Array.isArray(d.shoppingLists))throw Error('Neplatné nákupné zoznamy.');
 for(const item of d.shopping){
  if(item.listId&&d.shoppingLists.some(l=>l.id===item.listId))continue;
  const name=item.category||'Môj nákup';let list=d.shoppingLists.find(l=>l.title===name);
  if(!list){list={id:'legacy-list-'+d.shoppingLists.length,title:name};while(d.shoppingLists.some(l=>l.id===list.id))list.id+='x';d.shoppingLists.push(list);}
  item.listId=list.id;
 }
 return d;
}
export function shoppingLines(text){return String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);}
