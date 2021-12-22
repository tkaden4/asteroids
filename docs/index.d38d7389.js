function toRadians(t){return t*Math.PI/180}function collidesWith(t,i){return t.x-t.bbox.width/2<i.x-i.bbox.width/2+i.bbox.width&&t.x-t.bbox.width/2+t.bbox.width>i.x+i.bbox.width&&t.y-t.bbox.height/2<i.y-i.bbox.height/2+i.bbox.height&&t.bbox.height+t.y-t.bbox.height/2>i.y-i.bbox.height/2}function physicalUpdate(t){t.x+=t.vx,t.y+=t.vy}function asteroidEntity(t,i){return{id:"asteroid",stale:!1,bbox:{width:t.width,height:t.height},...t,render(t){t.strokeStyle="white",t.strokeRect(this.x-this.width/2,this.y-this.height/2,this.width,this.height)},update(t){this.height*this.width<400&&(this.stale=!0),physicalUpdate(this)},onCollisionWith(t){if("bullet"===t.id){const t=this.vx,e=this.vy,s={...this,width:this.height/Math.sqrt(2),height:this.width/Math.sqrt(2),vx:t,vy:-e},h={...this,width:this.width/Math.sqrt(2),height:this.height/Math.sqrt(2),vx:-t,vy:e};this.stale=!0,i(s),i(h)}}}}function bulletEntity(t){const i=Date.now();return{id:"bullet",stale:!1,...t,bbox:{height:3,width:3},render(t){t.fillStyle="white",t.fillRect(this.x-1,this.y-1,3,3)},update(t){physicalUpdate(this),Date.now()-i>1e3&&(this.stale=!0)},onCollisionWith(t){"asteroid"===t.id&&(this.stale=!0)}}}function shipEntity(t,i){return{id:"ship",stale:!1,...t,bbox:{width:30,height:35},render(t){drawTriangle(t,"white",this.x,this.y,30,35,this.theta)},update(t){const e=Math.cos(toRadians(this.theta-90)),s=Math.sin(toRadians(this.theta-90));t(Key1.LEFT)&&(this.theta=(this.theta-5)%360),t(Key1.RIGHT)&&(this.theta=(this.theta+5)%360),t(Key1.UP)&&(this.vx+=e*this.speed,this.vy+=s*this.speed),t(Key1.DOWN)&&(this.vx-=e*this.speed,this.vy-=s*this.speed),this.vx*=1-this.friction,this.vy*=1-this.friction,t(Key1.SPACE)&&i({x:this.x+30*e/2,y:this.y+35*s/2,vx:this.vx+10*e,vy:this.vy+10*s}),physicalUpdate(this)},onCollisionWith(t){}}}var Key1;function isPressed1(t,i){return t[i]??!1}!function(t){t[t.LEFT=0]="LEFT",t[t.RIGHT=1]="RIGHT",t[t.UP=2]="UP",t[t.DOWN=3]="DOWN",t[t.SPACE=4]="SPACE"}(Key1||(Key1={}));const basicControlScheme=(t,i)=>i===Key1.LEFT?isPressed1(t,"a")||isPressed1(t,"ArrowLeft"):i===Key1.RIGHT?isPressed1(t,"d")||isPressed1(t,"ArrowRight"):i===Key1.DOWN?isPressed1(t,"s")||isPressed1(t,"ArrowDown"):i===Key1.UP?isPressed1(t,"w")||isPressed1(t,"ArrowUp"):i===Key1.SPACE&&(isPressed1(t,"Spacebar")||isPressed1(t," "));function onKeyStateChange(t,i){return e=>{t[e.key]=i}}function loop(t,i){const e=setInterval((()=>{i()&&clearInterval(e)}),t);return e}function withContext(t,i){const e=t.fillStyle,s=t.strokeStyle;i(t),t.fillStyle=e,t.strokeStyle=s}function drawTriangle(t,i,e,s,h,n,o){const a=o*Math.PI/180;t.translate(e,s),t.rotate(a),withContext(t,(()=>{t.strokeStyle=i,t.fillStyle="red",t.beginPath(),t.moveTo(-h/2,n/2),t.lineTo(0,-n/2),t.lineTo(0+h/2+1,n/2),t.lineTo(-h/2,n/2),t.stroke()})),t.rotate(-a),t.translate(-e,-s)}function clear(t,i){withContext(i,(i=>{i.fillStyle="black",i.fillRect(0,0,t.width,t.height)}))}function game(t){const i=document.getElementById("asteroids-canvas");if(null===i)return;const e=i.getContext("2d");if(null===e)return;const s={};document.onkeydown=onKeyStateChange(s,!0),document.onkeyup=onKeyStateChange(s,!1);const h={entities:[],nextEntities:[],add(t){this.nextEntities.push(t)},update(){for(let t=0;t<this.entities.length;++t){for(let i=0;i<this.entities.length;++i)i!==t&&(this.entities[t].stale||this.entities[i].stale||!collidesWith(this.entities[t],this.entities[i])||(this.entities[t].onCollisionWith(this.entities[i]),this.entities[i].onCollisionWith(this.entities[t])));this.entities[t].stale||this.nextEntities.push(this.entities[t])}this.entities=this.nextEntities,this.nextEntities=[]}},n={entities:[],nextEntities:[],render(t){for(const i of this.entities)withContext(t,(t=>i.render(t)))},update(t){for(const i of this.entities)i.update(t),i.x=(i.x+600)%600,i.y=(i.y+600)%600,i.stale||this.nextEntities.push(i);this.entities=this.nextEntities,this.nextEntities=[]},spawn(t){this.nextEntities.push(t)}},o={lastTime:0,fire(t){const i=Date.now();i-this.lastTime>300&&(a(bulletEntity(t)),this.lastTime=i)}},a=t=>{n.spawn(t),h.add(t)};a(shipEntity({x:300,y:300,vx:0,vy:0,speed:.3,theta:0,friction:.02},(t=>o.fire(t))));const r=t=>{a(asteroidEntity(t,r))};for(let t=0;t<5;++t)r({x:600*Math.random(),y:600*Math.random(),vx:4*Math.random()-2,vy:4*Math.random()-2,width:40*Math.random()+35,height:40*Math.random()+35});loop(20,(()=>(clear(i,e),n.render(e),h.update(),n.update((i=>t(s,i))),!1)))}game(basicControlScheme);
//# sourceMappingURL=index.d38d7389.js.map
