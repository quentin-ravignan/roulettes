/* Roulettes · data layer
   - Firebase (Google sign-in + Firestore) when window.RL_FB.config is filled in firebase-config.js
   - otherwise a local demo (fake data in this browser only), on localhost or with ?demo=1 */
(function(){
  var FBV='10.12.2',CFG=(window.RL_FB||{}).config,listeners=[],user=null,db=null,auth=null;
  var DEMO=!CFG&&(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||/[?&]demo=1/.test(location.search));
  if(/[?&]demo=1/.test(location.search))CFG=null,DEMO=true;
  var RLD=window.RLD={mode:CFG?'firebase':DEMO?'demo':'off',user:function(){return user}};
  function load(src){return new Promise(function(ok,ko){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s)})}
  function emit(){listeners.forEach(function(cb){try{cb(user)}catch(e){console.error(e)}})}
  RLD.onAuth=function(cb){listeners.push(cb);RLD.ready.then(function(){cb(user)})};
  function remember(on){try{if(on)localStorage.setItem('rl-auth','1');else localStorage.removeItem('rl-auth')}catch(e){}}

  // ---------- age, money and the rider look shared by the village, the shop and the member space
  RLD.age=function(b){if(!b)return null;var d=new Date(b),n=new Date(),a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||n.getMonth()===d.getMonth()&&n.getDate()<d.getDate())a--;return a};
  RLD.eur=function(v){return(Math.round((v||0)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2})+' €'};
  function shade(hex,k){var n=parseInt(hex.slice(1),16),f=function(v){return Math.max(0,Math.min(255,Math.round(v*k)))};return'#'+[n>>16,n>>8&255,n&255].map(function(v){return('0'+f(v).toString(16)).slice(-2)}).join('')}
  RLD.HAIR=['#f7d460','#e2561f','#b98b52','#5a3a26','#2b1d16','#8a5a2b','#1d1a24','#d8d8d8'];
  RLD.STYLES=[['long','Longs'],['pigtails','Couettes'],['curly','Bouclés'],['messy','Courts en bataille'],['wavy','Ondulés'],['quiff','Banane'],['cap','Casquette']];
  RLD.SKINS=['#fde4d4','#f6d2b8','#e8b48f','#c98e62','#a26a43','#7a4a2e','#5a3420'];
  RLD.TOPS=['#ff4fa8','#3ddcf0','#ffe14d','#9b6dff','#3fd17a','#e2561f','#fbf4e6'];
  RLD.PANTS=['#3b5ba8','#2f3f6e','#23233a','#5a6b8a','#c8b48a'];
  RLD.SHIRTS=[['logo','T-shirt Le Logo'],['flames','T-shirt Flames'],['wheel','T-shirt Wheel']];
  RLD.BOARDS=[['#ff4fa8','Rose'],['#3ddcf0','Cyan'],['#ffe14d','Jaune'],['#9b6dff','Violet'],['#3fd17a','Vert']];
  RLD.defaultLook=function(){return{hair:'#5a3a26',style:'long',skin:'#fde4d4',top:'#ff4fa8',pants:'#3b5ba8',glasses:false,lashes:false,shirt:'',board:''}};
  RLD.charOf=function(r){var L=Object.assign(RLD.defaultLook(),r&&r.look||{}),a=RLD.age(r&&r.birthDate)||8;
    return{name:(r&&r.firstName)||'Rider',skin:L.skin,hair:L.hair,hair2:shade(L.hair,.78),style:L.style,cap:'#ffe14d',top:L.shirt?'#151515':L.top,shirt:L.shirt||'',pants:L.pants,board:L.board||'',glasses:L.glasses?1:0,girl:L.lashes?1:0,size:Math.max(.8,Math.min(1.25,.8+Math.min(a,14)*.03))}};
  RLD.itemOf=function(name,variant){var n=(name||'').toLowerCase();
    if(n.indexOf('logo')>=0)return'shirt:logo';if(n.indexOf('flames')>=0)return'shirt:flames';if(n.indexOf('wheel')>=0)return'shirt:wheel';
    if(n.indexOf('planche')>=0){var b=RLD.BOARDS.filter(function(q){return q[1].toLowerCase()===(variant||'').toLowerCase()})[0];return'board:'+(b?b[0]:RLD.BOARDS[0][0])}return''};
  // what the club scene shows of a rider: first name, initial, crew, age and look (no family data)
  RLD.publicOf=function(r){var a=RLD.age(r.birthDate);return{name:r.firstName+(r.lastName?' '+r.lastName.charAt(0).toUpperCase()+'.':''),crew:r.crew||'',age:a==null?(+r.ageHint||0):a,stance:r.stance||'?',ch:RLD.charOf(r)}};
  // money owed by one family for the season
  // the yearly plan and the membership fee are per rider when set on the riders, otherwise per family
  RLD.balance=function(fam,payments,orders,S,riders){S=S||{};var shop=0,plan=+fam.plan||0,adh=fam.adhesion==null?(+S.adhesion||20):+fam.adhesion;
    var per=(riders||[]).filter(function(r){return r.plan!=null&&r.plan!==''});
    if(per.length){plan=0;adh=0;per.forEach(function(r){plan+=+r.plan||0;adh+=+r.adhesion||0})}
    (orders||[]).forEach(function(o){if(o.status!=='annulé')shop+=+o.total||0});
    var due=plan+adh+shop,paid=0;(payments||[]).forEach(function(p){paid+=+p.amount||0});return{plan:plan,adh:adh,shop:shop,due:due,paid:paid,left:Math.round((due-paid)*100)/100}};

  // ---------- Firebase
  if(RLD.mode==='firebase'){
    RLD.ready=load('https://www.gstatic.com/firebasejs/'+FBV+'/firebase-app-compat.js').then(function(){return Promise.all([load('https://www.gstatic.com/firebasejs/'+FBV+'/firebase-auth-compat.js'),load('https://www.gstatic.com/firebasejs/'+FBV+'/firebase-firestore-compat.js')])})
      .then(function(){firebase.initializeApp(CFG);auth=firebase.auth();db=firebase.firestore();
        return new Promise(function(ok){var first=true;auth.onAuthStateChanged(function(u){
          if(!u){user=null;remember(false);if(first){first=false;ok()}emit();return}
          var em=(u.email||'').toLowerCase();
          db.collection('admins').doc(em).get().then(function(d){return d.exists},function(){return false}).then(function(adm){
            adm=adm||((window.RL_FB||{}).owners||[]).indexOf(em)>=0;
            user={email:em,name:u.displayName||em,photo:u.photoURL||'',admin:adm};remember(true);if(first){first=false;ok()}emit()})})})});
    RLD.signIn=function(){var p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});return auth.signInWithPopup(p)};
    RLD.signOut=function(){return auth.signOut()};
    function snap(qs){return qs.docs.map(function(d){var o=d.data();o.id=d.id;return o})}
    RLD.q=function(col,where,order){var r=db.collection(col);(where||[]).forEach(function(w){r=r.where(w[0],w[1],w[2])});if(order)r=r.orderBy(order[0],order[1]||'asc');return r.get().then(snap)};
    RLD.get=function(col,id){return db.collection(col).doc(id).get().then(function(d){if(!d.exists)return null;var o=d.data();o.id=d.id;return o})};
    RLD.add=function(col,data){return db.collection(col).add(data).then(function(r){return r.id})};
    RLD.set=function(col,id,data,merge){return db.collection(col).doc(id).set(data,{merge:!!merge})};
    RLD.update=function(col,id,data){return db.collection(col).doc(id).update(data)};
    RLD.del=function(col,id){return db.collection(col).doc(id).delete()};
    RLD.batch=function(ops){var b=db.batch();ops.forEach(function(o){var ref=o.id?db.collection(o.col).doc(o.id):db.collection(o.col).doc();if(o.op==='del')b.delete(ref);else if(o.op==='update')b.update(ref,o.data);else b.set(ref,o.data,{merge:!!o.merge})});return b.commit()};
    return}

  // ---------- local demo (fake people, stored only in this browser)
  var KEY='rl-demo-db',DB;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}}
  function uid(){return Math.random().toString(36).slice(2,10)}
  function seed(){var y=new Date().getFullYear(),s=(new Date().getMonth()>=7?y:y-1)+'-'+(new Date().getMonth()>=7?y+1:y),d=function(m,dd){return(new Date().getMonth()>=7?y:y-1)+'-'+m+'-'+dd};
    var D={families:{},riders:{},payments:{},orders:{},coaches:{},lessons:{},coachPays:{},bank:{},reminders:{},settings:{},admins:{'admin@demo.roulettes':{}}};
    D.settings.app={season:s,prices:[390,450,490],adhesion:20,shop:{tshirt:25,board:90},payInfo:'Virement au club (IBAN donné par le club) ou chèque à l’ordre de Roulettes.'};D.settings.private={mailUrl:'',mailKey:''};
    var fams=[['Famille Démo','parent@demo.roulettes',450,[['Lou','Démo','2017-03-14','Regular','AlleyOop',{hair:'#f7d460',style:'pigtails',top:'#3ddcf0'}],['Sam','Démo','2019-09-02','?','Benihana',{hair:'#f7d460',style:'messy',top:'#3fd17a'}]],[[180,'virement','Cotisation 1/2'],[20,'chèque','Adhésion']]],
      ['Famille Exemple','exemple@demo.roulettes',390,[['Nina','Exemple','2016-06-21','Goofy','Caballerial',{hair:'#2b1d16',style:'curly',top:'#ff4fa8'}]],[[410,'virement','Cotisation + adhésion']]],
      ['Famille Test','test@demo.roulettes',490,[['Alex','Test','2015-01-30','Regular','Disaster',{hair:'#e2561f',style:'long',top:'#9b6dff',glasses:true}]],[]]];
    fams.forEach(function(f){var fid=uid();D.families[fid]={name:f[0],emails:[f[1]],phone:'06 00 00 00 00',plan:f[2],adhesion:20,season:s,notes:''};
      f[3].forEach(function(r){D.riders[uid()]={familyId:fid,emails:[f[1]],firstName:r[0],lastName:r[1],birthDate:r[2],stance:r[3],crew:r[4],medical:'',emergency:'',imageRights:true,look:Object.assign(RLD.defaultLook(),r[5]),owned:[]}});
      f[4].forEach(function(p,i){D.payments[uid()]={familyId:fid,emails:[f[1]],date:d('09',10+i),amount:p[0],method:p[1],label:p[2],kind:p[2].indexOf('Adh')===0?'adhesion':'cotisation',season:s}})});
    var cid=uid();D.coaches[cid]={name:'Coach démo',email:'coach@demo.roulettes',rate:45,startDate:d('09','01')};
    ['09-08','09-15','09-22','09-29','10-06'].forEach(function(md,i){D.lessons[uid()]={coachId:cid,date:d(md.slice(0,2),md.slice(3)),crew:i%2?'Benihana':'AlleyOop',n:1}});
    D.coachPays[uid()]={coachId:cid,date:d('10','01'),amount:135,label:'Septembre (3 cours)'};
    [['09','10','VIR FAMILLE DEMO COTISATION',180],['09','12','REMISE CHEQUE 0001',20],['09','18','VIR FAMILLE EXEMPLE ROULETTES',410],['10','01','VIR COACH DEMO SEPTEMBRE',-135],['10','03','CB DECATHLON PROTECTIONS',-86.4],['10','05','FRAIS TENUE DE COMPTE',-4.5]].forEach(function(b){D.bank[uid()]={date:d(b[0],b[1]),label:b[2],amount:b[3],cat:b[3]<0?(b[2].indexOf('COACH')>=0?'prof':b[2].indexOf('FRAIS')>=0?'frais':'materiel'):(b[2].indexOf('CHEQUE')>=0?'adhesion':'cotisation'),hash:b.join('|')}});
    return D}
  try{DB=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!DB||!DB.settings){DB=seed();save()}
  RLD.resetDemo=function(){DB=seed();save()};
  function all(col){var o=DB[col]||{};return Object.keys(o).map(function(id){var v=JSON.parse(JSON.stringify(o[id]));v.id=id;return v})}
  function match(v,w){var x=v[w[0]];if(w[1]==='==')return x===w[2];if(w[1]==='array-contains')return(x||[]).indexOf(w[2])>=0;if(w[1]==='in')return w[2].indexOf(x)>=0;if(w[1]==='>=')return x>=w[2];if(w[1]==='<=')return x<=w[2];return true}
  function wait(v){return new Promise(function(ok){setTimeout(function(){ok(v)},60)})}
  RLD.ready=Promise.resolve().then(function(){try{var u=JSON.parse(sessionStorage.getItem('rl-demo-user'))||JSON.parse(localStorage.getItem('rl-demo-user'));if(u)user=u}catch(e){}});
  RLD.signIn=function(){var adm=confirm('Mode démo (données fictives, gardées dans ce navigateur).\n\nOK = se connecter en admin\nAnnuler = se connecter en parent');
    user=adm?{email:'admin@demo.roulettes',name:'Admin démo',photo:'',admin:true}:{email:'parent@demo.roulettes',name:'Parent démo',photo:'',admin:false};
    try{localStorage.setItem('rl-demo-user',JSON.stringify(user))}catch(e){}remember(true);emit();return Promise.resolve()};
  RLD.signOut=function(){user=null;try{localStorage.removeItem('rl-demo-user')}catch(e){}remember(false);emit();return Promise.resolve()};
  RLD.q=function(col,where,order){var r=all(col).filter(function(v){return(where||[]).every(function(w){return match(v,w)})});if(order)r.sort(function(a,b){var x=a[order[0]],y=b[order[0]];return(x>y?1:x<y?-1:0)*(order[1]==='desc'?-1:1)});return wait(r)};
  RLD.get=function(col,id){var v=(DB[col]||{})[id];if(!v)return wait(null);v=JSON.parse(JSON.stringify(v));v.id=id;return wait(v)};
  RLD.add=function(col,data){var id=uid();(DB[col]=DB[col]||{})[id]=JSON.parse(JSON.stringify(data));save();return wait(id)};
  RLD.set=function(col,id,data,merge){DB[col]=DB[col]||{};DB[col][id]=merge?Object.assign(DB[col][id]||{},JSON.parse(JSON.stringify(data))):JSON.parse(JSON.stringify(data));save();return wait()};
  RLD.update=function(col,id,data){return RLD.set(col,id,data,true)};
  RLD.del=function(col,id){if(DB[col])delete DB[col][id];save();return wait()};
  RLD.batch=function(ops){ops.forEach(function(o){var id=o.id||uid();DB[o.col]=DB[o.col]||{};if(o.op==='del')delete DB[o.col][id];else DB[o.col][id]=o.merge||o.op==='update'?Object.assign(DB[o.col][id]||{},JSON.parse(JSON.stringify(o.data))):JSON.parse(JSON.stringify(o.data))});save();return wait()};
})();
