
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/SmileGest/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "redirectTo": "/SmileGest/inicio",
    "route": "/SmileGest"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-QWAT5DI5.js",
      "chunk-YJIBM2LF.js",
      "chunk-4OLG6RPQ.js",
      "chunk-AYN2OAEG.js",
      "chunk-KU5NV46G.js"
    ],
    "route": "/SmileGest/inicio"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-7JSQMWKA.js",
      "chunk-L4SYHPID.js",
      "chunk-4OLG6RPQ.js",
      "chunk-AYN2OAEG.js",
      "chunk-KU5NV46G.js"
    ],
    "route": "/SmileGest/register"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-TYKFTHZ5.js",
      "chunk-YJIBM2LF.js",
      "chunk-4OLG6RPQ.js",
      "chunk-AYN2OAEG.js",
      "chunk-KU5NV46G.js"
    ],
    "route": "/SmileGest/calendario"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-4OKT4UAI.js",
      "chunk-L4SYHPID.js",
      "chunk-4OLG6RPQ.js",
      "chunk-AYN2OAEG.js",
      "chunk-KU5NV46G.js"
    ],
    "route": "/SmileGest/login"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-MAAK36CG.js",
      "chunk-KU5NV46G.js"
    ],
    "route": "/SmileGest/usuarios"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-QLRBLAQY.js",
      "chunk-AYN2OAEG.js",
      "chunk-KU5NV46G.js"
    ],
    "route": "/SmileGest/usuarios/*"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23866, hash: '97e2b8dd27325527201799fb675b23a071c6e5025f30183ce7378ad7cbe67988', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17301, hash: '5fb375adedebf1535c0ddc03d65e329376073a33974ec01b46613176174882fd', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-WMR2L4YM.css': {size: 7118, hash: 'BeeY5TKILSY', text: () => import('./assets-chunks/styles-WMR2L4YM_css.mjs').then(m => m.default)}
  },
};
