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
export function emptyData() {return {schema:1,recurring:[],income:[],payments:[],notes:[],events:[],expenses:[],cards:[],tasks:[],shopping:[],cars:[],service:[],vault:null};}
export function validateData(d) {if(d?.schema!==1 || !['notes','events','expenses','cards','tasks','shopping','cars','service'].every(k=>Array.isArray(d[k]))) throw Error('Záloha neobsahuje údaje FSB.');for(const k of ['recurring','income','payments']){if(d[k]===undefined)d[k]=[];if(!Array.isArray(d[k]))throw Error('Neplatné finančné údaje.');}return d;}
