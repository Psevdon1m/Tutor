if(!self.define){let e,t={};const n=(n,i)=>(n=new URL(n+".js",i).href,t[n]||new Promise((t=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=t,document.head.appendChild(e)}else e=n,importScripts(n),t()})).then((()=>{let e=t[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,s)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(t[o])return;let r={};const f=e=>n(e,o),u={module:{uri:o},exports:r,require:f};t[o]=Promise.all(i.map((e=>u[e]||f(e)))).then((e=>(s(...e),r)))}}define(["./workbox-5ffe50d4"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"_nuxt/builds/latest.json",revision:"00926b24f0b742723a40c038ffd1077f"},{url:"_nuxt/builds/meta/0d22d63b-d981-4299-81bb-be4e91e024a6.json",revision:null},{url:"manifest.webmanifest",revision:"5eef4867a7031ae34b5eb3ebf7f225f3"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("/Tutor/")))}));
