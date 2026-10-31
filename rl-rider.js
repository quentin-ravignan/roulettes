/* Roulettes · rider drawing shared with the member space.
   Generated from the game code in index.html (drawBoard + drawRider): edit it there, then regenerate. */
(function(){
  var ctx=null,t=0,C={night:'#150d2e',night2:'#1f1442',cyan:'#3ddcf0',pink:'#ff4fa8',yellow:'#ffe14d',cream:'#fbf4e6'},SK='#fde4d4';
  function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function tri(a,b,c,d,e,f){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.lineTo(e,f);ctx.closePath();ctx.fill()}
  function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
  function drawBoard(cx,cy,yaw,roll,deck){deck=deck||C.pink;
    var sx=Math.cos(yaw),kz=Math.sin(roll),ky=Math.cos(roll);
    var len=Math.max(Math.abs(sx)*66,7),hh=5+13*Math.abs(kz),face=Math.abs(kz)>.3;
    ctx.fillStyle=face?(kz>0?deck:'#2b2242'):deck;rr(cx-len/2,cy-hh/2,len,hh,4);ctx.fill();
    if(face&&kz>0){ctx.fillStyle=C.yellow;ctx.fillRect(cx-len/2+6,cy-1.5,Math.max(len-12,0),3)}
    if(Math.abs(kz)<.9){ctx.fillStyle=C.yellow;var wy=cy+7*ky;circ(cx-21*sx,wy,5);circ(cx+21*sx,wy,5)}
  }
  function drawRider(c,x,y,rot,tk,p,s){
    s=s*(c.size||1);
    ctx.save();ctx.translate(x+33*s,y);ctx.scale(s,s);ctx.rotate(rot);ctx.translate(-33,0);
    var yaw=0,roll=0,lift=0;
    if(tk&&tk!=='ollie'){var q=Math.min(p,1);lift=Math.sin(q*Math.PI)*12;
      if(tk==='shove')yaw=q*Math.PI;else if(tk==='flip')roll=q*Math.PI*2;else{yaw=q*Math.PI*2;roll=q*Math.PI*2}}
    if(!c.noBoard)drawBoard(33,-12,yaw,roll,c.board);
    ctx.translate(0,-lift);
    var wave=Math.sin(t*12)*3;
    // cat tail
    ctx.lineCap='round';ctx.strokeStyle=c.hair;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(16,-36);ctx.quadraticCurveTo(-4,-40,-2,-60+wave);ctx.stroke();
    ctx.strokeStyle=c.hair2;ctx.beginPath();ctx.moveTo(-2,-57+wave);ctx.lineTo(-2,-60+wave);ctx.stroke();
    // legs + sneakers
    ctx.strokeStyle=c.pants;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(24,-32);ctx.lineTo(20,-20);ctx.moveTo(42,-32);ctx.lineTo(46,-20);ctx.stroke();
    ctx.fillStyle='#fff';rr(13,-22,15,6,3);ctx.fill();rr(40,-22,15,6,3);ctx.fill();
    // arms
    ctx.strokeStyle=(c.skin||SK);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(22,-50);ctx.lineTo(8,-62);ctx.moveTo(44,-50);ctx.lineTo(58,-44);ctx.stroke();
    // tee
    if(c.bracelet){ctx.fillStyle='#e0b64a';circ(57,-44.5,2.6)}
    ctx.fillStyle=c.top;rr(15,-58,34,30,12);ctx.fill();
    if(c.print==='lemon'){[[21,-52],[33,-47],[42,-54],[25,-38],[39,-36],[30,-55]].forEach(function(d){ctx.fillStyle='#f2cf3a';ctx.beginPath();ctx.ellipse(d[0],d[1],2.6,1.8,.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6aa84f';ctx.fillRect(d[0]+1.5,d[1]-3,2,1.4)})}
    if(c.jacket==='leopard'){ctx.fillStyle='#c99a5c';rr(15,-58,34,30,12);ctx.fill();ctx.fillStyle='#4a2e14';[[19,-52],[24,-44],[19,-36],[45,-52],[42,-42],[46,-34],[27,-55],[40,-56]].forEach(function(d){ctx.beginPath();ctx.ellipse(d[0],d[1],2.2,1.6,0,0,Math.PI*2);ctx.fill()});
      ctx.fillStyle='#ffffff';rr(28,-57,10,29,3);ctx.fill();ctx.fillStyle='#d9d9d9';ctx.fillRect(15,-50,2,18)}
    if(c.necklace){ctx.strokeStyle='#1a1230';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(29,-57);ctx.quadraticCurveTo(33,-48,37,-57);ctx.stroke();ctx.fillStyle='#1a1230';tri(31.5,-50,34.5,-50,33,-46.5)}
    if(c.belt){ctx.fillStyle='#7a4a24';ctx.fillRect(15,-32,34,4);ctx.fillStyle='#e0b64a';ctx.fillRect(30,-32.5,5,5)}
    if(c.shirt){ctx.save();ctx.translate(32,-44);
      if(c.shirt==='logo'){ctx.fillStyle='#120a2c';circ(0,0,8);ctx.strokeStyle='#3ddcf0';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ff4fa8';circ(0,1,3);tri(-3,-1,-2,-5,0,-2);tri(3,-1,2,-5,0,-2)}
      else if(c.shirt==='flames'){ctx.fillStyle='#e2561f';[-10,-5,0,5,10].forEach(function(fx,j){tri(fx-3,-1,fx,-8-(j%2)*2,fx+3,-1)});ctx.fillStyle='#ffe14d';ctx.font='900 6px Space Grotesk, sans-serif';ctx.textAlign='center';ctx.fillText('ROULETTES',0,4);ctx.textAlign='left'}
      else if(c.shirt==='wheel'){ctx.fillStyle='#ffe14d';circ(0,0,8);ctx.fillStyle='#151515';circ(0,0,3);ctx.fillStyle='#ff4fa8';ctx.fillRect(-11,-1.5,22,3)}
      ctx.restore()}
    else if(!c.print&&!c.jacket){ctx.fillStyle=c.top==='#ffffff'?'rgba(26,18,48,.55)':'rgba(255,255,255,.85)';ctx.font='700 6px Space Grotesk, sans-serif';ctx.textAlign='center';ctx.fillText('Roulettes',32,-40);ctx.textAlign='left'}
    // back hair
    ctx.fillStyle=c.hair;
    if(c.style==='pigtails'){[[19,-80,3,-66],[53,-82,66,-68]].forEach(function(q,j){var w2=j?-wave:wave;ctx.strokeStyle=c.hair;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.quadraticCurveTo((q[0]+q[2])/2,q[1]-6,q[2],q[3]+w2);ctx.stroke();ctx.strokeStyle=c.hair2;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo((q[0]+q[2])/2,q[1]-3);ctx.quadraticCurveTo(q[2]-2,q[3]-6,q[2]-1,q[3]+w2+2);ctx.stroke();ctx.fillStyle=C.yellow;circ(q[0]+(j?3:-3),q[1]+1,3.5)})}
    else if(c.style==='wavy'){ctx.beginPath();ctx.ellipse(32,-74,21,20,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(14,-78);ctx.quadraticCurveTo(3,-62,6+wave*.6,-40);ctx.quadraticCurveTo(15,-35,24,-42+wave*.3);ctx.quadraticCurveTo(25,-58,30,-70);ctx.closePath();ctx.fill();
      [[10,-70,6],[7,-60,6],[8,-50,6],[12,-42,5.5],[19,-39,5],[25,-44,4.5]].forEach(function(q){circ(q[0]+(q[1]>-55?wave*.5:0),q[1],q[2])});ctx.strokeStyle=c.hair2;ctx.lineWidth=1.4;[[11,-62],[11,-50],[18,-44]].forEach(function(q){ctx.beginPath();ctx.arc(q[0]+wave*.4,q[1],3.2,0,Math.PI*1.3);ctx.stroke()})}
    else if(c.style==='quiff'){ctx.fillStyle=c.hair2;ctx.beginPath();ctx.ellipse(31,-73,19,17,0,0,Math.PI*2);ctx.fill()}
    else if(c.style==='cap'){ctx.fillStyle=c.hair;ctx.beginPath();ctx.ellipse(28,-70,15,12,0,0,Math.PI*2);ctx.fill()}
    else if(c.style==='long'){ctx.beginPath();ctx.ellipse(32,-74,21,20,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(14,-78);ctx.quadraticCurveTo(4,-62,7+wave*.6,-42);ctx.quadraticCurveTo(14,-38,22,-44+wave*.3);ctx.quadraticCurveTo(24,-58,30,-70);ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.hair2;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(15,-70);ctx.quadraticCurveTo(10,-58,12+wave*.6,-46);ctx.moveTo(21,-70);ctx.quadraticCurveTo(17,-58,18+wave*.4,-46);ctx.stroke()}
    else if(c.style==='curly'){ctx.beginPath();ctx.ellipse(32,-73,21,20,0,0,Math.PI*2);ctx.fill();[[13,-76,8],[11,-66,7.5],[13,-57,7],[19,-51,6.5],[26,-52,5.5]].forEach(function(q){circ(q[0],q[1]+(q[1]>-60?wave*.3:0),q[2])});
      ctx.strokeStyle=c.hair2;ctx.lineWidth=1.3;[[12,-66],[14,-57],[20,-51]].forEach(function(q){ctx.beginPath();ctx.arc(q[0],q[1],3,0,Math.PI*1.4);ctx.stroke()})}
    else{ctx.beginPath();ctx.ellipse(34,-75,19,18,0,0,Math.PI*2);ctx.fill();tri(18,-82,11,-84,18,-74)}
    // head
    ctx.fillStyle=(c.skin||SK);circ(36,-72,17);
    // hair top
    ctx.fillStyle=c.hair;
    if(c.style==='pigtails'){ctx.beginPath();ctx.moveTo(17,-74);ctx.arc(36,-74,19,Math.PI,Math.PI*2);ctx.lineTo(55,-79);for(var fx=55;fx>17;fx-=5)ctx.lineTo(fx-2.5,(fx/5)%2<1?-75:-79.5);ctx.closePath();ctx.fill()}
    else if(c.style==='wavy'){ctx.beginPath();ctx.arc(36,-72,18,Math.PI*1.05,Math.PI*1.95);ctx.quadraticCurveTo(36,-84,20,-76);ctx.fill();ctx.beginPath();ctx.ellipse(45,-84,10,4.5,.5,0,Math.PI*2);ctx.fill();circ(24,-84,5);circ(52,-79,4)}
    else if(c.style==='quiff'){ctx.beginPath();ctx.moveTo(18,-76);ctx.quadraticCurveTo(16,-96,34,-102);ctx.quadraticCurveTo(52,-104,56,-88);ctx.quadraticCurveTo(54,-80,50,-79);ctx.quadraticCurveTo(38,-86,22,-74);ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.hair2;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(26,-90);ctx.quadraticCurveTo(38,-100,50,-92);ctx.moveTo(24,-84);ctx.quadraticCurveTo(38,-94,52,-86);ctx.stroke()}
    else if(c.style==='cap'){ctx.fillStyle=c.cap;ctx.beginPath();ctx.arc(36,-75,18.5,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();rr(42,-79,22,5,2.5);ctx.fill();ctx.fillStyle='#3a3a44';ctx.fillRect(19,-78,34,3)}
    else if(c.style==='long'){ctx.beginPath();ctx.arc(36,-72,18,Math.PI*1.05,Math.PI*1.95);ctx.quadraticCurveTo(38,-84,20,-76);ctx.fill();ctx.beginPath();ctx.ellipse(46,-83,11,4.5,.45,0,Math.PI*2);ctx.fill()}
    else if(c.style==='curly'){ctx.beginPath();ctx.arc(36,-73,18.5,Math.PI*1.02,Math.PI*1.98);ctx.closePath();ctx.fill();[[24,-85,6],[32,-89,6],[41,-89,6],[49,-84,5.5],[53,-78,4.5],[46,-80,4]].forEach(function(q){circ(q[0],q[1],q[2])})}
    else{ctx.beginPath();ctx.arc(36,-74,18.5,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();tri(30,-89,34,-96,39,-89);tri(38,-89,44,-95,46,-86);tri(47,-84,55,-84,51,-78);tri(41,-83,45,-78,49,-83)}
    // cat ears
    ctx.fillStyle=c.hair;tri(20,-80,22,-100,33,-88);tri(40,-89,51,-100,53,-80);
    ctx.fillStyle='#ff9ec8';tri(23,-84,24,-95,30,-88);tri(43,-89,49,-95,50,-84);
    // kid face
    [[32,-71],[43,-71]].forEach(function(e){ctx.fillStyle='#2a1d3a';ctx.beginPath();ctx.ellipse(e[0],e[1],2.6,3.2,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';circ(e[0]+.9,e[1]-1.1,.9);
      if(c.girl){ctx.strokeStyle='#2a1d3a';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(e[0]+1.8,e[1]-2.6);ctx.lineTo(e[0]+3.8,e[1]-4.4);ctx.stroke()}});
    ctx.fillStyle='rgba(255,110,140,.35)';ctx.beginPath();ctx.ellipse(47,-64,3.6,2.3,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(27,-64,3,2.1,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#d99a85';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(50,-69);ctx.quadraticCurveTo(52.5,-66,49.5,-65);ctx.stroke();
    if(c.beard||c.stubble){ctx.fillStyle=c.beard||c.stubble;ctx.globalAlpha=c.beard?1:.55;ctx.beginPath();ctx.moveTo(25,-67);ctx.quadraticCurveTo(26,-50,40,-52);ctx.quadraticCurveTo(54,-53,54,-64);ctx.quadraticCurveTo(46,-60,40,-62);ctx.quadraticCurveTo(32,-60,25,-67);ctx.fill();ctx.globalAlpha=1}
    ctx.strokeStyle=c.beard?'#2a1d3a':'#b8485e';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(44,-63,3.6,Math.PI*.15,Math.PI*.85);ctx.stroke();
    if(c.glasses){ctx.strokeStyle='#1a1230';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(32,-71,5,0,Math.PI*2);ctx.moveTo(48,-71);ctx.arc(43,-71,5,0,Math.PI*2);ctx.moveTo(37,-71.5);ctx.lineTo(38,-71.5);ctx.moveTo(27,-72);ctx.lineTo(20,-74);ctx.stroke()}
    ctx.restore();
  }
  window.RLRider={draw:function(c2,ch,x,y,sc,tt,flip){var k=sc*(ch.size||1);ctx=c2;t=tt||0;c2.save();if(flip){c2.translate(x,0);c2.scale(-1,1);c2.translate(-x,0)}
    drawRider(ch,x-33*k,ch.noBoard?y+16*k:y,0,null,0,sc);c2.restore()}};
})();
