!function(t,i){"object"==typeof exports&&"undefined"!=typeof module?i(exports):"function"==typeof define&&define.amd?define(["exports"],i):i((t="undefined"!=typeof globalThis?globalThis:t||self).JSONPad={})}(this,(function(t){"use strict";class i{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt),lastActiveAt:t.lastActiveAt?new Date(t.lastActiveAt):null})}}class e{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt),user:t.user?new i(t.user):void 0})}}class n{constructor(t){this.lastLoginAt=null,Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt),user:t.user?new i(t.user):void 0,lastLoginAt:t.lastLoginAt?new Date(t.lastLoginAt):null})}}class o{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt)})}}class s{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt)})}}class d{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt),user:t.user?new i(t.user):void 0})}}function a(t,...i){return Object.fromEntries(Object.entries(t).filter((([t])=>!i.includes(t))))}const l="x-api-token";async function r(t,i,e,n,o,s,d){const a=n?new URLSearchParams({...Object.fromEntries(Object.entries(n).map((([t,i])=>[t,i.toString()])))}):"",r={[l]:t,"Content-Type":"application/json"};s&&(r["x-identity-group"]=s),d&&(r["x-identity-token"]=d);const u=await fetch(`https://api.jsonpad.io${e}?${a}`,{method:i,headers:r,body:o?JSON.stringify(o):void 0});if(!u.ok)throw new Error(await u.text());return 204===u.status?null:await u.json()}t.Event=e,t.Identity=n,t.Index=o,t.Item=s,t.List=d,t.User=i,t.default=class{constructor(t,i,e){this.token=t,this.identityGroup=i,this.identityToken=e}async createList(t){return new d(await r(this.token,"POST","/lists",void 0,t))}async fetchLists(t){const i=await r(this.token,"GET","/lists",t);return{...i,data:i.data.map((t=>new d(t)))}}async fetchList(t){return new d(await r(this.token,"GET",`/lists/${t}`))}async searchList(t,i,e){return(await r(this.token,"GET",`/lists/${t}/search`,{query:i,...e})).map((t=>"item"in t?{relevance:t.relevance,item:new s(t.item)}:t))}async fetchListStats(t,i){return await r(this.token,"GET",`/lists/${t}/stats`,i)}async fetchListEvents(t,i){const n=await r(this.token,"GET",`/lists/${t}/events`,i);return{...n,data:n.data.map((t=>new e(t)))}}async fetchListEvent(t,i){return new e(await r(this.token,"GET",`/lists/${t}/events/${i}`))}async updateList(t,i){return new d(await r(this.token,"PUT",`/lists/${t}`,void 0,i))}async deleteList(t){await r(this.token,"DELETE",`/lists/${t}`)}async createItem(t,i,e,n){var o,d;return new s(await r(this.token,"POST",`/lists/${t}/items`,e,i,(null==n?void 0:n.ignore)?void 0:null!==(o=null==n?void 0:n.group)&&void 0!==o?o:this.identityGroup,(null==n?void 0:n.ignore)?void 0:null!==(d=null==n?void 0:n.token)&&void 0!==d?d:this.identityToken))}async fetchItems(t,i,e){var n,o;const d=await r(this.token,"GET",`/lists/${t}/items`,i,void 0,(null==e?void 0:e.ignore)?void 0:null!==(n=null==e?void 0:e.group)&&void 0!==n?n:this.identityGroup,(null==e?void 0:e.ignore)?void 0:null!==(o=null==e?void 0:e.token)&&void 0!==o?o:this.identityToken);return{...d,data:d.data.map((t=>new s(t)))}}async fetchItemsData(t,i,e){var n,o;const s=(null==i?void 0:i.pointer)?`/${i.pointer}`:"";return await r(this.token,"GET",`/lists/${t}/items/data${s}`,i?a(i,"pointer"):void 0,void 0,(null==e?void 0:e.ignore)?void 0:null!==(n=null==e?void 0:e.group)&&void 0!==n?n:this.identityGroup,(null==e?void 0:e.ignore)?void 0:null!==(o=null==e?void 0:e.token)&&void 0!==o?o:this.identityToken)}async fetchItem(t,i,e,n){var o,d;return new s(await r(this.token,"GET",`/lists/${t}/items/${i}`,e,void 0,(null==n?void 0:n.ignore)?void 0:null!==(o=null==n?void 0:n.group)&&void 0!==o?o:this.identityGroup,(null==n?void 0:n.ignore)?void 0:null!==(d=null==n?void 0:n.token)&&void 0!==d?d:this.identityToken))}async fetchItemData(t,i,e,n){var o,s;const d=(null==e?void 0:e.pointer)?`/${e.pointer}`:"";return await r(this.token,"GET",`/lists/${t}/items/${i}/data${d}`,e?a(e,"pointer"):void 0,void 0,(null==n?void 0:n.ignore)?void 0:null!==(o=null==n?void 0:n.group)&&void 0!==o?o:this.identityGroup,(null==n?void 0:n.ignore)?void 0:null!==(s=null==n?void 0:n.token)&&void 0!==s?s:this.identityToken)}async fetchItemStats(t,i,e){return await r(this.token,"GET",`/lists/${t}/items/${i}/stats`,e)}async fetchItemEvents(t,i,n){const o=await r(this.token,"GET",`/lists/${t}/items/${i}/events`,n);return{...o,data:o.data.map((t=>new e(t)))}}async fetchItemEvent(t,i,n){return new e(await r(this.token,"GET",`/lists/${t}/items/${i}/events/${n}`))}async updateItem(t,i,e,n,o){var d,a;return new s(await r(this.token,"PUT",`/lists/${t}/items/${i}`,n,e,(null==o?void 0:o.ignore)?void 0:null!==(d=null==o?void 0:o.group)&&void 0!==d?d:this.identityGroup,(null==o?void 0:o.ignore)?void 0:null!==(a=null==o?void 0:o.token)&&void 0!==a?a:this.identityToken))}async updateItemData(t,i,e,n,o){var d,a;const l=(null==n?void 0:n.pointer)?`/${n.pointer}`:"";return new s(await r(this.token,"POST",`/lists/${t}/items/${i}/data${l}`,n,e,(null==o?void 0:o.ignore)?void 0:null!==(d=null==o?void 0:o.group)&&void 0!==d?d:this.identityGroup,(null==o?void 0:o.ignore)?void 0:null!==(a=null==o?void 0:o.token)&&void 0!==a?a:this.identityToken))}async replaceItemData(t,i,e,n,o){var d,a;const l=(null==n?void 0:n.pointer)?`/${n.pointer}`:"";return new s(await r(this.token,"PUT",`/lists/${t}/items/${i}/data${l}`,n,e,(null==o?void 0:o.ignore)?void 0:null!==(d=null==o?void 0:o.group)&&void 0!==d?d:this.identityGroup,(null==o?void 0:o.ignore)?void 0:null!==(a=null==o?void 0:o.token)&&void 0!==a?a:this.identityToken))}async patchItemData(t,i,e,n,o){var d,a;const l=(null==n?void 0:n.pointer)?`/${n.pointer}`:"";return new s(await r(this.token,"PATCH",`/lists/${t}/items/${i}/data${l}`,n,e,(null==o?void 0:o.ignore)?void 0:null!==(d=null==o?void 0:o.group)&&void 0!==d?d:this.identityGroup,(null==o?void 0:o.ignore)?void 0:null!==(a=null==o?void 0:o.token)&&void 0!==a?a:this.identityToken))}async deleteItem(t,i,e){var n,o;await r(this.token,"DELETE",`/lists/${t}/items/${i}`,void 0,void 0,(null==e?void 0:e.ignore)?void 0:null!==(n=null==e?void 0:e.group)&&void 0!==n?n:this.identityGroup,(null==e?void 0:e.ignore)?void 0:null!==(o=null==e?void 0:e.token)&&void 0!==o?o:this.identityToken)}async deleteItemData(t,i,e,n){var o,d;const a=(null==e?void 0:e.pointer)?`/${e.pointer}`:"";return new s(await r(this.token,"DELETE",`/lists/${t}/items/${i}/data${a}`,e,void 0,(null==n?void 0:n.ignore)?void 0:null!==(o=null==n?void 0:n.group)&&void 0!==o?o:this.identityGroup,(null==n?void 0:n.ignore)?void 0:null!==(d=null==n?void 0:n.token)&&void 0!==d?d:this.identityToken))}async createIndex(t,i){return new o(await r(this.token,"POST",`/lists/${t}/indexes`,void 0,i))}async fetchIndexes(t,i){const e=await r(this.token,"GET",`/lists/${t}/indexes`,i);return{...e,data:e.data.map((t=>new o(t)))}}async fetchIndex(t,i){return new o(await r(this.token,"GET",`/lists/${t}/indexes/${i}`))}async fetchIndexStats(t,i,e){return await r(this.token,"GET",`/lists/${t}/indexes/${i}/stats`,e)}async fetchIndexEvents(t,i,n){const o=await r(this.token,"GET",`/lists/${t}/indexes/${i}/events`,n);return{...o,data:o.data.map((t=>new e(t)))}}async fetchIndexEvent(t,i,n){return new e(await r(this.token,"GET",`/lists/${t}/indexes/${i}/events/${n}`))}async updateIndex(t,i,e){return new o(await r(this.token,"PUT",`/lists/${t}/indexes/${i}`,void 0,e))}async deleteIndex(t,i){await r(this.token,"DELETE",`/lists/${t}/indexes/${i}`)}async createIdentity(t){return new n(await r(this.token,"POST","/identities",void 0,t))}async fetchIdentities(t){const i=await r(this.token,"GET","/identities",t);return{...i,data:i.data.map((t=>new n(t)))}}async fetchIdentity(t){return new n(await r(this.token,"GET",`/identities/${t}`))}async fetchIdentityStats(t,i){return await r(this.token,"GET",`/identities/${t}/stats`,i)}async fetchIdentityEvents(t,i){const n=await r(this.token,"GET",`/identities/${t}/events`,i);return{...n,data:n.data.map((t=>new e(t)))}}async fetchIdentityEvent(t,i){return new e(await r(this.token,"GET",`/identities/${t}/events/${i}`))}async updateIdentity(t,i){return new n(await r(this.token,"PUT",`/identities/${t}`,void 0,i))}async deleteIdentity(t){await r(this.token,"DELETE",`/identities/${t}`)}async registerIdentity(t,i){var e,o;return new n(await r(this.token,"POST","/identities/register",void 0,t,(null==i?void 0:i.ignore)?void 0:null!==(e=null==i?void 0:i.group)&&void 0!==e?e:this.identityGroup,(null==i?void 0:i.ignore)?void 0:null!==(o=null==i?void 0:i.token)&&void 0!==o?o:this.identityToken))}async loginIdentity(t,i){var e,o;const s=await r(this.token,"POST","/identities/login",void 0,t,(null==i?void 0:i.ignore)?void 0:null!==(e=null==i?void 0:i.group)&&void 0!==e?e:this.identityGroup,(null==i?void 0:i.ignore)?void 0:null!==(o=null==i?void 0:i.token)&&void 0!==o?o:this.identityToken);return this.identityGroup=s.group||void 0,this.identityToken=s.token||void 0,[new n(a(s,"token")),this.identityToken]}async logoutIdentity(t){var i,e;await r(this.token,"POST","/identities/logout",void 0,void 0,(null==t?void 0:t.ignore)?void 0:null!==(i=null==t?void 0:t.group)&&void 0!==i?i:this.identityGroup,(null==t?void 0:t.ignore)?void 0:null!==(e=null==t?void 0:t.token)&&void 0!==e?e:this.identityToken),this.identityGroup=void 0,this.identityToken=void 0}async fetchSelfIdentity(t){var i,e;return new n(await r(this.token,"GET","/identities/self",void 0,void 0,(null==t?void 0:t.ignore)?void 0:null!==(i=null==t?void 0:t.group)&&void 0!==i?i:this.identityGroup,(null==t?void 0:t.ignore)?void 0:null!==(e=null==t?void 0:t.token)&&void 0!==e?e:this.identityToken))}async updateSelfIdentity(t,i){var e,o;return new n(await r(this.token,"PUT","/identities/self",void 0,t,(null==i?void 0:i.ignore)?void 0:null!==(e=null==i?void 0:i.group)&&void 0!==e?e:this.identityGroup,(null==i?void 0:i.ignore)?void 0:null!==(o=null==i?void 0:i.token)&&void 0!==o?o:this.identityToken))}async deleteSelfIdentity(t){var i,e;await r(this.token,"DELETE","/identities/self",void 0,void 0,(null==t?void 0:t.ignore)?void 0:null!==(i=null==t?void 0:t.group)&&void 0!==i?i:this.identityGroup,(null==t?void 0:t.ignore)?void 0:null!==(e=null==t?void 0:t.token)&&void 0!==e?e:this.identityToken)}},Object.defineProperty(t,"__esModule",{value:!0})}));
