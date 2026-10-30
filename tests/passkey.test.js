import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerPasskey,protectPin,recoverPin} from '../passkey.js';
import {b64} from '../core.js';
const prf=crypto.getRandomValues(new Uint8Array(32)),id=new Uint8Array([1,2,3,4]);
let mode='ok',createOptions,getOptions;
const url64=b=>b64(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
globalThis.location={origin:'https://example.test',hostname:'example.test',href:'https://example.test/fsb/'};
globalThis.isSecureContext=true;globalThis.PublicKeyCredential=class{};
async function response(options,type){
 const auth=new Uint8Array(37);auth.set(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(location.hostname))));auth[32]=mode==='no-uv'?1:5;
 const client=new TextEncoder().encode(JSON.stringify({type,origin:mode==='wrong-origin'?'https://evil.test':location.origin,challenge:url64(options.challenge),crossOrigin:false}));
 return {type:'public-key',rawId:mode==='wrong-id'?new Uint8Array([9]):id,response:{clientDataJSON:client,authenticatorData:auth,getAuthenticatorData:()=>auth},getClientExtensionResults:()=>mode==='no-prf'?{}:{prf:{enabled:true,results:{first:mode==='wrong-key'?new Uint8Array(32):prf}}}};
}
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{credentials:{async create({publicKey}){createOptions=publicKey;return response(publicKey,'webauthn.create');},async get({publicKey}){getOptions=publicKey;if(mode==='cancel')throw new DOMException('cancelled','NotAllowedError');return response(publicKey,'webauthn.get');}}}});
test('Passkey lifecycle protects PIN, requires UV and binds to one credential and app',async()=>{
 mode='ok';const r=await registerPasskey('app-salt');const protectedPin=await protectPin(r,'123456');
 assert.equal(createOptions.authenticatorSelection.userVerification,'required');assert.equal(getOptions.userVerification,'required');assert.equal(getOptions.allowCredentials.length,1);
 assert.ok(!JSON.stringify(protectedPin).includes('123456'));assert.equal(await recoverPin(protectedPin,'app-salt'),'123456');
 await assert.rejects(()=>recoverPin(protectedPin,'changed-salt'));
 await assert.rejects(()=>recoverPin({...protectedPin,context:'https://example.test/other/'},'app-salt'));
 await assert.rejects(()=>recoverPin({...protectedPin,cipher:'AAAA'+protectedPin.cipher.slice(4)},'app-salt'));
 for(const failure of ['wrong-id','no-uv','wrong-origin','no-prf','wrong-key','cancel']){mode=failure;await assert.rejects(()=>recoverPin(protectedPin,'app-salt'),failure);}
 mode='no-prf';await assert.rejects(()=>registerPasskey('app-salt'));mode='ok';
});
