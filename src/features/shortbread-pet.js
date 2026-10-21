(()=>{
if(customElements.get('shortbread-pet'))return;
class ShortbreadPet extends HTMLElement{
 connectedCallback(){
  if(this.resume){this.resume();return}
  const root=this.attachShadow({mode:'open'});
  root.innerHTML=`
  <style>
  :host{display:block;width:100%;max-width:380px;color:#81735f;color-scheme:light}
  *{box-sizing:border-box}
  canvas{display:block;width:100%;aspect-ratio:1.18;background:transparent;cursor:grab;touch-action:pan-y;outline:none}
  canvas:active{cursor:grabbing}
  canvas:focus-visible{outline:1px solid #b9ac94;outline-offset:-7px;border-radius:20px}
  .panel{display:flex;gap:6px;justify-content:center;padding:0 8px 8px;max-height:65px;overflow:hidden;opacity:1;transform:translateY(0);transition:opacity .55s ease,transform .55s ease,max-height .55s ease,padding .55s ease}
  .panel[data-used]{opacity:0;transform:translateY(5px);max-height:0;padding-block:0;pointer-events:none}
  button{appearance:none;display:flex;align-items:center;justify-content:center;gap:6px;min-height:38px;flex:1;max-width:118px;padding:9px 7px;border:1px solid #9b8b682b;border-radius:12px;background:#e9e1d54d;color:#81735f;font:500 11px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;white-space:nowrap;transition:background .18s,transform .18s}
  button:hover:not(:disabled){background:#e3dacb88;transform:translateY(-1px)}
  button:active:not(:disabled){transform:translateY(1px)}
  button:focus-visible{outline:2px solid #b6a387;outline-offset:-3px}
  button:disabled{cursor:default}
  svg{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
  .sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  @media(prefers-reduced-motion:reduce){button,.panel{transition:none}}
  </style>
  <canvas tabindex="0" role="img" aria-label="Shortbread, a 3D biscuit-coloured bear. Drag or use arrow keys to turn slightly."></canvas>
  <div class="panel" role="group" aria-label="Choose a daily action">
   <button data-action="treat">
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 8.5a3 3 0 0 1-4-4 7 7 0 1 0 4 4Z"/><path d="M7 6h.01M6 12h.01M11 13h.01M10 9h.01" stroke-width="2.4"/></svg>Give a treat
   </button>
   <button data-action="study">
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 5v11M10 5C7 3 4 3 2 4v11c3-1 5-1 8 1 3-2 5-2 8-1V4c-2-1-5-1-8 1Z"/></svg>Study time
   </button>
   <button data-action="pet">
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 10V5a1.3 1.3 0 0 1 2.6 0v4-6a1.3 1.3 0 0 1 2.6 0v6-5a1.3 1.3 0 0 1 2.6 0v6-3a1.3 1.3 0 0 1 2.6 0v5c0 4-2 6-5 6-2 0-3-1-4-2l-4-4c-1-1 0-3 1-2l2 1Z"/></svg>Pet on head
   </button>
  </div>
  <span class="sr" role="status" aria-live="polite"></span>`;
  const canvas=root.querySelector('canvas'),panel=root.querySelector('.panel'),buttons=[...root.querySelectorAll('button')],status=root.querySelector('[role=status]');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
  if(!gl){status.textContent='WebGL is needed to display the pet.';buttons.forEach(b=>b.disabled=true);return}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
  const C=h=>h.replace('#','').match(/../g).map(v=>parseInt(v,16)/255);
  const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  function mul(a,b){const r=Array(16).fill(0);for(let c=0;c<4;c++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)r[c*4+j]+=a[k*4+j]*b[c*4+k];return r}
  const M=(...ms)=>ms.reduce(mul,I());
  function T(x=0,y=0,z=0){const m=I();m[12]=x;m[13]=y;m[14]=z;return m}
  const S=(x=1,y=x,z=x)=>[x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];
  function RY(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]}
  function RZ(a){const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]}
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n)};
  function view(e,t){const z=norm(e.map((v,i)=>v-t[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1]}
  function ortho(l,r,b,t,n,f){return[2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]}
  const vertex=`
  attribute vec3 aP,aN;attribute vec4 aC;
  uniform mat4 uM,uVP;varying vec3 vN;varying vec4 vC;
  void main(){gl_Position=uVP*uM*vec4(aP,1.);vN=mat3(uM)*aN;vC=aC;}`;
  const fragment=`
  precision mediump float;varying vec3 vN;varying vec4 vC;uniform float uAlpha;
  void main(){vec3 n=normalize(vN);float l=.74+.23*max(dot(n,normalize(vec3(-.5,1.,.7))),0.)+.04*max(dot(n,normalize(vec3(.8,.4,-.4))),0.);gl_FragColor=vec4(vC.rgb*l,vC.a*uAlpha);}`;
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const attrs=['aP','aN','aC'].map(n=>gl.getAttribLocation(program,n));
  const uM=gl.getUniformLocation(program,'uM'),uVP=gl.getUniformLocation(program,'uVP'),uAlpha=gl.getUniformLocation(program,'uAlpha');
  function mesh(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return{buffer:b,count:data.length/10}}
  function quad(d,p,n,c){for(const j of [0,1,2,0,2,3])d.push(...p[j],...n,...c,1)}
  const faces=[
   {n:[1,0,0],v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]},
   {n:[-1,0,0],v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]]},
   {n:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},
   {n:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]},
   {n:[0,0,1],v:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]]},
   {n:[0,0,-1],v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]}
  ];
  function hash(i,j,k){let h=Math.imul(i+371,374761393)^Math.imul(j+491,668265263)^Math.imul(k+739,1274126177);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295}
  function voxel(rx,ry,rz,c,step=.08,power=2.6,variation=.022){
   const d=[],nx=Math.ceil(rx/step),ny=Math.ceil(ry/step),nz=Math.ceil(rz/step);
   const inside=(i,j,k)=>Math.abs((i+.5)*step/rx)**power+Math.abs((j+.5)*step/ry)**power+Math.abs((k+.5)*step/rz)**power<=1;
   for(let i=-nx;i<nx;i++)for(let j=-ny;j<ny;j++)for(let k=-nz;k<nz;k++){
    if(!inside(i,j,k))continue;
    const h=hash(Math.floor(i/2),Math.floor(j/2),Math.floor(k/2)),shade=h>.79?variation:h<.14?-variation*.6:0,col=c.map(v=>clamp(v+shade));
    for(const f of faces)if(!inside(i+f.n[0],j+f.n[1],k+f.n[2]))quad(d,f.v.map(v=>[(i+v[0])*step,(j+v[1])*step,(k+v[2])*step]),f.n,col);
   }
   return mesh(d);
  }
  function cube(x,y,z,c){const d=[];for(const f of faces)quad(d,f.v.map(v=>[(v[0]-.5)*x,(v[1]-.5)*y,(v[2]-.5)*z]),f.n,c);return mesh(d)}
  const fur=C('#dec4a2'),headFur=C('#e6ceae'),cream=C('#f6ead5'),dark=C('#4f4233');
  const g={
   body:voxel(.91,.49,.48,fur),
   head:voxel(.67,.62,.59,headFur,.075,2.7),
   ear:voxel(.275,.305,.225,headFur,.06,2.5),
   inner:voxel(.075,.18,.14,C('#b39777'),.045),
   muzzle:voxel(.23,.225,.30,cream,.05,2.7,.01),
   nose:cube(.075,.095,.125,dark),
   eye:cube(.065,.165,.105,dark),
   glint:cube(.07,.04,.035,C('#fff8ed')),
   cheek:voxel(.045,.09,.13,C('#dfb79b'),.04,3,0),
   leg:voxel(.22,.245,.22,fur,.065,3.2),
   foot:voxel(.24,.12,.235,cream,.05,3),
   tail:voxel(.23,.225,.23,fur,.06,2.4),
   chest:voxel(.085,.25,.29,cream,.055,2.7),
   biscuit:voxel(.09,.21,.21,C('#c3a06b'),.045,2.5),
   chip:cube(.035,.04,.04,C('#977448')),
   crumb:cube(.04,.04,.04,C('#c7a578')),
   cover:cube(.48,.055,.36,C('#91977b')),
   pages:cube(.44,.055,.325,C('#f2e8d3')),
   line:cube(.31,.008,.012,C('#c3b79d')),
   turningPage:cube(.44,.014,.32,C('#f4ebd8')),
   palm:voxel(.25,.085,.20,C('#e3d3b9'),.045,3,0),
   finger:voxel(.19,.055,.052,C('#e3d3b9'),.035,3,0),
   thumb:voxel(.12,.06,.065,C('#e3d3b9'),.035,3,0)
  };
  {
   const rows=['0110110','1111111','1111111','0111110','0011100','0001000'],d=[],s=.05;
   rows.forEach((row,y)=>{for(let x=0;x<7;x++)if(row[x]==='1')for(const f of faces)quad(d,f.v.map(v=>[(x-3.5+v[0])*s,(5-y+v[1])*s,v[2]*s]),f.n,C('#bc9d80'))});
   g.heart=mesh(d);
  }
  function draw(m,transform,alpha=1){
   if(alpha<=0)return;
   gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);
   [3,3,4].forEach((s,i)=>{gl.enableVertexAttribArray(attrs[i]);gl.vertexAttribPointer(attrs[i],s,gl.FLOAT,false,40,[0,12,24][i])});
   gl.uniformMatrix4fv(uM,false,new Float32Array(transform));gl.uniform1f(uAlpha,alpha);gl.drawArrays(gl.TRIANGLES,0,m.count);
  }
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);

  const cooldown=24*60*60*1000;
  const storageKey=this.getAttribute('storage-key')||'shortbread-daily-action';
  const limited=()=>this.getAttribute('daily-limit')!=='off';
  let record=null,action=null,actionStart=0;
  function readRecord(){
   try{
    const v=JSON.parse(localStorage.getItem(storageKey));
    record=v&&['treat','study','pet'].includes(v.action)&&Number.isFinite(v.at)?v:null;
   }catch{}
  }
  function refresh(){
   const locked=limited()&&record&&Date.now()<record.at+cooldown;
   const hide=!!action||!!locked;
   panel.toggleAttribute('data-used',hide);
   panel.inert=hide;
   panel.setAttribute('aria-hidden',String(hide));
   buttons.forEach(b=>b.disabled=hide);
  }
  readRecord();refresh();
  const startAction=name=>{
   readRecord();
   if(action||(limited()&&record&&Date.now()<record.at+cooldown)){refresh();return}
   action=name;actionStart=performance.now();
   record={action:name,at:Date.now()};
   if(limited())try{localStorage.setItem(storageKey,JSON.stringify(record))}catch{}
   canvas.focus({preventScroll:true});
   refresh();
   status.textContent={treat:'Shortbread is enjoying a biscuit.',study:'Shortbread is reading a little book.',pet:'Shortbread is enjoying a gentle head pat.'}[name];
   this.dispatchEvent(new CustomEvent('pet-action',{bubbles:true,composed:true,detail:{action:name,at:record.at,nextAvailableAt:limited()?record.at+cooldown:null}}));
  };
  buttons.forEach(b=>b.addEventListener('click',()=>startAction(b.dataset.action)));
  const onStorage=e=>{if(e.key===storageKey||e.key===null){readRecord();refresh()}};
  let yaw=-.16,targetYaw=-.16,pitch=0,targetPitch=0,hover=0,hoverTo=0,px=0;
  let drag=null,last=performance.now(),raf,interval,running=false;
  canvas.onpointermove=e=>{
   const r=canvas.getBoundingClientRect();px=clamp((e.clientX-r.left)/r.width*2-1,-1,1);hoverTo=1;
   if(drag){targetYaw=clamp(drag.yaw+(e.clientX-drag.x)*.007,-.78,.58);targetPitch=clamp(drag.pitch+(e.clientY-drag.y)*.004,-.1,.2)}
  };
  canvas.onpointerleave=()=>{hoverTo=0;px=0};
  canvas.onpointerdown=e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch};canvas.setPointerCapture(e.pointerId)};
  canvas.onpointerup=e=>{drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)};
  canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null;hoverTo=0};
  canvas.onkeydown=e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
   e.preventDefault();
   if(e.key==='ArrowLeft')targetYaw=clamp(targetYaw-.12,-.78,.58);
   if(e.key==='ArrowRight')targetYaw=clamp(targetYaw+.12,-.78,.58);
   if(e.key==='ArrowUp')targetPitch=clamp(targetPitch-.04,-.1,.2);
   if(e.key==='ArrowDown')targetPitch=clamp(targetPitch+.04,-.1,.2);
   if(e.key==='Home'){targetYaw=-.16;targetPitch=0}
  };
  const render=now=>{
   if(!running)return;
   const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
   const w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
   const dt=Math.min((now-last)/1000,.05);last=now;const k=1-Math.exp(-dt*8);
   yaw+=(targetYaw-yaw)*k;pitch+=(targetPitch-pitch)*k;hover+=(hoverTo-hover)*k;
   const t=now/1000,motion=reduced?0:1,extent=1.48,aspect=w/h;
   gl.uniformMatrix4fv(uVP,false,new Float32Array(mul(ortho(-extent*aspect,extent*aspect,-extent,extent,4,12),view([4,3.1+pitch*4.5,6.5],[.07,1.24,0]))));
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   let happy=false,chew=0,tilt=0,stretch=1,heart=0,heartY=0;
   let cookieAlpha=0,cookieScale=1,cookieX=0,cookieY=0,crumb=0;
   let bookAlpha=0,bookScale=1,pageTurn=0,handAlpha=0,handX=0,handY=0,handAngle=0;
   if(action){
    const s=(now-actionStart)/1000;
    const duration=action==='study'?6:action==='pet'?4.2:4.4;
    if(action==='treat'){
     if(s<1){const p=ease(s);cookieAlpha=1;cookieX=1.9-.51*p;cookieY=1.15+.31*p+Math.sin(p*Math.PI)*.17;tilt=motion*p*.025}
     else if(s<2.9){const p=(s-1)/1.9;happy=true;chew=motion*Math.sin(p*Math.PI*12)*.016;cookieX=1.39;cookieY=1.46+chew;cookieScale=1-p*.78;cookieAlpha=1-ease((p-.5)/.5);crumb=Math.sin(p*Math.PI);tilt=chew}
     else{const p=clamp((s-2.9)/1.5);happy=true;heart=Math.sin(p*Math.PI);heartY=p*.25}
    }
    if(action==='study'){
     const enter=ease(s/.6),exit=1-ease((s-5.1)/.9);
     bookAlpha=enter*exit;bookScale=.85+.15*enter;
     tilt=-.18*enter*exit+motion*Math.sin(s*3.2)*.018*exit;
     pageTurn=Math.sin(clamp((s-2.1)/1.05)*Math.PI);
     if(s>4.7){const p=clamp((s-4.7)/1.3);happy=true;heart=Math.sin(p*Math.PI);heartY=p*.2}
    }
    if(action==='pet'){
     const enter=ease(s/.65),exit=1-ease((s-3.25)/.65),p=Math.max(0,s-.65);
     handAlpha=enter*exit;
     handX=.48+motion*Math.sin(p*5)*.13;
     handY=2.20+(1-enter)*.30+(1-exit)*.25+motion*Math.cos(p*5)*.025;
     handAngle=motion*Math.sin(p*5)*.05;
     happy=s>.45;
     stretch=1-motion*.025*enter*exit*(.5+.5*Math.cos(p*5));
     tilt=motion*Math.sin(p*5)*.025*enter*exit;
     if(s>1.7){const q=clamp((s-1.7)/2.5);heart=Math.sin(q*Math.PI);heartY=q*.2}
    }
    if(s>=duration){
     const completed=action;action=null;refresh();status.textContent='Animation complete.';
     this.dispatchEvent(new CustomEvent('pet-action-complete',{bubbles:true,composed:true,detail:{action:completed}}));
    }
   }
   const base=M(RY(yaw+motion*hover*px*.04),S(1,stretch+motion*Math.sin(t*1.8)*.005,1));
   const head=M(base,T(.55,1.52,0),RZ(tilt-motion*hover*.012),RY(motion*hover*px*.02));
   const part=(name,m,alpha=1)=>draw(g[name],mul(base,m),alpha);
   part('tail',M(T(-1.20,.94,0),RZ(motion*Math.sin(t*(happy?7:2))*(happy?.1:.025))));
   part('body',T(-.36,.73,0));part('chest',T(.48,.74,0));
   for(const x of [-.76,.35])for(const z of [-.35,.35]){
    const leg=T(x,.35,z);part('leg',leg);part('foot',mul(leg,T(.02,-.23,0)));
   }
   // The head sits a hair back in depth, and the muzzle half as far, so where
   // they touch the muzzle always wins, and the eyes, cheeks and nose win over
   // both, instead of flickering (cca-prep, 21 October 2026).
   gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(3,8);
   draw(g.head,head);gl.disable(gl.POLYGON_OFFSET_FILL);
   for(const z of [-.42,.42]){
    const ear=M(head,T(-.065,.54,z));draw(g.ear,ear);draw(g.inner,mul(ear,T(.22,0,0)));
   }
   const muzzle=M(head,T(.60,-.13,0),S(1,1+chew*2,1));
   gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,4);draw(g.muzzle,muzzle);gl.disable(gl.POLYGON_OFFSET_FILL);draw(g.nose,mul(muzzle,T(.23,.075,0)));
   const blink=!reduced&&Math.sin(t*1.23)>.996;
   for(const z of [-.39,.39]){
    const eye=M(head,T(.545,.07,z),S(1,happy?.22:blink?.08:1,1));
    draw(g.eye,eye);
    if(!happy&&!blink)draw(g.glint,mul(eye,T(.003,.04,z>0?.012:-.012)));
    draw(g.cheek,M(head,T(.53,-.105,z*1.12)));
   }
   if(cookieAlpha>0){
    const cm=M(base,T(cookieX,cookieY,0),RY(.15),S(cookieScale));
    draw(g.biscuit,cm,cookieAlpha);
    for(const p of [[.09,.075,.065],[.09,-.08,.07],[.09,.025,-.09],[.09,-.12,-.055]])draw(g.chip,mul(cm,T(...p)),cookieAlpha);
   }
   if(crumb>0)for(let i=0;i<3;i++){
    const p=((now-actionStart)/1000*1.8+i*.29)%1;
    draw(g.crumb,M(base,T(1.38+i*.03,1.39-p*.45,(i-1)*.10),RZ(p*4)),crumb*(1-p));
   }
   if(bookAlpha>0){
    const book=M(base,T(1.20,.30,.05),RY(Math.PI/2),S(bookScale));
    for(const side of [-1,1]){
     const half=M(book,T(side*.235,0,0),RZ(side*.11));
     draw(g.cover,half,bookAlpha);draw(g.pages,mul(half,T(0,.052,0)),bookAlpha);
     for(let j=0;j<4;j++)draw(g.line,mul(half,T(0,.083,-.105+j*.063)),bookAlpha);
    }
    draw(g.turningPage,M(book,T(0,.09,0),RZ(pageTurn*Math.PI),T(.22,0,0)),bookAlpha);
   }
   if(handAlpha>0){
    const hand=M(base,T(handX,handY,0),RZ(handAngle));
    draw(g.palm,hand,handAlpha);
    for(let i=0;i<4;i++)draw(g.finger,mul(hand,T(.22,-.005,(i-1.5)*.094)),handAlpha);
    draw(g.thumb,M(hand,T(-.06,-.015,.22),RY(-.35)),handAlpha);
   }
   if(heart>0){
    gl.depthMask(false);
    draw(g.heart,M(base,T(-.12,2.30+heartY,.1),RY(.5),S(.65)),heart);
    gl.depthMask(true);
   }
   raf=requestAnimationFrame(render);
  };
  this.resume=()=>{
   if(running)return;
   running=true;last=performance.now();readRecord();refresh();
   window.addEventListener('storage',onStorage);
   interval=setInterval(refresh,1000);
   raf=requestAnimationFrame(render);
  };
  this.pause=()=>{
   running=false;cancelAnimationFrame(raf);clearInterval(interval);
   window.removeEventListener('storage',onStorage);
  };
  this.resume();
 }
 disconnectedCallback(){this.pause?.()}
}
customElements.define('shortbread-pet',ShortbreadPet);
})();
