/* Local breath heuristic: calibrated energy + broadband sound + sustained duration.
   No recording or transmission. Loud broadband noise can also trigger it. */
class BlowDetector {
 constructor(){this.elapsed=0;this.baseline=[];this.floor=.004;this.hold=0;}
 update(samples,spectrum,sampleRate,dt){
  let energy=0;for(const x of samples)energy+=x*x;
  const rms=Math.sqrt(energy/samples.length);this.elapsed+=dt;
  if(this.elapsed<400){this.baseline.push(rms);return {ready:false,strength:0,blown:false};}
  if(this.baseline.length){const sorted=this.baseline.sort((a,b)=>a-b);this.floor=Math.max(.001,sorted[Math.floor(sorted.length*.2)]);this.baseline=[];}
  let total=0,low=0,peak=0;
  const binHz=sampleRate/(spectrum.length*2);
  for(let i=Math.max(1,Math.floor(40/binHz));i<Math.min(spectrum.length,Math.ceil(4000/binHz));i++){
   const power=10**(spectrum[i]/10);total+=power;peak=Math.max(peak,power);if(i*binHz<650)low+=power;
  }
  const threshold=Math.max(.006,this.floor*2.1);
  // Accept low-frequency wind OR distributed noise; avoid a single tonal spike.
  const distributed=total>0&&peak/total<.65;
  const candidate=rms>threshold&&distributed&&(low/total>.18||rms>threshold*1.25);
  this.hold=candidate?this.hold+dt:Math.max(0,this.hold-dt*1.5);
  if(rms<threshold*.65)this.floor=this.floor*.995+rms*.005;
  return {ready:true,rms,threshold,strength:candidate?Math.min(1,rms/threshold*.55):Math.min(.25,rms/threshold*.15),blown:this.hold>=180};
 }
}
if(typeof module!=='undefined')module.exports=BlowDetector;
