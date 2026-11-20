(() => {
'use strict';
let finaleClock=0,closingClock=0,closingStarted=false,gameEnded=false;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], stage=$('#stage'), path=$('#route');
// User-provided soundtrack and a local, pre-rendered voice cue; no audio controls.
const bgMusic=$('#background-music'),blowPrompt=$('#blow-prompt');
let audioHeld=false,cuePlaying=false,audioFade=0,cueGeneration=0,cueQuietUntil=0;
bgMusic.volume=.45;
function tryMusic(){
 if(closingStarted||gameEnded||!bgMusic.paused)return;
 bgMusic.play().then(()=>{$('#music-start').hidden=true;}).catch(error=>{if(error.name==='NotAllowedError')$('#music-start').hidden=false;});
}
bgMusic.addEventListener('playing',()=>{$('#music-start').hidden=true;});
bgMusic.addEventListener('canplay',tryMusic);
$('#music-start').onclick=tryMusic;

function fadeMusicTo(volume,duration=650){cancelAnimationFrame(audioFade);const from=bgMusic.volume,start=performance.now();function step(now){const t=Math.min(1,(now-start)/duration);bgMusic.volume=from+(volume-from)*t;if(t<1)audioFade=requestAnimationFrame(step);}audioFade=requestAnimationFrame(step);}
function finishAudioCue(){cuePlaying=false;cueQuietUntil=performance.now()+600;}
blowPrompt.addEventListener('ended',finishAudioCue);blowPrompt.addEventListener('error',finishAudioCue);
function playBlowCue(){
 const generation=++cueGeneration;audioHeld=true;tryMusic();fadeMusicTo(.10,180);
 blowPrompt.currentTime=0;blowPrompt.volume=.75;cuePlaying=true;
 blowPrompt.play().catch(()=>{if(generation===cueGeneration)cuePlaying=false;});
}
function restoreMusic(){cueGeneration++;cuePlaying=false;blowPrompt.pause();blowPrompt.currentTime=0;audioHeld=false;tryMusic();fadeMusicTo(.45);}
for(const event of ['pointerdown','pointerup','click','keydown','wheel','touchstart','touchend'])addEventListener(event,tryMusic,{passive:true});
tryMusic();
const length=path.getTotalLength(), reduced=matchMedia('(prefers-reduced-motion: reduce)');
const originalRoute=path.cloneNode();originalRoute.setAttribute('d',path.getAttribute('d').split(' C 4750')[0]);const routeScale=originalRoute.getTotalLength()/length;
const stops=[{p:.25,name:'陌生树',kicker:'01 / MEMORY ISLAND',subtitle:'从陌生到熟悉，每一根枝桠都珍藏着一束光。'},{p:.55,name:'星光邮局',kicker:'02 / LETTERS IN THE STARS',subtitle:'有一封信，穿过星光来找你。'},{p:.86,name:'星愿蛋糕岛',kicker:'03 / MAKE A WISH',subtitle:'把愿望藏在心里，让星光替你记住。'},{p:.98,name:'心愿终点站',kicker:'04 / UNTIL THE NEXT ADVENTURE',subtitle:'这趟航程到站了，你的故事还在继续。'}];
stops.slice(0,3).forEach(stop=>stop.p*=routeScale);
let state='idle',progress=0,target=0,next=0,previous=0,transition=0,camera=0,lastWheel=-1000,quietUntil=0,active=-1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), ease=t=>t*t*(3-2*t), clouds=[];
function resize(){const s=innerWidth/innerHeight>1.2?Math.max(innerWidth/1600,innerHeight/900):Math.min(innerWidth/1600,innerHeight/900);stage.style.transform=`translate(-50%,-50%) scale(${s})`;stage.style.setProperty('--inset-x',Math.max(0,(1600-innerWidth/s)/2)+'px');stage.style.setProperty('--inset-y',Math.max(0,(900-innerHeight/s)/2)+'px');}
addEventListener('resize',resize);resize();
for(let i=0;i<80;i++){const star=document.createElement('i');star.style.cssText=`left:${i*173%1600}px;top:${i*89%650}px;width:${i%4+1}px;height:${i%4+1}px;opacity:${.15+i%5*.12}`;$('#stars').append(star);}
for(let i=0;i<15;i++){const front=i>9,img=new Image();img.src=`assets/optimized/layers-cloud-${front?'foreground':'mid'}-v1-v18.webp`;img.className='cloud';img.alt='';img.style.width=(front?750:420)+'px';(front?$('#clouds-front'):$('#clouds-back')).append(img);clouds.push({img,x:(i%10)*630-350,y:front?700+(i%2)*40:170+(i%3)*190,speed:front?1.25:.4});}
stops.forEach((s,i)=>{s.point=path.getPointAtLength(length*s.p);s.el=document.createElement('div');s.el.className='stop';s.el.style.left=s.point.x+'px';s.el.style.top=s.point.y+'px';s.el.innerHTML=`<img src="${['assets/optimized/layers-photo-island-base-v1-v18.webp','assets/optimized/layers-star-post-office-v3-v18.webp','assets/optimized/layers-birthday-cake-v10-v18.webp','assets/optimized/layers-photo-island-base-v1-v18.webp'][i]}" alt=""><div class="portal"><img src="assets/optimized/layers-nebula-portal-v3-v18.webp" alt=""></div><div class="stop-label">${s.name}<small></small></div>`;$('#stops').append(s.el);});
function sync(){stage.dataset.state=state;stage.dataset.completed=next;$('#intro').hidden=state!=='idle';stops.forEach((s,i)=>{s.el.classList.toggle('done',i<next);s.el.classList.toggle('future',i>next);s.el.querySelector('small').textContent=i<next?'':i===next?'下一站 · 靠近进入':'尚未开启';});}
function start(){if(state==='idle'){state='flying';sync();}}
function move(delta){if(state==='idle'&&delta!==0)start();if(state!=='flying')return;const old=target;target=clamp(target+delta*routeScale,0,next<stops.length?stops[next].p:1);if(target!==old)scrollEnergy=clamp(scrollEnergy+Math.abs(target-old)*7,0,1);}
addEventListener('wheel',e=>{if(e.target.closest('.photos'))return;if(e.ctrlKey||$('#lightbox').open||$('#letter-reader').open)return;e.preventDefault();const now=performance.now(),quiet=now-lastWheel>220;lastWheel=now;if(now<quietUntil)return;if(quietUntil&& !quiet)return;quietUntil=0;const multiplier=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;move(clamp(e.deltaY*multiplier,-450,450)/6500);},{passive:false});
addEventListener('keydown',e=>{if($('#lightbox').open||$('#letter-reader').open||e.target.closest('input,.photos'))return;if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();move((e.key==='ArrowRight'||e.key==='ArrowDown')?.035:-.035);}});

