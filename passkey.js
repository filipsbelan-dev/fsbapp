// Local passkey unlock. PRF output protects the PIN; a mere successful assertion
// never unlocks data. This is not a remote account authentication protocol.
import {b64,un64} from './core.js';
const bytes=n=>crypto.getRandomValues(new Uint8Array(n));
const encode=s=>new TextEncoder().encode(s);
const url64=b=>b64(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unsupported=()=>new Error('Tento prehliadač alebo správca prístupových kľúčov nepodporuje bezpečné odomykanie FSB (PRF). Použi PIN.');
function available(){if(!globalThis.isSecureContext||!globalThis.PublicKeyCredential||!navigator.credentials)throw unsupported();}
function context(){return location.origin+new URL('./',location.href).pathname;}
async function checkResponse(credential,challenge,type,expectedId){
 if(!credential||credential.type!=='public-key'||(expectedId&&b64(credential.rawId)!==expectedId))throw Error('Nesprávny prístupový kľúč.');
 const client=JSON.parse(new TextDecoder().decode(credential.response.clientDataJSON));
 if(client.type!==type||client.challenge!==url64(challenge)||client.origin!==location.origin||client.crossOrigin===true)throw Error('Neplatné overenie prístupového kľúča.');
 const auth=new Uint8Array(type==='webauthn.create'?credential.response.getAuthenticatorData():credential.response.authenticatorData);
 const rpHash=new Uint8Array(await crypto.subtle.digest('SHA-256',encode(location.hostname)));
 if(auth.length<37||!(auth[32]&1)||!(auth[32]&4)||!rpHash.every((v,i)=>auth[i]===v))throw Error('Zariadenie nepotvrdilo overenie používateľa.');
}
export async function registerPasskey(envelopeSalt){
 available();const challenge=bytes(32),salt=bytes(32);
 const credential=await navigator.credentials.create({publicKey:{challenge,rp:{id:location.hostname,name:'FSB · Osobný priestor'},user:{id:bytes(32),name:'FSB osobný priestor',displayName:'FSB'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'required',userVerification:'required'},attestation:'none',timeout:60000,extensions:{prf:{eval:{first:salt}}}}});
 await checkResponse(credential,challenge,'webauthn.create');
 if(!credential.getClientExtensionResults()?.prf?.enabled)throw unsupported();
 return {version:1,id:b64(credential.rawId),prfSalt:b64(salt),envelopeSalt,context:context()};
}
async function prfKey(record){
 available();if(record.version!==1||record.context!==context())throw Error('Prístupový kľúč patrí inej adrese appky.');
 const challenge=bytes(32),id=un64(record.id);
 const credential=await navigator.credentials.get({publicKey:{challenge,rpId:location.hostname,allowCredentials:[{type:'public-key',id}],userVerification:'required',timeout:60000,extensions:{prf:{evalByCredential:{[url64(id)]:{first:un64(record.prfSalt)}}}}}});
 await checkResponse(credential,challenge,'webauthn.get',record.id);
 const result=credential.getClientExtensionResults()?.prf?.results?.first;
 if(!result||result.byteLength!==32)throw unsupported();
 return crypto.subtle.importKey('raw',result,'AES-GCM',false,['encrypt','decrypt']);
}
const aad=r=>encode(JSON.stringify(['FSB-passkey-v1',r.id,r.prfSalt,r.envelopeSalt,r.context]));
export async function protectPin(record,pin){
 if(!/^[0-9]{6}$/.test(pin))throw Error('Neplatný PIN.');
 const key=await prfKey(record),iv=bytes(12);
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(record)},key,encode(pin));
 return {...record,iv:b64(iv),cipher:b64(cipher)};
}
export async function recoverPin(record,envelopeSalt){
 if(record.envelopeSalt!==envelopeSalt)throw Error('PIN alebo záloha sa zmenili. Odomkni PIN-om a Face ID nastav znova.');
 const key=await prfKey(record);
 const pin=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(record.iv),additionalData:aad(record)},key,un64(record.cipher)));
 if(!/^[0-9]{6}$/.test(pin))throw Error('Odomknutie sa nepodarilo. Použi PIN.');
 return pin;
}
export function passkeyError(error){return error?.name==='NotAllowedError'||error?.name==='AbortError'?'Overenie bolo zrušené alebo vypršalo. Môžeš použiť PIN.':error?.name==='NotSupportedError'?unsupported().message:error?.name==='OperationError'?'Prístupový kľúč neodomkol údaje. Použi PIN.':error?.message||'Face ID sa nepodarilo nastaviť. Použi PIN.';}
