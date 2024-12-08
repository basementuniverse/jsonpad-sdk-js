!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).JSONPad={})}(this,(function(t){"use strict";class e{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt),lastActiveAt:t.lastActiveAt?new Date(t.lastActiveAt):null})}}class i{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt),user:new e(t.user)})}}class n{constructor(t){this.lastLoginAt=null,Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt),user:new e(t.user),lastLoginAt:t.lastLoginAt?new Date(t.lastLoginAt):null})}}class s{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt)})}}class a{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt)})}}class o{constructor(t){Object.assign(this,{...t,createdAt:new Date(t.createdAt),updatedAt:new Date(t.updatedAt),user:new e(t.user)})}}function d(t,...e){return Object.fromEntries(Object.entries(t).filter((([t])=>!e.includes(t))))}const r="x-api-token";async function l(t,e,i,n,s,a,o){const d=n?new URLSearchParams({...Object.fromEntries(Object.entries(n).map((([t,e])=>[t,e.toString()])))}):"",l={[r]:t,"Content-Type":"application/json"};a&&(l["x-identity-group"]=a),o&&(l["x-identity-token"]=o);const u=await fetch(`https://api.jsonpad.io${i}?${d}`,{method:e,headers:l,body:s?JSON.stringify(s):void 0});if(!u.ok)throw new Error(await u.text());return await u.json()}t.Event=i,t.Index=s,t.Item=a,t.List=o,t.User=e,t.default=class{constructor(t){this.token=t}async createList(t){return new o(await l(this.token,"POST","/lists",void 0,t))}async fetchLists(t){return(await l(this.token,"GET","/lists",t)).data.map((t=>new o(t)))}async fetchList(t){return new o(await l(this.token,"GET",`/lists/${t}`))}async searchList(t,e,i){return(await l(this.token,"GET",`/lists/${t}/search`,{query:e,...i})).map((t=>"item"in t?{relevance:t.relevance,item:new a(t.item)}:t))}async fetchListStats(t,e){return await l(this.token,"GET",`/lists/${t}/stats`,e)}async fetchListEvents(t,e){return(await l(this.token,"GET",`/lists/${t}/events`,e)).data.map((t=>new i(t)))}async fetchListEvent(t,e){return new i(await l(this.token,"GET",`/lists/${t}/events/${e}`))}async updateList(t,e){return new o(await l(this.token,"PUT",`/lists/${t}`,void 0,e))}async deleteList(t){await l(this.token,"DELETE",`/lists/${t}`)}async createItem(t,e,i,n){var s,o;return new a(await l(this.token,"POST",`/lists/${t}/items`,i,e,null!==(s=null==n?void 0:n.group)&&void 0!==s?s:this.identityGroup,null!==(o=null==n?void 0:n.token)&&void 0!==o?o:this.identityToken))}async fetchItems(t,e,i){var n,s;return(await l(this.token,"GET",`/lists/${t}/items`,e,void 0,null!==(n=null==i?void 0:i.group)&&void 0!==n?n:this.identityGroup,null!==(s=null==i?void 0:i.token)&&void 0!==s?s:this.identityToken)).data.map((t=>new a(t)))}async fetchItemsData(t,e,i){var n,s;const a=e.pointer?`/${e.pointer}`:"";return(await l(this.token,"GET",`/lists/${t}/items/data${a}`,d(e,"pointer"),void 0,null!==(n=null==i?void 0:i.group)&&void 0!==n?n:this.identityGroup,null!==(s=null==i?void 0:i.token)&&void 0!==s?s:this.identityToken)).data}async fetchItem(t,e,i,n){var s,o;return new a(await l(this.token,"GET",`/lists/${t}/items/${e}`,i,void 0,null!==(s=null==n?void 0:n.group)&&void 0!==s?s:this.identityGroup,null!==(o=null==n?void 0:n.token)&&void 0!==o?o:this.identityToken))}async fetchItemData(t,e,i,n){var s,a;const o=i.pointer?`/${i.pointer}`:"";return await l(this.token,"GET",`/lists/${t}/items/${e}/data${o}`,d(i,"pointer"),void 0,null!==(s=null==n?void 0:n.group)&&void 0!==s?s:this.identityGroup,null!==(a=null==n?void 0:n.token)&&void 0!==a?a:this.identityToken)}async fetchItemStats(t,e,i){return await l(this.token,"GET",`/lists/${t}/items/${e}/stats`,i)}async fetchItemEvents(t,e,n){return(await l(this.token,"GET",`/lists/${t}/items/${e}/events`,n)).data.map((t=>new i(t)))}async fetchItemEvent(t,e,n){return new i(await l(this.token,"GET",`/lists/${t}/items/${e}/events/${n}`))}async updateItem(t,e,i,n){var s,o;return new a(await l(this.token,"PUT",`/lists/${t}/items/${e}`,void 0,i,null!==(s=null==n?void 0:n.group)&&void 0!==s?s:this.identityGroup,null!==(o=null==n?void 0:n.token)&&void 0!==o?o:this.identityToken))}async updateItemData(t,e,i,n,s){var o,d;const r=n.pointer?`/${n.pointer}`:"";return new a(await l(this.token,"POST",`/lists/${t}/items/${e}/data${r}`,void 0,i,null!==(o=null==s?void 0:s.group)&&void 0!==o?o:this.identityGroup,null!==(d=null==s?void 0:s.token)&&void 0!==d?d:this.identityToken))}async replaceItemData(t,e,i,n,s){var o,d;const r=n.pointer?`/${n.pointer}`:"";return new a(await l(this.token,"PUT",`/lists/${t}/items/${e}/data${r}`,void 0,i,null!==(o=null==s?void 0:s.group)&&void 0!==o?o:this.identityGroup,null!==(d=null==s?void 0:s.token)&&void 0!==d?d:this.identityToken))}async patchItemData(t,e,i,n,s){var o,d;const r=n.pointer?`/${n.pointer}`:"";return new a(await l(this.token,"PATCH",`/lists/${t}/items/${e}/data${r}`,void 0,i,null!==(o=null==s?void 0:s.group)&&void 0!==o?o:this.identityGroup,null!==(d=null==s?void 0:s.token)&&void 0!==d?d:this.identityToken))}async deleteItem(t,e,i){var n,s;await l(this.token,"DELETE",`/lists/${t}/items/${e}`,void 0,void 0,null!==(n=null==i?void 0:i.group)&&void 0!==n?n:this.identityGroup,null!==(s=null==i?void 0:i.token)&&void 0!==s?s:this.identityToken)}async deleteItemData(t,e,i,n){var s,o;const d=i.pointer?`/${i.pointer}`:"";return new a(await l(this.token,"DELETE",`/lists/${t}/items/${e}/data${d}`,void 0,void 0,null!==(s=null==n?void 0:n.group)&&void 0!==s?s:this.identityGroup,null!==(o=null==n?void 0:n.token)&&void 0!==o?o:this.identityToken))}async createIndex(t,e){return new s(await l(this.token,"POST",`/lists/${t}/indexes`,void 0,e))}async fetchIndexes(t,e){return(await l(this.token,"GET",`/lists/${t}/indexes`,e)).data.map((t=>new s(t)))}async fetchIndex(t,e){return new s(await l(this.token,"GET",`/lists/${t}/indexes/${e}`))}async fetchIndexStats(t,e,i){return await l(this.token,"GET",`/lists/${t}/indexes/${e}/stats`,i)}async fetchIndexEvents(t,e,n){return(await l(this.token,"GET",`/lists/${t}/indexes/${e}/events`,n)).data.map((t=>new i(t)))}async fetchIndexEvent(t,e,n){return new i(await l(this.token,"GET",`/lists/${t}/indexes/${e}/events/${n}`))}async updateIndex(t,e,i){return new s(await l(this.token,"PATCH",`/lists/${t}/indexes/${e}`,void 0,i))}async deleteIndex(t,e){await l(this.token,"DELETE",`/lists/${t}/indexes/${e}`)}async createIdentity(t){return new n(await l(this.token,"POST","/identities",void 0,t))}async fetchIdentities(t){return(await l(this.token,"GET","/identities",t)).data.map((t=>new n(t)))}async fetchIdentity(t){return new n(await l(this.token,"GET",`/identities/${t}`))}async fetchIdentityStats(t,e){return await l(this.token,"GET",`/identities/${t}/stats`,e)}async fetchIdentityEvents(t,e){return(await l(this.token,"GET",`/identities/${t}/events`,e)).data.map((t=>new i(t)))}async fetchIdentityEvent(t,e){return new i(await l(this.token,"GET",`/identities/${t}/events/${e}`))}async updateIdentity(t,e){return new n(await l(this.token,"PUT",`/identities/${t}`,void 0,e))}async deleteIdentity(t){await l(this.token,"DELETE",`/identities/${t}`)}async registerIdentity(t,e){var i,s;return new n(await l(this.token,"POST","/identities/register",void 0,t,null!==(i=null==e?void 0:e.group)&&void 0!==i?i:this.identityGroup,null!==(s=null==e?void 0:e.token)&&void 0!==s?s:this.identityToken))}async loginIdentity(t,e){var i,s;const a=await l(this.token,"POST","/identities/login",void 0,t,null!==(i=null==e?void 0:e.group)&&void 0!==i?i:this.identityGroup,null!==(s=null==e?void 0:e.token)&&void 0!==s?s:this.identityToken);return this.identityGroup=a.group||void 0,this.identityToken=a.token||void 0,new n(d(a,"token"))}async logoutIdentity(t){var e,i;await l(this.token,"POST","/identities/logout",void 0,void 0,null!==(e=null==t?void 0:t.group)&&void 0!==e?e:this.identityGroup,null!==(i=null==t?void 0:t.token)&&void 0!==i?i:this.identityToken),this.identityGroup=void 0,this.identityToken=void 0}async fetchSelfIdentity(t){var e,i;return new n(await l(this.token,"GET","/identities/self",void 0,void 0,null!==(e=null==t?void 0:t.group)&&void 0!==e?e:this.identityGroup,null!==(i=null==t?void 0:t.token)&&void 0!==i?i:this.identityToken))}async updateSelfIdentity(t,e){var i,s;return new n(await l(this.token,"PUT","/identities/self",void 0,t,null!==(i=null==e?void 0:e.group)&&void 0!==i?i:this.identityGroup,null!==(s=null==e?void 0:e.token)&&void 0!==s?s:this.identityToken))}async deleteSelfIdentity(t){var e,i;await l(this.token,"DELETE","/identities/self",void 0,void 0,null!==(e=null==t?void 0:t.group)&&void 0!==e?e:this.identityGroup,null!==(i=null==t?void 0:t.token)&&void 0!==i?i:this.identityToken)}},Object.defineProperty(t,"__esModule",{value:!0})}));