let flightTouch=null;
addEventListener('touchstart',e=>{if(e.touches.length===1&&!$('#lightbox').open&&!$('#letter-reader').open)flightTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
addEventListener('touchend',e=>{if(!flightTouch)return;const dx=flightTouch.x-e.changedTouches[0].clientX,dy=flightTouch.y-e.changedTouches[0].clientY;flightTouch=null;if(Math.max(Math.abs(dx),Math.abs(dy))>25)move(Math.sign(Math.abs(dy)>Math.abs(dx)?dy:dx)*.08);},{passive:true});

function enter(now){active=next;state='entering';progress=target=stops[active].p;transition=now;sync();}
function showScene(){state='scene';if(active===3)finaleClock=0;$('#scene').dataset.location=['memory','mail','cake','arrival'][active];$('#scene').style.opacity='1';$('#scene').classList.remove('departing');$('#scene').hidden=false;$('#scene-title').textContent=stops[active].name;$('#scene-kicker').textContent=stops[active].kicker;$('#scene-subtitle').textContent=stops[active].subtitle;$('#cake-scene').hidden=active!==2;$('#leave').hidden=active>=2;$('#arrival-scene').hidden=active!==3;if(active===2){resetCake();}$('#arrival-scene').classList.toggle('playing',active===3);$('#memory').hidden=active!==0;$('#mail').hidden=active!==1;$('#envelope').hidden=true;$('#envelope').classList.remove('opening','paper-in-reader');$('#envelope').disabled=false;$('#mail').classList.remove('collected');$('#collect-letter').disabled=false;$('#collect-letter span').textContent='✦ 点击邮局，领取你的来信';$('#leave').disabled=active===1;$('#leave').textContent=active===1?'请先到邮局取信':'继续航程 →';$('#world').inert=true;(active===2?$('#wish-candle'):$('#leave')).focus({preventScroll:true});sync();}
$('#collect-letter').onclick=()=>{if(state!=='scene'||active!==1)return;$('#mail').classList.add('collected');$('#collect-letter').disabled=true;$('#collect-letter span').textContent='来信已送达，点击信封拆开';$('#envelope').hidden=false;$('#leave').textContent='请先拆开祝福信';$('#envelope').focus({preventScroll:true});};
let openingTimer=null,letterPosition=0,letterClock=0,letterDone=false,readerMoving=false,readerAnimations=[];
const letterText="学姐，生日快乐呀！\n\n平时跟你嘻嘻哈哈的，突然认真写点东西还有点不习惯。其实认识你真的挺开心的，有时候也没聊什么特别的，就是随便说几句，也会觉得心情不错。这些话平时说出来有点肉麻，就趁你生日说一下哈哈。\n\n下个月就要考研了，希望你这段时间的辛苦都能有个好结果，背过的东西能记住，考试的时候刚好都会。也不知道怎么给你加油才有用，反正累了就歇一会，想吐槽就来找我，不用每次都自己憋着。\n\n今天就先好好过生日，吃点喜欢的，许个愿，暂时把那些烦心事放一放。虽然很想听到你上岸的好消息，但也希望这一个月你能好好吃饭、好好睡觉，别把自己累坏了。\n\n希望明年这个时候，能听你跟我讲研究生生活里的新鲜事，也希望到时候我们还是这样，有事没事都能聊上几句。\n\n生日快乐呀，世上美丽无敌漂亮的学姐，新的一岁也要多开心一点！";
const letterChars=Array.from(letterText);
function finishLetter(){letterPosition=letterChars.length;$('#typed-letter').textContent=letterText;letterDone=true;$('#read-all').hidden=true;$('#reader-leave').disabled=false;$('#typed-letter').classList.remove('typing');$('#leave').disabled=false;$('#leave').textContent='继续航程 →';}
async function openReader(){
 if(state!=='scene'||active!==1)return;
 const origin=$('.envelope-paper').getBoundingClientRect();
 letterPosition=0;letterClock=0;letterDone=false;readerMoving=true;
 $('#read-all').hidden=false;$('#typed-letter').textContent='';$('#typed-letter').classList.add('typing');
 $('#reader-leave').disabled=true;
 const reader=$('#letter-reader'),paper=$('.reading-paper');
 reader.classList.add('arriving');reader.showModal();$('#envelope').classList.add('paper-in-reader');
 const dest=paper.getBoundingClientRect();
 const transform=`translate(${origin.left+origin.width/2-dest.left-dest.width/2}px,${origin.top+origin.height/2-dest.top-dest.height/2}px) scale(${origin.width/dest.width},${origin.height/dest.height})`;
 const duration=reduced.matches?0:1500;
 readerAnimations=[paper.animate([{transform},{transform:'none'}],{duration,easing:'cubic-bezier(.22,.75,.18,1)',fill:'both'}),reader.animate([{backgroundColor:'transparent'},{backgroundColor:'transparent'}],{duration})];
 reader.classList.add('revealing');
 await Promise.all(readerAnimations.map(a=>a.finished.catch(()=>{})));
 if(!reader.open)return;
 readerAnimations.forEach(a=>a.cancel());readerAnimations=[];
 reader.classList.remove('arriving','revealing');readerMoving=false;
 $('#envelope').disabled=false;$('#envelope').classList.remove('opening','paper-in-reader');
 if(reduced.matches)finishLetter();
}
$('#envelope').onclick=()=>{if(state!=='scene'||$('#envelope').disabled)return;$('#envelope').disabled=true;$('#envelope').classList.add('opening');clearTimeout(openingTimer);openingTimer=setTimeout(openReader,reduced.matches?0:2600);};
$('#read-all').onclick=finishLetter;
$('#reader-leave').onclick=()=>{$('#letter-reader').close();$('#leave').click();startBlowListening();};
$('#letter-reader').addEventListener('close',()=>{readerMoving=false;readerAnimations.forEach(a=>a.cancel());readerAnimations=[];$('#letter-reader').classList.remove('arriving','revealing');$('#envelope').disabled=false;$('#envelope').classList.remove('opening','paper-in-reader');$('#envelope').focus({preventScroll:true});});
$('#leave').onclick=()=>{if(state!=='scene')return;next=active+1;state='exiting';transition=performance.now();target=progress;$('#scene').classList.add('departing');$('#world').inert=false;sync();};
$('#restart').onclick=()=>{finaleClock=closingClock=0;closingStarted=gameEnded=false;$('#exam-ending').hidden=true;$('#exam-ending').className='';document.body.classList.remove('journey-ended');stage.inert=false;clearTimeout(openingTimer);restoreMusic();$('#arrival-scene').classList.remove('playing');resetCake();$('#letter-reader').close();state='idle';launchBalloons();progress=target=next=0;active=-1;quietUntil=0;scrollEnergy=windStrength=0;$('#scene').hidden=true;$('#world').inert=false;$('#lightbox').close();sync();$('#restart').blur();};
let ambient=0,windStrength=0,scrollEnergy=0,rotorAngle=0,windTravel=0;
const pointer={x:0,y:0,tx:0,ty:0};
addEventListener('pointermove',e=>{pointer.tx=clamp(e.clientX/innerWidth*2-1,-1,1);pointer.ty=clamp(e.clientY/innerHeight*2-1,-1,1);});
document.documentElement.addEventListener('pointerleave',()=>{pointer.tx=pointer.ty=0;});
addEventListener('blur',()=>{pointer.tx=pointer.ty=0;scrollEnergy=0;});
const windLines=[];for(let i=0;i<30;i++){const el=document.createElement('i');$('#wind').append(el);windLines.push(el);}
function tick(now){const before=progress;const dt=previous?Math.min(now-previous,50):0;previous=now;if(state==='flying'&&!document.hidden){progress+=(target-progress)*(1-Math.exp(-dt/110));if(Math.abs(target-progress)<.00001)progress=target;if(next<stops.length&&target>=stops[next].p&&progress>=stops[next].p-.0005)enter(now);}
if(!document.hidden&&!reduced.matches)ambient+=dt;const velocity=(progress-before)/Math.max(dt,1);scrollEnergy*=Math.exp(-dt/550);const force=state==='flying'?clamp(Math.abs(velocity)*1200+scrollEnergy,0,1):0;windStrength+=(force-windStrength)*(1-Math.exp(-dt/(force>windStrength?85:700)));stage.style.setProperty('--airspeed',windStrength.toFixed(3));
pointer.x+=(pointer.tx-pointer.x)*(1-Math.exp(-dt/300));pointer.y+=(pointer.ty-pointer.y)*(1-Math.exp(-dt/300));const mx=reduced.matches?0:pointer.x,my=reduced.matches?0:pointer.y;
if(state!=='scene'){rotorAngle=(rotorAngle+(reduced.matches||document.hidden?0:dt*(state==='idle'?.12:.65+windStrength*2.6)))%360;$('.prop-rotor').style.transform=`rotate(${rotorAngle}deg)`;$('.prop-disc').style.opacity=reduced.matches?0:.12+windStrength*.45;
}
windTravel+=dt*(.18+windStrength*1.6);$('.scene-atmosphere').style.transform=`scale(1.045) translate(${-mx*9}px,${-my*7}px)`;$('.scene-cloud-left').style.translate=`${-mx*22}px ${-my*12}px`;$('.scene-cloud-right').style.translate=`${-mx*32}px ${-my*18}px`;
const point=path.getPointAtLength(progress*length),ahead=path.getPointAtLength(Math.min(length,progress*length+3));camera=clamp(point.x-520,0,4700);
let x=point.x-camera,y=point.y,scale=1,spin=0,opacity=1;
const angle=Math.atan2(ahead.y-point.y,ahead.x-point.x)*180/Math.PI;
let vortexOpacity=0,vortexScale=1,veil=0,depth=0;
const duration=reduced.matches?500:3400;
if(state==='entering'||state==='exiting'){
 const t=clamp((now-transition)/duration,0,1), incoming=state==='entering';
 const travel=ease(clamp((t-.10)/.85,0,1)); depth=incoming?travel:1-ease(t);
 const swallow=ease(clamp((depth-.05)/.6,0,1));
 scale=Math.max(.025,Math.pow(1-swallow,1.5)); spin=reduced.matches?0:-135*swallow;
 opacity=1-ease(clamp((swallow-.7)/.3,0,1));
 vortexOpacity=incoming?ease(clamp(t/.17,0,1)):(t<.98?1:0);
 vortexScale=(incoming?.75:.75*ease(clamp((1-t)/.25,0,1)))+Math.pow(depth,2.4)*12;
 veil=ease(clamp((depth-.78)/.22,0,1));
 if(!incoming){$('#scene').style.opacity=String(1-ease(clamp(t/.20,0,1)));if(t>.20)$('#scene').hidden=true;}
 if(t===1){if(incoming)showScene();else{state='flying';quietUntil=now+300;lastWheel=now;sync();}}
}
const cameraShift=(800-x)*depth; x+=cameraShift;camera-=cameraShift;
$('#world').style.transform=`translate3d(${-camera}px,0,0)`;
$('#world').style.filter=depth>.2?`blur(${(depth-.2)*8}px)`:'';
if(state==='scene')opacity=0;
const orbit=reduced.matches?0:Math.sin(depth*Math.PI*2)*35*(1-depth);
$('#plane').style.transform=`translate3d(${x+orbit}px,${y-15+Math.sin(depth*Math.PI)*45+(reduced.matches?0:Math.sin(ambient/500)*(2+windStrength*4))}px,0) rotate(${angle+spin+(reduced.matches?0:Math.sin(ambient/180)*windStrength*1.5)}deg) scale(${scale})`;
$('#plane').style.opacity=opacity;
$('#vortex').style.transform=`translate(${x}px,${y}px) scale(${vortexScale})`;
$('#vortex').style.opacity=vortexOpacity;
$('#vortex').style.setProperty('--turn',`${reduced.matches?0:now*.025}deg`);
$('#veil').style.opacity=state==='scene'?0:veil;
if(state!=='scene')for(const c of clouds){const drift=reduced.matches?0:ambient*.009*c.speed;const cx=((c.x-camera*c.speed-drift+900)%6500+6500)%6500-900;const near=Math.exp(-Math.pow((cx+230-x)/260,2));const gust=reduced.matches?0:near*windStrength*32; c.img.style.transform=`translate3d(${cx-gust-mx*c.speed*25}px,${c.y+Math.sin(ambient/3200+c.x)*5+gust*.4-my*c.speed*16}px,0) rotate(${-gust*.05}deg)`;}
$('.sky').style.transform=reduced.matches?'none':`scale(1.06) translate(${Math.sin(ambient/19000)*14-camera*.003-mx*12}px,${Math.cos(ambient/14000)*8-my*9}px)`;
$('#wind').style.opacity=reduced.matches||state!=='flying'?0:windStrength*.75;
if(state!=='scene')for(let i=0;i<windLines.length;i++){const phase=(windTravel/(700+i*11)+i*.13)%1;const wx=x+350-phase*1100,wy=y-155+(i*41%310);windLines[i].style.transform=`translate(${wx}px,${wy}px) scaleX(${.3+windStrength*2.4})`;windLines[i].style.opacity=Math.sin(phase*Math.PI)*clamp(windStrength*2-i/30,0,1);}
$('#plane').classList.toggle('moving',state==='flying'&&windStrength>.01);$('#wind').dataset.strength=windStrength.toFixed(3);
if($('#letter-reader').open&&!readerMoving&&!letterDone&&!document.hidden){letterClock+=dt;const pause=/[，。！：\n]/.test(letterChars[letterPosition-1]||'')?90:24;if(letterClock>=pause){letterClock=0;letterPosition++;$('#typed-letter').textContent=letterChars.slice(0,letterPosition).join('');if(letterPosition>=letterChars.length)finishLetter();}}
if(!document.hidden&&now-balloonClock>850){balloonClock=now;spawnBalloon();}
drawFireworks(dt);updateEnding(dt);stage.dataset.progress=progress.toFixed(4);if(!gameEnded)requestAnimationFrame(tick);}
const memoryLetters=["走廊的光落在肩上，照片把这份安静留了下来。愿你在热闹的世界里，也有属于自己的从容。不必急着抵达每一个答案，慢慢走，沿途也会有好看的风景。新的一岁，愿你眼里常有光，心里常有余地。", "树影把阳光剪成细小的碎片，也把普通的一天照得很好看。愿你总能遇见这样的好天气：风不急，脚步不赶，心里有一点轻轻的期待。即使偶尔下雨，也愿你记得，晴朗会重新来到身边。", "海风遇见冬天，厚厚的外套里藏着一个明亮的笑容。愿新的一岁里，远方依然值得出发，身边也总有温暖可以停靠。冷的时候就把自己照顾好，快乐的时候，就像这一刻一样，大大方方地笑。", "竹林很安静，白裙和绿色一起，把这一页写得柔软。愿你始终保留一点自己的节奏，不被催促，也不用为慢下来感到抱歉。愿日子有清风，有闲暇，也有让你一想到便轻轻微笑的小事。", "这张照片里，笑声仿佛会沿着冰面传过来。愿你往后的旅程里，还有许多这样热闹又轻盈的瞬间。有人一起玩闹，有风从耳边经过，而你只需要尽情开心，把烦恼暂时留在远处。", "蓝天、冰面，还有扬起来的双脚，把冬天拍成了一个快乐的感叹号。愿你长大一岁，也不用收起这份孩子气。想玩的时候就去玩，想笑的时候就笑，让那些没有特别理由的快乐，也认真占据生活的一角。", "伸向天空的手，像是在跟明天打招呼。愿你始终有这样的勇气：对喜欢的事多走一步，对未知的风景多看一眼。世界很大，你可以慢慢探索；而每一次出发，都不必成为谁，只要更自在地做自己。", "山在身后铺开，手上的那一个赞，送给眼前的风景，也送给走到这里的你。愿你记得肯定自己的每一步，不只是在登顶的时候。累了可以歇一歇，路还很长，属于你的风景也会一程接一程地出现。", "夜色把城市的灯火映进水里，也让这一刻多了一点温柔。愿那些安静的夜晚，对你来说是休息和期待。把今天轻轻放下，好好睡一觉；明天醒来，愿有新的小小惊喜在等你。", "两个小小的手势，就能把一个普通瞬间变成值得收藏的合影。愿你的生活里，常有可以一起说笑的人，也有放心做自己的空间。愿相聚时的快乐，被好好记住，在以后翻到这张照片时，依然让嘴角上扬。", "桥边的花、河面的光，还有身后的钟，把这一天留在了照片里。时间一直往前走，但美好的片刻可以慢慢回看。愿未来的你再翻到这一页时，会喜欢当时的自己，也期待接下来还没写完的故事。", "一步又一步，平凡的坚持也值得被认真记下。愿你做喜欢的事时有力量，想休息的时候也能安心停下来。不必把每一天都过成比赛，照顾好身体和心情，本身就是一件很了不起的事。", "这么多人一起站进镜头，连照片都显得热闹起来。愿你在投入和分享中，收获自己的快乐，也遇见许多温暖的回应。那些一起完成事情、一起留下笑容的时刻，会成为日后想起时，心里亮一下的回忆。", "街角的风吹起头发，城市正在你身后继续它的故事。愿你往后的路，也有许多这样的转角：带着一点未知，和一点刚刚好的惊喜。不必赶着把所有风景看完，按自己的步调，去遇见更宽阔的生活。"];
const photoButtons=$$('[data-photo]');let selectedPhoto=0;
function displayPhoto(index){selectedPhoto=(index+photoButtons.length)%photoButtons.length;const img=photoButtons[selectedPhoto].querySelector('.picture');$('#large-photo').src=img.dataset.full||img.src;$('#large-photo').alt=img.alt;$('#memory-letter-title').textContent=img.alt;$('#memory-letter-body').textContent=memoryLetters[selectedPhoto];$('.memory-letter').getAnimations().forEach(a=>a.cancel());$('.memory-letter').animate([{opacity:0,transform:'translateX(-25px) rotateY(-12deg)'},{opacity:1,transform:'none'}],{duration:reduced.matches?0:650,easing:'ease-out'});$('#photo-caption').textContent=`${selectedPhoto+1} / ${photoButtons.length} · ${img.alt} · Esc 关闭`;}
photoButtons.forEach((button,index)=>button.onclick=()=>{displayPhoto(index);$('#lightbox').showModal();});
$('#close-photo').onclick=()=>$('#lightbox').close();$('#previous-photo').onclick=()=>displayPhoto(selectedPhoto-1);$('#next-photo').onclick=()=>displayPhoto(selectedPhoto+1);
$('#lightbox').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();displayPhoto(selectedPhoto+(e.key==='ArrowRight'?1:-1));}});
let photoTouchX=0;$('#lightbox').addEventListener('touchstart',e=>photoTouchX=e.touches[0].clientX,{passive:true});$('#lightbox').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-photoTouchX;if(Math.abs(dx)>50)displayPhoto(selectedPhoto+(dx<0?1:-1));},{passive:true});
$('.photos').addEventListener('wheel',e=>{if(e.ctrlKey)return;if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();$('.photos').scrollLeft+=e.deltaY*(e.deltaMode===1?16:1);}},{passive:false});
$('.photos').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();$('.photos').scrollBy({left:e.key==='ArrowRight'?320:-320,behavior:reduced.matches?'instant':'smooth'});}});

