/* Roulettes · Mini rampe battle.
   Each rider waits on their deck (J1 left, J2 right), then gets a 1 minute run: a trick on every wall, best score wins.
   Solo, duo on one screen, or duo online (PeerJS, like Skate Cat Run). Riders are drawn with RL.draw from index.html. */
(function(){
  var cv=document.getElementById('ramp-canvas');if(!cv)return;
  var ctx=cv.getContext('2d'),bestEl=document.getElementById('ramp-best'),panel=document.getElementById('ramp-online'),msgEl=document.getElementById('ramp-msg');
  var selEl=[document.getElementById('ramp-p1'),document.getElementById('ramp-p2')],lab2=document.getElementById('ramp-l2');
  var PHONE=matchMedia('(hover:none) and (pointer:coarse)').matches||window.innerWidth<600;
  var W=900,H=440,dpr=Math.min(window.devicePixelRatio||1,2);cv.width=W*dpr;cv.height=H*dpr;cv.style.aspectRatio=W+'/'+H;ctx.scale(dpr,dpr);
  var C={night:'#150d2e',night2:'#1f1442',cyan:'#3ddcf0',pink:'#ff4fa8',yellow:'#ffe14d',cream:'#fbf4e6',grey:'#b9b3cc'};
  // ramp geometry: flat bottom, two quarter pipes, a deck on each side
  var RUN=60,GY=396,CX=W/2,F=150,RR=124,DECK=110,G=1300,VC=450,V0=Math.sqrt(VC*VC+2*G*RR),L=F+RR*Math.PI/2,SC=.92,AMAX=Math.PI/2*.8;
  var TR={ollie:{n:'Ollie',p:1,d:0},shove:{n:'Shove-it',p:3,d:.34},flip:{n:'Flip',p:5,d:.36},tre:{n:'3-6 Flip',p:10,d:.5}};
  var COL=[C.yellow,C.cyan];

  var best=0;try{best=+localStorage.getItem('rl-ramp-best')||0}catch(e){}
  function showBest(){bestEl.textContent=best?best+' pts':'–'}showBest();

  var MODE=1,state='select',turn=0,tm=RUN,cd=0,cdMsg='',t=0,last=0,pops=[],conf=[],winner=-1,visible=false;
  function mk(i){return{i:i,side:i?1:-1,s:0,dir:1,air:false,h:0,vy:0,tk:null,tt:0,q:null,qt:0,pts:0,bail:0,spin:0,deck:true}}
  var P=[mk(0),mk(1)],sel=[null,null],picked=[false,false];
  function name(i){return sel[i]?sel[i].name:'J'+(i+1)}

  // ---- riders: my own rider first, then the club's riders, then the village cast
  var PUB=[],LIST=[],cfg=(window.RL_FB||{}).config;
  function key(ch){return ch?ch.name+'|'+(ch.top||'')+'|'+(ch.hair||''):''}
  function buildList(){var l=[],seen={};function add(ch,tag){if(!ch||!ch.name||seen[key(ch)])return;seen[key(ch)]=1;l.push({ch:ch,tag:tag||''})}
    if(window.RL&&RL.me)add(RL.me,'mon rider');PUB.forEach(function(p){add(Object.assign({},p.ch,{name:p.name||p.ch.name}),p.crew)});
    (window.RL?RL.chars:[]).forEach(function(c){add(c,c.info||'')});return l}
  function fill(){LIST=buildList();if(!LIST.length)return;
    if(!picked[0]||!sel[0])sel[0]=(window.RL&&RL.me)||LIST[0].ch;
    if(!picked[1]||!sel[1]||key(sel[1])===key(sel[0]))sel[1]=(LIST.filter(function(o){return key(o.ch)!==key(sel[0])})[0]||LIST[0]).ch;
    selEl.forEach(function(el,i){el.innerHTML='';LIST.forEach(function(o,j){var op=document.createElement('option');op.value=j;op.textContent=o.ch.name+(o.tag?' · '+o.tag:'');if(key(o.ch)===key(sel[i]))op.selected=true;el.appendChild(op)})})}
  function dec(v){if(!v)return null;if('stringValue' in v)return v.stringValue;if('integerValue' in v)return+v.integerValue;if('doubleValue' in v)return v.doubleValue;if('booleanValue' in v)return v.booleanValue;
    if('mapValue' in v){var o={},f=v.mapValue.fields||{};for(var k in f)o[k]=dec(f[k]);return o}if('arrayValue' in v)return(v.arrayValue.values||[]).map(dec);return null}
  function loadPub(){if(!cfg||loadPub.done)return;loadPub.done=1;
    fetch('https://firestore.googleapis.com/v1/projects/'+cfg.projectId+'/databases/(default)/documents/publicRiders?pageSize=300&key='+cfg.apiKey).then(function(r){return r.json()}).then(function(d){
      PUB=(d.documents||[]).map(function(x){var o={},f=x.fields||{};for(var k in f)o[k]=dec(f[k]);return o}).filter(function(k){return k.ch&&k.ch.name}).sort(function(a,b){return String(a.name).localeCompare(String(b.name))});fill()}).catch(function(){})}
  selEl.forEach(function(el,i){el.addEventListener('change',function(){var o=LIST[+el.value];if(!o)return;sel[i]=o.ch;picked[i]=true;
    if(MODE>=2&&key(sel[1-i])===key(o.ch)){var other=LIST.filter(function(x){return key(x.ch)!==key(o.ch)})[0];if(other){sel[1-i]=other.ch;fill()}}
    if(MODE===3)sendPick();cv.focus({preventScroll:true})})});
  fill();

  // ---- sound (generated)
  var AC=null,muted=false;try{muted=localStorage.getItem('msc-mute')==='1'}catch(e){}
  function tone(f1,f2,dur,type,vol,delay){try{if(!AC){var A=window.AudioContext||window.webkitAudioContext;if(!A)return;AC=new A()}if(AC.state==='suspended')AC.resume();
    var t0=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f1,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);g.gain.setValueAtTime(vol||.15,t0);g.gain.exponentialRampToValueAtTime(.001,t0+dur);o.connect(g);g.connect(AC.destination);o.start(t0);o.stop(t0+dur+.03)}catch(e){}}
  var SFX={pop:function(){tone(170,55,.12,'sine',.4)},trick:function(){tone(520,980,.16,'triangle',.12)},land:function(){tone(120,48,.11,'sine',.35)},
    points:function(n){[523,659,784,1047].slice(0,n).forEach(function(f,i){tone(f,null,.12,'triangle',.13,.04+i*.06)})},miss:function(){tone(300,200,.18,'square',.05)},
    bail:function(){tone(320,65,.5,'sawtooth',.12)},tick:function(){tone(660,null,.08,'square',.06)},go:function(){[392,523,659].forEach(function(f,i){tone(f,null,.1,'square',.07,i*.08)})},
    win:function(){[523,659,784,1047,784,1047].forEach(function(f,i){tone(f,null,i===5?.6:.14,'square',.07,i*.13)})}};
  function sfx(n,a){if(MODE===3&&NET.role==='host'&&NET.conn)NET.ev.push(['sfx',n,a]);if(muted)return;try{SFX[n](a)}catch(e){}}
  function pop(i,txt,col){var p=P[i],q=pose(p);pops.push({txt:txt,x:q.x,y:Math.max(q.y-120,60),life:1.2,col:col||C.yellow});if(MODE===3&&NET.role==='host'&&NET.conn)NET.ev.push(['pop',i,txt,col||C.yellow])}

  // ---- the ramp and where a rider stands on it
  function hgt(s){var a=Math.abs(s)-F;return a<=0?0:RR*(1-Math.cos(Math.min(a/RR,Math.PI/2)))}
  function pose(p){var side=p.side,x,y,rot=0,face;
    if(p.deck)return{x:CX+side*(F+RR+DECK*.55),y:GY-RR,rot:0,flip:side>0};
    var s=p.s,sd=s>=0?1:-1,a=Math.min(Math.max(0,Math.abs(s)-F)/RR,Math.PI/2);
    if(p.bail>0)return{x:a>0?CX+sd*(F+RR*Math.sin(a)):CX+s,y:GY-hgt(s),rot:p.spin,flip:p.dir<0};
    if(p.air){var top=VC*VC/(2*G),f=Math.min(p.h/top,1),vis=AMAX*(1-f);face=p.vy>0?p.dir:-p.dir;
      return{x:CX+sd*(F+RR)-sd*(12+22*f),y:GY-RR-p.h,rot:p.vy>0?-vis:vis,flip:face<0}}
    x=a>0?CX+sd*(F+RR*Math.sin(a)):CX+s;y=GY-hgt(s);rot=(p.dir*sd>0?-1:1)*a*.8;
    return{x:x,y:y,rot:rot,flip:p.dir<0}}

  // ---- game flow
  function players(){return MODE===1?[P[0]]:P}
  function reset(){P.forEach(function(p){p.s=p.side*L;p.dir=-p.side;p.air=false;p.h=0;p.vy=0;p.tk=null;p.tt=0;p.q=null;p.pts=0;p.bail=0;p.spin=0;p.deck=true});pops=[];conf=[];winner=-1;tm=RUN}
  function start(){reset();begin(0,MODE===1?'À toi '+name(0)+' !':'J1 · '+name(0)+' drop !')}
  function begin(i,msg){turn=i;state='count';cd=3;cdMsg=msg;sfx('tick')}
  function dropIn(){var p=P[turn];state='run';tm=RUN;p.deck=false;p.s=p.side*L;p.dir=-p.side;p.air=false;p.h=0;sfx('go')}
  function endRun(){var p=P[turn];p.deck=true;p.air=false;p.bail=0;p.tk=null;
    if(MODE===1||turn===1){over();return}
    begin(1,'J2 · '+name(1)+' drop !');cd=4}
  function over(){state='over';sfx('win');
    if(MODE===1){winner=0;if(P[0].pts>best){best=P[0].pts;try{localStorage.setItem('rl-ramp-best',best)}catch(e){}showBest()}}
    else winner=P[0].pts>P[1].pts?0:P[1].pts>P[0].pts?1:-1;
    for(var i=0;i<140;i++)conf.push({x:W/2,y:120,vx:(Math.random()-.5)*700,vy:-Math.random()*520-80,r:Math.random()*4+2,c:[C.pink,C.cyan,C.yellow,'#7aa8ff'][i%4],a:Math.random()*6})}
  // a trick key: in the air it starts the trick, just before the coping it is kept for the take-off
  function act(i,k){
    if(MODE===3&&NET.role==='guest'){send({t:'in',k:k});return}
    if(state==='select'||state==='over'){if(MODE===3){NET.go[i]=true;tryStart();return}start();return}
    if(state!=='run'||i!==turn)return;
    var p=P[turn];if(p.bail>0||p.deck)return;
    if(p.air){if(!p.tk){p.tk=k;p.tt=0;sfx(k==='ollie'?'pop':'trick')}return}
    if(p.dir*p.s>0&&Math.abs(p.s)>L-90){p.q=k;p.qt=t}}
  function land(p){var i=p.i;
    if(!p.tk){pop(i,'Pas de figure',C.grey);sfx('miss');return}
    var tr=TR[p.tk];
    if(p.tt<tr.d){p.bail=1.3;p.spin=0;p.tk=null;pop(i,'BAIL !',C.pink);sfx('bail');return}
    p.pts+=tr.p;pop(i,tr.n+' +'+tr.p,COL[i]);sfx('land');sfx('points',Math.min(4,Math.ceil(tr.p/3)));p.tk=null}
  function step(p,dt){
    if(p.bail>0){p.bail-=dt;p.spin+=dt*7;p.s*=Math.max(0,1-dt*2.5);if(p.bail<=0){p.bail=0;p.spin=0;p.dir=p.s>0?-1:1;if(!p.dir)p.dir=1}return}
    if(p.air){p.vy-=G*dt;p.h+=p.vy*dt;if(p.tk)p.tt+=dt;if(p.h<=0&&p.vy<0){p.h=0;p.air=false;p.dir=-p.dir;land(p)}return}
    var v=Math.sqrt(Math.max(V0*V0-2*G*hgt(p.s),VC*VC*.25));p.s+=p.dir*v*dt;
    if(p.dir*p.s>=L){p.s=p.dir*L;p.air=true;p.vy=VC;p.h=0;p.tk=null;p.tt=0;sfx('pop');if(p.q&&t-p.qt<.4){p.tk=p.q;sfx(p.q==='ollie'?'pop':'trick')}p.q=null}}
  function update(dt){
    pops.forEach(function(q){q.life-=dt;q.y-=30*dt});pops=pops.filter(function(q){return q.life>0});
    conf.forEach(function(c){c.vy+=900*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.a+=dt*8});conf=conf.filter(function(c){return c.y<H+20});
    if(MODE===3&&NET.role==='guest')return;
    if(state==='count'){var before=Math.ceil(cd);cd-=dt;if(Math.ceil(cd)!==before&&cd>0)sfx('tick');if(cd<=0)dropIn();return}
    if(state!=='run')return;
    tm-=dt;step(P[turn],dt);if(tm<=0){tm=0;endRun()}}

  // ---- drawing
  var STARS=[];for(var i=0;i<50;i++)STARS.push([Math.random()*W,Math.random()*200,Math.random()*1.3+.4]);
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function txt(s,x,y,size,col,al,font){ctx.font=(font||size+'px Bungee, Impact, sans-serif');ctx.fillStyle=col;ctx.textAlign=al||'center';ctx.fillText(s,x,y);ctx.textAlign='left'}
  function profile(){var x0=CX-F-RR-DECK,x1=CX+F+RR+DECK;ctx.beginPath();ctx.moveTo(x0,GY-RR);ctx.lineTo(CX-F-RR,GY-RR);ctx.arc(CX-F,GY-RR,RR,Math.PI,Math.PI/2,true);ctx.lineTo(CX+F,GY);ctx.arc(CX+F,GY-RR,RR,Math.PI/2,0,true);ctx.lineTo(x1,GY-RR)}
  function scene(){
    var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#110a2c');g.addColorStop(.6,'#341c66');g.addColorStop(1,'#94407f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';STARS.forEach(function(s){ctx.globalAlpha=.4+.6*Math.abs(Math.sin(t*1.2+s[0]));ctx.fillRect(s[0],s[1],s[2],s[2])});ctx.globalAlpha=1;
    // the park fence and the rooftops behind
    ctx.fillStyle='#2a1858';for(var x=0;x<W;x+=70)ctx.fillRect(x,250-((x*7)%60),58,200);
    ctx.strokeStyle='rgba(185,179,204,.25)';ctx.lineWidth=2;for(var fx=0;fx<W;fx+=18){ctx.beginPath();ctx.moveTo(fx,270);ctx.lineTo(fx+18,330);ctx.moveTo(fx+18,270);ctx.lineTo(fx,330);ctx.stroke()}
    ctx.fillStyle='#3d335e';ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(0,GY,W,6);
    // side panel, then the riding surface and the copings
    var x0=CX-F-RR-DECK,x1=CX+F+RR+DECK;
    profile();ctx.lineTo(x1,GY+18);ctx.lineTo(x0,GY+18);ctx.closePath();ctx.fillStyle='#8a5530';ctx.fill();
    ctx.save();ctx.clip();ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=2;for(var k=x0;k<x1;k+=60){ctx.beginPath();ctx.moveTo(k,GY-RR-10);ctx.lineTo(k,GY+20);ctx.stroke()}
    ctx.globalAlpha=.9;txt('ROULETTES',CX,GY-34,30,C.pink);ctx.globalAlpha=1;ctx.restore();
    profile();ctx.strokeStyle='#e0b27a';ctx.lineWidth=7;ctx.stroke();
    ctx.fillStyle='#d6d0e6';[CX-F-RR,CX+F+RR].forEach(function(cx){ctx.beginPath();ctx.arc(cx,GY-RR-1,5,0,Math.PI*2);ctx.fill()});
    // deck rails
    ctx.strokeStyle='#14102a';ctx.lineWidth=3;[[x0,CX-F-RR],[CX+F+RR,x1]].forEach(function(d){var a=d[0]+8,b=d[1]-8,o=d[0]===x0?a:b;ctx.beginPath();ctx.moveTo(o,GY-RR);ctx.lineTo(o,GY-RR-46);ctx.lineTo(d[0]===x0?a+40:b-40,GY-RR-46);ctx.stroke()});
  }
  function drawP(p){if(!sel[p.i]||!window.RL)return;var q=pose(p),tp=p.tk&&TR[p.tk].d?p.tt/TR[p.tk].d:0;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(q.x,p.air?GY-RR+2:q.y+2,22,4,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(q.x,q.y);RL.draw(ctx,sel[p.i],0,0,SC,t,q.flip,q.rot,p.air?p.tk:null,tp);ctx.restore();
    if(MODE>=2||p.air&&p.tk&&p.tk!=='ollie'){var hy=q.y-(p.air?96:118)*SC*(sel[p.i].size||1);
      if(p.air&&p.tk&&p.tk!=='ollie')txt(TR[p.tk].n,q.x,hy-16,13,C.cyan);
      if(MODE>=2)txt('J'+(p.i+1)+(MODE===3&&p.i===me()?' · TOI':''),q.x,hy,12,COL[p.i])}}
  function hud(){
    var ps=players();ps.forEach(function(p,j){var w=230,x=j?W-w-14:14,on=(state==='run'||state==='count')&&turn===p.i;
      ctx.fillStyle=on?'rgba(21,13,46,.95)':'rgba(21,13,46,.7)';rr(x,12,w,48,12);ctx.fill();ctx.strokeStyle=on?COL[p.i]:'rgba(255,255,255,.15)';ctx.lineWidth=2;ctx.stroke();
      txt((MODE>=2?'J'+(p.i+1)+' · ':'')+name(p.i),x+14,32,'',C.cream,'left','700 14px Space Grotesk, sans-serif');txt(p.pts+' pts',x+14,52,16,COL[p.i],'left')});
    if(state==='run'||state==='count'){var s=Math.ceil(state==='run'?tm:RUN),m=Math.floor(s/60);
      ctx.fillStyle='rgba(21,13,46,.85)';rr(W/2-60,12,120,48,12);ctx.fill();txt(m+':'+('0'+s%60).slice(-2),W/2,47,26,state==='run'&&tm<10?C.pink:C.cream)}}
  function overlay(a,col,b,c){ctx.fillStyle='rgba(21,13,46,.72)';ctx.fillRect(0,0,W,H);txt(a,W/2,H/2-30,38,col);if(b)txt(b,W/2,H/2+10,'',C.cream,'center','700 17px Space Grotesk, sans-serif');if(c)txt(c,W/2,H/2+40,'',C.grey,'center','14px Space Grotesk, sans-serif')}
  function draw(){
    scene();
    var ps=players();ps.forEach(function(p){if(p.deck||p.i!==turn)drawP(p)});if(state==='run'||state==='count')drawP(P[turn]);
    pops.forEach(function(p){ctx.globalAlpha=Math.min(Math.max(p.life,0),1);txt(p.txt,p.x,p.y,16,p.col);ctx.globalAlpha=1});
    hud();
    var tap=PHONE?'Touche l’écran':'Espace';
    if(state==='select'){
      if(MODE===3&&!NET.conn)overlay('MINI RAMPE',C.yellow,'Appuie sur « Trouver un·e adversaire »','Chacun·e son run d’1 minute, une figure à chaque mur');
      else if(MODE===3)overlay('MINI RAMPE',C.yellow,NET.go[me()]?'En attente de l’adversaire…':tap+' quand tu es prêt·e','Tu es J'+(me()+1)+(me()?' · plateforme de droite':' · plateforme de gauche'));
      else overlay('MINI RAMPE',C.yellow,tap+' pour dropper',MODE===1?'1 minute pour placer un max de figures':'J1 roule d’abord, puis J2 · le plus de points gagne')}
    if(state==='count')overlay(String(Math.max(1,Math.ceil(cd))),COL[turn],cdMsg,PHONE?'Une figure en l’air à chaque mur':(MODE===2?(turn?'Flèches':'Z Q S D')+' · une figure en l’air à chaque mur':'Une figure en l’air à chaque mur'));
    if(state==='over'){
      if(MODE===1)overlay(P[0].pts+' POINTS',C.yellow,'Bravo '+name(0)+' ! Record : '+best+' pts',tap+' pour rejouer');
      else overlay(winner<0?'ÉGALITÉ !':name(winner).toUpperCase()+' GAGNE !',winner<0?C.cream:COL[winner],'J1 '+name(0)+' : '+P[0].pts+' pts · J2 '+name(1)+' : '+P[1].pts+' pts',MODE===3?tap+' pour la revanche':tap+' pour la revanche');
      conf.forEach(function(c){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.fillStyle=c.c;ctx.fillRect(-c.r,-c.r/2,c.r*2,c.r);ctx.restore()})}
  }
  function loop(now){var dt=Math.min((now-(last||now))/1000,1/30);last=now;t+=dt;if(visible||MODE===3){update(dt);draw()}requestAnimationFrame(loop)}
  requestAnimationFrame(loop);

  // ---- online duo: PeerJS introduces the two devices, the host (J1) runs the game
  var NET={role:null,peer:null,conn:null,ev:[],timer:null,go:[false,false]};
  function me(){return MODE===3&&NET.role==='guest'?1:0}
  function status(m){msgEl.textContent=m}
  function send(o){if(NET.conn&&NET.conn.open)try{NET.conn.send(o)}catch(e){}}
  function sendPick(){if(!NET.conn)return;var i=me();if(NET.role==='guest')send({t:'pick',ch:sel[1]});else send({t:'chars',c:sel})}
  function loadPeer(cb){if(window.Peer)return cb();var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';sc.onload=cb;sc.onerror=function(){status('Impossible de charger le mode en ligne. Vérifie ta connexion internet.')};document.head.appendChild(sc)}
  function netClose(){if(NET.timer)clearInterval(NET.timer);var c=NET.conn,pr=NET.peer;NET.role=null;NET.peer=null;NET.conn=null;NET.timer=null;NET.ev=[];NET.go=[false,false];
    try{c&&c.close()}catch(e){}try{pr&&pr.destroy()}catch(e){}panel.classList.remove('on');syncPickers()}
  function RID(n){return 'roulettes19-rampe-'+n}
  function dropPeer(){var pr=NET.peer;NET.peer=null;try{pr&&pr.destroy()}catch(e){}}
  function tryJoin(n,ok,fail){dropPeer();NET.role='guest';var done=false,pr=NET.peer=new Peer();var to=setTimeout(function(){end(false)},7000);
    function end(v){if(done)return;done=true;clearTimeout(to);if(v)ok();else{dropPeer();fail()}}
    pr.on('error',function(){end(false)});
    pr.on('open',function(){var c=pr.connect(RID(n),{reliable:true}),joined=false;
      c.on('data',function(d){if(!joined){if(d&&d.t==='welcome'){joined=true;end(true);attach(c,false)}else if(d&&d.t==='busy')end(false);return}onData(d)});
      c.on('error',function(){end(false)});c.on('close',function(){if(joined)lost();else end(false)})})}
  function tryHost(n,ok,fail){dropPeer();NET.role='host';var opened=false,pr=NET.peer=new Peer(RID(n));
    pr.on('open',function(){opened=true;status('En attente d’un·e adversaire… (rampe '+n+')');ok()});
    pr.on('connection',function(c){c.on('open',function(){if(NET.conn){c.send({t:'busy'});setTimeout(function(){c.close()},400);return}c.send({t:'welcome'});attach(c,true)})});
    pr.on('error',function(e){if(!opened){dropPeer();fail()}else if(e.type!=='peer-unavailable')status('Erreur de connexion ('+e.type+'). Réessaie.')})}
  function wait(ms){return function(ok,fail){setTimeout(fail,ms)}}
  function findGame(){netClose();status('Recherche d’une partie…');loadPeer(function(){
    var steps=[function(o,f){tryJoin(1,o,f)},function(o,f){tryJoin(2,o,f)},function(o,f){tryHost(1,o,f)},wait(900),function(o,f){tryJoin(1,o,f)},function(o,f){tryHost(2,o,f)},function(o,f){tryJoin(2,o,f)}];
    (function next(i){if(i>=steps.length){NET.role=null;status('Les 2 rampes en ligne sont occupées. Réessaie dans un moment.');return}steps[i](function(){},function(){next(i+1)})})(0)})}
  function attach(c,withData){NET.conn=c;if(withData)c.on('data',onData);c.on('close',lost);c.on('error',lost);
    panel.classList.add('on');state='select';reset();NET.go=[false,false];syncPickers();
    status('Connecté·es ! Tu es J'+(me()+1)+'. Choisis ton rider puis '+(PHONE?'touche l’écran.':'appuie sur Espace.'));
    if(NET.role==='host')NET.timer=setInterval(snap,40);sendPick()}
  function lost(){if(!NET.conn)return;netClose();state='select';reset();status('Connexion perdue. Appuie sur « Trouver un·e adversaire » pour rejouer.')}
  function tryStart(){if(NET.role==='host'&&(state==='select'||state==='over')&&NET.go[0]&&NET.go[1]){NET.go=[false,false];start()}}
  function onData(d){if(!d||!d.t)return;
    if(NET.role==='host'){
      if(d.t==='pick'&&d.ch&&d.ch.name){sel[1]=d.ch;send({t:'chars',c:sel})}
      else if(d.t==='in'){act(1,d.k)}}
    else{if(d.t==='chars'){sel[0]=d.c[0];if(!picked[1]&&d.c[1])sel[1]=sel[1]||d.c[1]}else if(d.t==='s')applySnap(d)}}
  function snap(){send({t:'s',st:state,tu:turn,tm:Math.round(tm*10)/10,cd:Math.round(cd*10)/10,m:cdMsg,w:winner,go:NET.go,
    pl:P.map(function(p){return[Math.round(p.s),p.dir,p.air?1:0,Math.round(p.h),Math.round(p.vy),p.tk,Math.round(p.tt*100)/100,p.pts,Math.round(p.bail*100)/100,Math.round(p.spin*100)/100,p.deck?1:0]}),ev:NET.ev});NET.ev=[]}
  function applySnap(d){var was=state;state=d.st;turn=d.tu;tm=d.tm;cd=d.cd;cdMsg=d.m;winner=d.w;NET.go=d.go;
    P.forEach(function(p,i){var a=d.pl[i];p.s=a[0];p.dir=a[1];p.air=!!a[2];p.h=a[3];p.vy=a[4];p.tk=a[5];p.tt=a[6];p.pts=a[7];p.bail=a[8];p.spin=a[9];p.deck=!!a[10]});
    if(state==='over'&&was!=='over'){conf=[];for(var i=0;i<140;i++)conf.push({x:W/2,y:120,vx:(Math.random()-.5)*700,vy:-Math.random()*520-80,r:Math.random()*4+2,c:[C.pink,C.cyan,C.yellow,'#7aa8ff'][i%4],a:Math.random()*6})}
    d.ev.forEach(function(e){if(e[0]==='sfx'){if(!muted)try{SFX[e[1]](e[2])}catch(x){}}else if(e[0]==='pop'){var q=pose(P[e[1]]);pops.push({txt:e[2],x:q.x,y:Math.max(q.y-120,60),life:1.2,col:e[3]})}})}
  document.getElementById('ramp-find').addEventListener('click',findGame);
  document.getElementById('ramp-quit').addEventListener('click',function(){netClose();state='select';reset();status('Partie quittée.')});

  // ---- modes & pickers
  var modesEl=document.getElementById('ramp-modes');if(PHONE)modesEl.classList.add('phone');
  function syncPickers(){lab2.hidden=MODE===1;selEl[0].parentNode.hidden=MODE===3&&NET.conn&&me()===1;if(MODE===3&&NET.conn&&me()===0)lab2.hidden=true;
    [].forEach.call(modesEl.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',+b.dataset.m===MODE?'true':'false')});panel.hidden=MODE!==3}
  function setMode(m){if(m===2&&PHONE)return;if(MODE===3&&m!==3)netClose();MODE=m;state='select';reset();
    if(m>=2&&key(sel[1])===key(sel[0]))fill();syncPickers();if(m===3&&!NET.conn)status('Appuie sur « Trouver un·e adversaire » : tu rejoins directement quelqu’un qui attend.')}
  [].forEach.call(modesEl.querySelectorAll('button'),function(b){b.addEventListener('click',function(){setMode(+b.dataset.m)})});
  syncPickers();

  // ---- input
  new IntersectionObserver(function(e){visible=e[0].isIntersecting;if(visible){loadPub();if(state==='select'&&window.RL&&RL.me&&!picked[0]&&key(sel[0])!==key(RL.me))fill()}},{threshold:.3}).observe(cv);
  var K1={KeyW:'ollie',KeyA:'shove',KeyD:'flip',KeyS:'tre'},K2={ArrowUp:'ollie',ArrowLeft:'shove',ArrowRight:'flip',ArrowDown:'tre'};
  window.addEventListener('keydown',function(e){
    if(!visible)return;var a=document.activeElement,tag=(a&&a.tagName)||'';if(a!==cv&&/INPUT|TEXTAREA|SELECT|BUTTON|^A$/.test(tag))return;
    if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(state==='run')act(MODE===3?me():turn,'ollie');else act(me(),'ollie');return}
    var k=K1[e.code],who=0;if(!k){k=K2[e.code];who=1}if(!k)return;e.preventDefault();
    if(MODE===1)who=0;else if(MODE===3)who=me();
    act(who,k)});
  cv.addEventListener('pointerdown',function(e){e.preventDefault();cv.focus({preventScroll:true});act(MODE===3?me():state==='run'?turn:0,'ollie')});
  [].forEach.call(document.querySelectorAll('#ramp-tricks button'),function(b){b.addEventListener('pointerdown',function(e){e.preventDefault();act(MODE===3?me():state==='run'?turn:0,b.dataset.k)})});
})();