for(let i=0;i<26;i++){const mote=document.createElement('i');mote.style.cssText=`left:${8+i*37%88}%;top:${18+i*17%65}%;animation-delay:${-i*.7}s`;$('.scene-fireflies').append(mote);}

// Firework stages: carry-in, wish, darkness, launch, burst, title.
let cakePhase='arriving',fireworks=[],rockets=[],flashes=[],fireworkClock=0,celebrationTime=0,cakeClock=0,shellIndex=0,titleShown=false,arrivalStarted=0,surpriseShown=false;
const fireworksCanvas=$('#fireworks'),fireworksContext=fireworksCanvas.getContext('2d');
const fireworkColors=['#ffe4a0','#f7a2ed','#bca7ff','#87efff','#ffb7c9'];
const sparkSprites=fireworkColors.map(color=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'#fffbe9');r.addColorStop(.15,color);r.addColorStop(.45,color+'88');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,32,32);return c;});
function resetCake(){surpriseShown=false;$('.cake-surprise>p').textContent='惊喜，破壳而出！';$('#cake-scene').classList.remove('guest-enter','guest-blowing','cake-open','photo-flipped');$('#cake-scene').style.setProperty('--guest-breath','0');if(!(state==='scene'&&active===2))stopBlowListening();cakePhase=reduced.matches?'dressing':'arriving';fireworks=[];rockets=[];flashes=[];fireworkClock=0;celebrationTime=0;cakeClock=0;shellIndex=0;titleShown=false;arrivalStarted=performance.now();$('#cake-scene').dataset.phase=cakePhase;$('#cake-scene').classList.remove('nightfall','title-visible');$('#wish-candle').disabled=true;if(reduced.matches)$('#cake-scene').classList.add('guest-enter');$('#wish-candle').setAttribute('aria-label','吹气或点击烛光，吹灭蜡烛');$('#cake-instruction').textContent=reduced.matches?'点击烛光，许下你的愿望':'你的生日蛋糕，正在送来…';$('#birthday-finale').hidden=true;fireworksContext.clearRect(0,0,1600,900);}
$('#wish-candle').onclick=()=>{
 if(state!=='scene'||active!==2)return;
 if(cakePhase==='lit'||cakePhase==='wished'){beginBirthdayShow();}

};
let micSession=0,micStream=null,micContext=null,micSource=null,micAnalyser=null,micTimer=0,micFrame=0,micReady=false;
function stopBlowListening(){
 micReady=false;micSession++;clearTimeout(micTimer);cancelAnimationFrame(micFrame);
 if(micStream)micStream.getTracks().forEach(t=>t.stop());
 if(micSource)micSource.disconnect();
 if(micContext)micContext.close().catch(()=>{});
 micStream=micContext=micSource=micAnalyser=null;
 $('#wish-candle').style.removeProperty('--breath');
}
async function startBlowListening(){
 stopBlowListening();const session=micSession;
 const fallback=()=>{if(session!==micSession)return;stopBlowListening();if(active===2)$('#cake-instruction').textContent='麦克风未就绪，点击烛光也能吹灭蜡烛。';};
 $('#cake-instruction').textContent='许下愿望，允许麦克风后轻轻吹气。也可以再点一下烛光。';
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!navigator.mediaDevices?.getUserMedia||!Audio)throw new Error('Microphone unavailable');
  micContext=new Audio();micContext.resume().catch(fallback);
  micTimer=setTimeout(fallback,180000);
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false},video:false});
  if(session!==micSession){stream.getTracks().forEach(t=>t.stop());return;}
  micStream=stream;micSource=micContext.createMediaStreamSource(stream);
  micAnalyser=micContext.createAnalyser();micAnalyser.fftSize=2048;micAnalyser.smoothingTimeConstant=.2;micSource.connect(micAnalyser);
  stream.getAudioTracks().forEach(t=>t.addEventListener('ended',fallback,{once:true}));
  const samples=new Float32Array(2048),spectrum=new Float32Array(1024),detector=new BlowDetector();let last=performance.now(),ready=false,quietLevels=[];
  $('#cake-instruction').textContent='先安静一小会儿，把愿望藏在心里…';
  const sample=now=>{
   if(session!==micSession)return;
   if(now-last<30){micFrame=requestAnimationFrame(sample);return;}
   micAnalyser.getFloatTimeDomainData(samples);micAnalyser.getFloatFrequencyData(spectrum);
   const result=detector.update(samples,spectrum,micContext.sampleRate,Math.min(80,now-last));last=now;
   if(result.ready&&!ready){ready=true;micReady=true;if(active===2&&cakePhase==='lit')$('#cake-instruction').textContent='许好愿望，轻轻吹气吧。';}
   $('#wish-candle').style.setProperty('--breath',result.strength.toFixed(3));$('#cake-scene').style.setProperty('--guest-breath',cakePhase==='lit'?result.strength.toFixed(3):'0');
   if(!cuePlaying&&now<=cueQuietUntil){let power=0;for(const value of samples)power+=value*value;quietLevels.push(Math.sqrt(power/samples.length));const levels=[...quietLevels].sort((a,b)=>a-b);detector.floor=Math.max(.001,levels[Math.floor(levels.length*.3)]);}
   const canBlow=!cuePlaying&&now>cueQuietUntil&&state==='scene'&&active===2&&(cakePhase==='lit'||cakePhase==='wished');
   if(!canBlow)detector.hold=0;
   if(result.blown&&canBlow){$('#wish-candle').dataset.blowLevel=result.rms.toFixed(4);$('#wish-candle').dataset.blowThreshold=result.threshold.toFixed(4);beginBirthdayShow();return;}
   micFrame=requestAnimationFrame(sample);
  };micFrame=requestAnimationFrame(sample);
 }catch{fallback();}
}
addEventListener('pagehide',stopBlowListening);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopBlowListening();if(cakePhase==='wished')if(active===2)$('#cake-instruction').textContent='麦克风未就绪，点击烛光也能吹灭蜡烛。';}});

function beginBirthdayShow(){$('#cake-scene').classList.add('guest-blowing');stopBlowListening();restoreMusic();$('#wish-candle').disabled=true;cakePhase='darkening';cakeClock=0;celebrationTime=0;fireworkClock=800;shellIndex=0;titleShown=false;fireworks=[];rockets=[];flashes=[];$('#cake-scene').dataset.phase='darkening';$('#cake-scene').classList.add('nightfall');$('#cake-scene').classList.remove('title-visible');$('#birthday-finale').hidden=true;$('#cake-instruction').textContent='嘘——星光正在准备一个惊喜。';}
let lastSkyLaunch=0;
$('#cake-scene').addEventListener('pointerdown',e=>{if(cakePhase!=='celebrating'||!titleShown||reduced.matches||e.target.closest('button')||performance.now()-lastSkyLaunch<700)return;lastSkyLaunch=performance.now();const rect=$('#cake-scene').getBoundingClientRect();launchShell(clamp((e.clientX-rect.left)*1600/rect.width,160,1440),clamp((e.clientY-rect.top)*900/rect.height,110,480),shellIndex++%3,shellIndex%5);});
function launchShell(x,y,kind,color){if(rockets.length>=8)return;rockets.push({x,y,sx:x+(Math.random()-.5)*180,sy:930,age:0,duration:850+Math.random()*200,kind,color});}
function burstShell(s){const count=s.kind===2?170:135;const room=Math.max(0,1050-fireworks.length);for(let i=0;i<Math.min(count,room);i++){const a=2*Math.PI*i/count,ring=s.kind===1?(i%2?.56:1):(.62+Math.random()*.38),speed=(s.kind===2?230:290)*ring;fireworks.push({x:s.x,y:s.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,age:0,life:s.kind===2?3100+Math.random()*500:2100+Math.random()*650,color:s.kind===2?0:s.kind===1?i%2?s.color:(s.color+2)%5:s.color,willow:s.kind===2,trail:[],twinkle:Math.random()*6});}flashes.push({x:s.x,y:s.y,age:0,color:s.color});}
function revealBirthday(){titleShown=true;$('#birthday-finale').hidden=false;$('#cake-scene').classList.add('title-visible');$('#cake-instruction').textContent='让愿望在星光里盛放。';}
function drawFireworks(dt){
 if(state!=='scene'||active!==2||document.hidden)return;
 if(cakePhase==='arriving'){if(performance.now()-arrivalStarted>=4200){cakePhase='dressing';$('#cake-scene').dataset.phase='dressing';$('#cake-scene').classList.add('guest-enter');cakeClock=0;$('#cake-instruction').textContent='生日嘉宾登场，戴好小帽子…';}return;}
 if(cakePhase==='dressing'){cakeClock+=dt;if(cakeClock>=(reduced.matches?100:3200)){cakePhase='lit';$('#cake-scene').dataset.phase='lit';$('#wish-candle').disabled=false;playBlowCue();$('#cake-instruction').textContent=micReady?'许好愿望，轻轻吹气吧。':'允许麦克风后轻轻吹气，也可以点击烛光。';}return;}
 if(cakePhase==='darkening'){cakeClock+=dt;if(cakeClock>=1600){cakePhase='celebrating';$('#cake-scene').dataset.phase='celebrating';if(reduced.matches)revealBirthday();}return;}
 if(cakePhase!=='celebrating')return;
 if(celebrationTime>10000){$('#leave').hidden=false;$('#leave').textContent='飞往心愿终点 →';}
 if(celebrationTime>6400){$('#cake-scene').classList.add('photo-flipped');$('.cake-surprise>p').textContent='把快乐，留在我们这一页。';}
 const ctx=fireworksContext;ctx.clearRect(0,0,1600,900);celebrationTime+=dt;fireworkClock+=dt;if(!surpriseShown&&celebrationTime>=1400){surpriseShown=true;$('#cake-scene').classList.add('cake-open');$('#cake-instruction').textContent='愿新的一岁，总有惊喜破壳而出！';}
 if(!titleShown&&celebrationTime>700)revealBirthday();
 if(!reduced.matches&&celebrationTime<1400&&fireworkClock>(celebrationTime>14000?480:850)){fireworkClock=0;const places=[[330,240],[1260,210],[790,180],[440,340],[1180,320]];const pos=places[shellIndex%places.length];launchShell(pos[0],pos[1],shellIndex%3,shellIndex%5);if(shellIndex%4===3)launchShell(1600-pos[0],pos[1]-40,(shellIndex+1)%3,(shellIndex+2)%5);shellIndex++;}
 ctx.globalCompositeOperation='lighter';
 for(const r of rockets){r.age+=dt;const t=Math.min(r.age/r.duration,1),e=1-Math.pow(1-t,1.5),prev=1-Math.pow(1-Math.max(0,t-.11),1.5),x=r.sx+(r.x-r.sx)*e,y=r.sy+(r.y-r.sy)*e;ctx.strokeStyle=fireworkColors[r.color];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(r.sx+(r.x-r.sx)*prev,r.sy+(r.y-r.sy)*prev);ctx.lineTo(x,y);ctx.stroke();ctx.drawImage(sparkSprites[r.color],x-10,y-10,20,20);if(t===1)burstShell(r);}
 rockets=rockets.filter(r=>r.age<r.duration);
 for(const f of flashes){f.age+=dt;ctx.globalAlpha=Math.max(0,1-f.age/280)*.6;ctx.drawImage(sparkSprites[f.color],f.x-75,f.y-75,150,150);}flashes=flashes.filter(f=>f.age<280);
 for(const p of fireworks){p.age+=dt;p.trail.unshift([p.x,p.y]);if(p.trail.length>9)p.trail.pop();const drag=Math.exp(-dt/(p.willow?2200:1600));p.vx*=drag;p.vy=p.vy*drag+dt*(p.willow?.047:.032);p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;const fade=Math.max(0,1-p.age/p.life);ctx.globalAlpha=fade*(p.age>p.life*.6?.65+.35*Math.sin(p.age*.035+p.twinkle):1);ctx.strokeStyle=fireworkColors[p.color];ctx.lineWidth=p.willow?1.6:2;ctx.beginPath();const tail=p.trail[p.trail.length-1];ctx.moveTo(tail[0],tail[1]);for(let j=p.trail.length-2;j>=0;j--)ctx.lineTo(...p.trail[j]);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.drawImage(sparkSprites[p.color],p.x-5,p.y-5,10,10);}
 fireworks=fireworks.filter(p=>p.age<p.life);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}

function updateEnding(dt){
 if(document.hidden||gameEnded)return;
 if(state==='scene'&&active===3&&!closingStarted){finaleClock+=dt;if(finaleClock>=16000){closingStarted=true;closingClock=0;state='ending';$('#exam-ending').hidden=false;$('#exam-ending').classList.add('blackout');stage.inert=true;fadeMusicTo(.08,1800);}}
 if(!closingStarted)return;
 closingClock+=dt;
 if(closingClock>=1500)$('#exam-ending').classList.add('impact');
 if(closingClock>=6500){gameEnded=true;cancelAnimationFrame(audioFade);bgMusic.pause();bgMusic.volume=0;stopBlowListening();$('#exam-ending').classList.add('settled');document.body.classList.add('journey-ended');}
}

let balloonIndex=0,balloonClock=0;
function spawnBalloon(){if(document.hidden||$('#letter-reader').open||state==='scene'||state==='entering'||state==='exiting'||$('#balloons').children.length>=10)return;const i=balloonIndex++;const b=document.createElement('div');b.className='birthday-balloon';b.style.cssText=`--delay:0s;--balloon-color:${['#f48bc0','#b89af8','#72dce2','#f5ca77'][i%4]};left:${[80,1410,260,1210,430,1030,170,1320,530,920][i%10]}px`;b.innerHTML=`<div class="balloon-body">${['生','日','快','乐'][i%4]}</div><svg viewBox="0 0 50 180"><path d="M25 0 C-5 40 55 70 25 105 S5 150 25 180"/></svg>`;b.addEventListener('animationend',e=>{if(e.animationName==='balloon-rise')b.remove();});$('#balloons').append(b);}
function launchBalloons(){$('#balloons').replaceChildren();balloonIndex=0;balloonClock=0;spawnBalloon();}
launchBalloons();sync();requestAnimationFrame(tick);
})();


