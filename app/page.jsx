 "use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Home() {
  const mountRef = useRef(null);
  const gameRef = useRef(null);
  const [status, setStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    try { setBest(Number(localStorage.getItem("sailu-run-best") || 0)); } catch {}
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x91d8ff);
    scene.fog = new THREE.Fog(0x91d8ff, 24, 85);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 150);
    camera.position.set(0, 5.2, 10.5);
    camera.lookAt(0, 1, -4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6b7b9c, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(-5, 12, 8);
    sun.castShadow = true;
    scene.add(sun);

    const mat = (color, roughness=0.7, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const roadMat = mat(0x30394f);
    const lineMat = mat(0xffffff);
    const grassMat = mat(0x56b86b);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd43b, metalness: 0.75, roughness: 0.22, emissive: 0x8a5100, emissiveIntensity: 0.22 });
    const obstacleMat = mat(0xf05b55);
    const darkMat = mat(0x25324b);
    const skinMat = mat(0xb77b63, 0.62);
    const accentMat = mat(0x7c5cff, 0.35, 0.12);
    const whiteMat = mat(0xffffff, 0.3);
    const eyeMat = mat(0x172033, 0.2);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), grassMat);
    floor.rotation.x = -Math.PI/2; floor.position.y = -0.12; floor.position.z = -35; floor.receiveShadow = true; scene.add(floor);
    const road = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.18, 100), roadMat);
    road.position.set(0, -0.02, -38); road.receiveShadow = true; scene.add(road);

    const laneMarks = [];
    for (const x of [-1.42, 1.42]) {
      for (let i=0;i<14;i++) {
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.025, 2.3), lineMat);
        mark.position.set(x, 0.09, 8 - i*7.2); scene.add(mark); laneMarks.push(mark);
      }
    }
    const sideDecor = [];
    for (let i=0;i<24;i++) {
      for (const side of [-1,1]) {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.18,1.1,7), mat(0x875532));
        trunk.position.y=0.55; trunk.castShadow=true; group.add(trunk);
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72,1), mat(i%2?0x168f73:0x26a66d));
        crown.position.y=1.55; crown.scale.y=1.15; crown.castShadow=true; group.add(crown);
        group.position.set(side*(6.4 + Math.random()*2),0,8-i*5.2);
        scene.add(group); sideDecor.push(group);
      }
    }

    // A friendly original 3D robot runner made from simple geometric parts.
    const player = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.43,0.65,5,10), accentMat);
    torso.position.y=1.35; torso.castShadow=true; player.add(torso);
    
const faceTexture = new THREE.TextureLoader().load("/sailu-face.png");
faceTexture.colorSpace = THREE.SRGBColorSpace;

const faceMaterial = new THREE.MeshBasicMaterial({
  map: faceTexture,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
});

const face = new THREE.Mesh(
  new THREE.PlaneGeometry(0.95, 1.15),
  faceMaterial
);

face.position.set(0, 2.38, 0.8);
   face.rotation.x = -0.25;
player.add(face);
   
    const arms=[], legs=[];
    for (const x of [-0.52,0.52]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13,0.42,4,8), skinMat);
      arm.position.set(x,1.35,0); arm.rotation.z=x<0?-0.25:0.25; arm.castShadow=true; player.add(arm); arms.push(arm);
    }
    for (const x of [-0.23,0.23]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15,0.48,4,8), darkMat);
      leg.position.set(x,0.48,0); leg.castShadow=true; player.add(leg); legs.push(leg);
    }
    player.position.set(0,0,3.2); scene.add(player);

    const objects=[];
    const makeObstacle=(lane,z)=>{
      const g=new THREE.Group();
      const base=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.95,0.72), obstacleMat);
      base.position.y=0.52; base.castShadow=true; g.add(base);
      const stripe=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.15,0.76), whiteMat);
      stripe.position.y=0.62; g.add(stripe);
      g.position.set((lane-1)*2.25,0,z); scene.add(g);
      objects.push({group:g,type:"obstacle",lane,hit:false});
    };
    const makeCoin=(lane,z)=>{
      const c=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.11,10,22),coinMat);
      c.position.set((lane-1)*2.25,1.35,z); c.castShadow=true; scene.add(c);
      objects.push({group:c,type:"coin",lane,hit:false});
    };

    let running=false, ended=false, lane=1, jumpY=0, jumpV=0, speed=15, elapsed=0, points=0, spawn=0, last=0, animation=0;
    let audioCtx=null;
    const beep=(freq=620,duration=0.08)=>{
      if(!sound) return;
      try {
        audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
        const o=audioCtx.createOscillator(), gain=audioCtx.createGain();
        o.frequency.value=freq; o.type="sine"; gain.gain.setValueAtTime(0.07,audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+duration);
        o.connect(gain); gain.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+duration);
      } catch {}
    };
    const start=()=>{
      objects.forEach(o=>scene.remove(o.group)); objects.length=0;
      lane=1; jumpY=0; jumpV=0; speed=15; elapsed=0; points=0; spawn=0.8; running=true; ended=false;
      player.position.x=0; player.position.y=0;
      setScore(0); setStatus("playing");
    };
    const move=(d)=>{ if(!running) return; lane=Math.max(0,Math.min(2,lane+d)); beep(380,0.045); };
    const jump=()=>{ if(!running) return; if(jumpY<=0.02){jumpV=8.8;beep(740,0.07);} };
    const finish=()=>{
      running=false; ended=true; setStatus("over"); beep(170,0.25);
      const final=Math.floor(points);
      setScore(final);
      try { const old=Number(localStorage.getItem("sailu-run-best")||0); if(final>old){localStorage.setItem("sailu-run-best",String(final));setBest(final);} } catch {}
    };
    const key=(e)=>{
      if(["ArrowLeft","ArrowRight","ArrowUp"," ","a","d","w"].includes(e.key)) e.preventDefault();
      if(e.key==="ArrowLeft"||e.key==="a") move(-1);
      if(e.key==="ArrowRight"||e.key==="d") move(1);
      if(e.key==="ArrowUp"||e.key==="w"||e.key===" ") jump();
      if(e.key==="Enter" && !running) start();
    };
    window.addEventListener("keydown",key);
    let touchX=null,touchY=null;
    const touchStart=e=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY;};
    const touchEnd=e=>{
      if(touchX===null)return;
      const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;
      if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>25) move(dx>0?1:-1);
      else if(dy < -20 || Math.abs(dx)<25) jump();
      touchX=null;touchY=null;
    };
    renderer.domElement.addEventListener("touchstart",touchStart,{passive:true});
    renderer.domElement.addEventListener("touchend",touchEnd,{passive:true});

    const resize=()=>{
      const w=mount.clientWidth,h=mount.clientHeight;
      if(!w||!h)return;
      camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false);
    };
    const ro=new ResizeObserver(resize); ro.observe(mount); resize();

    const clock=new THREE.Clock();
    const tick=()=>{
      animation=requestAnimationFrame(tick);
      const dt=Math.min(clock.getDelta(),0.04);
      if(running){
        elapsed+=dt; speed=Math.min(29,15+elapsed*0.34); points+=dt*(10+speed*0.35);
        setScore(Math.floor(points));
        player.position.x=THREE.MathUtils.damp(player.position.x,(lane-1)*2.25,12,dt);
        player.position.y=jumpY;
        jumpV-=22*dt; jumpY=Math.max(0,jumpY+jumpV*dt); if(jumpY===0)jumpV=0;
        player.position.y=jumpY;
        player.rotation.z=THREE.MathUtils.damp(player.rotation.z,(lane-1)*-0.08,8,dt);
        const run=Math.sin(elapsed*speed*0.42);
        legs[0].rotation.x=run*0.75; legs[1].rotation.x=-run*0.75;
        arms[0].rotation.x=-run*0.55; arms[1].rotation.x=run*0.55;
        player.position.y+=Math.abs(run)*0.035;
        spawn-=dt;
        if(spawn<=0){
          const l=Math.floor(Math.random()*3);
          if(Math.random()<0.65) makeObstacle(l,-62);
          else makeCoin(l,-62);
          if(Math.random()<0.42) makeCoin((l+1+Math.floor(Math.random()*2))%3,-68);
          spawn=Math.max(0.48,1.12-(speed-15)*0.025)+Math.random()*0.35;
        }
        for(const mark of laneMarks){mark.position.z+=speed*dt;if(mark.position.z>12)mark.position.z-=100;}
        for(const deco of sideDecor){deco.position.z+=speed*dt*0.8;if(deco.position.z>12)deco.position.z-=125;}
        for(let i=objects.length-1;i>=0;i--){
          const o=objects[i]; o.group.position.z+=speed*dt;
          if(o.type==="coin") o.group.rotation.y+=dt*3.5;
          if(!o.hit && Math.abs(o.group.position.z-player.position.z)<0.85 && Math.abs(o.group.position.x-player.position.x)<0.9){
            if(o.type==="coin"){o.hit=true;points+=50;scene.remove(o.group);objects.splice(i,1);beep(980,0.08);continue;}
            if(jumpY<0.8){finish();break;}
          }
          if(o.group.position.z>12){scene.remove(o.group);objects.splice(i,1);}
        }
      } else {
        player.position.y= Math.sin(clock.elapsedTime*2)*0.06;
        player.rotation.y=Math.sin(clock.elapsedTime)*0.08;
      }
      camera.position.x=THREE.MathUtils.damp(camera.position.x,player.position.x*0.12,2,dt);
      camera.lookAt(0,1.2,-4);
      renderer.render(scene,camera);
    };
    tick();

    gameRef.current={start,move,jump};
    return ()=>{
      cancelAnimationFrame(animation); ro.disconnect(); window.removeEventListener("keydown",key);
      renderer.domElement.removeEventListener("touchstart",touchStart); renderer.domElement.removeEventListener("touchend",touchEnd);
      renderer.dispose(); if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement);
      scene.traverse(o=>{if(o.geometry)o.geometry.dispose();});
    };
  }, [sound]);

  const startGame=()=>gameRef.current?.start();
  return (
    <main className="shell">
      <header className="topbar"><a className="brand" href="#">SAILU<span>RUN</span></a><div className="top-right"><span className="live-dot"/> 3D ENDLESS RUNNER</div></header>
      <section className="game-wrap">
        <div className="hud"><div><small>SCORE</small><strong>{score.toString().padStart(4,"0")}</strong></div><div className="best"><small>BEST</small><strong>{best.toString().padStart(4,"0")}</strong></div></div>
        <div className="scene" ref={mountRef}>
          {status!=="playing" && <div className="overlay">
            <div className="eyebrow">{status==="ready"?"READY, RUNNER?":"RUN OVER"}</div>
            <h1>{status==="ready"?"DODGE. JUMP. RUN.":"NICE TRY!"}</h1>
            <p>{status==="ready"?"Swipe to switch lanes. Swipe up or tap to jump.":"You scored "+score+" points. Can you beat your best?"}</p>
            <button className="play" onClick={startGame}>{status==="ready"?"START RUN":"RUN AGAIN"} <span>→</span></button>
          </div>}
          <div className="scene-label">WORLD 01 <b>•</b> NEON VALLEY</div>
        </div>
        <div className="controls"><button onClick={()=>gameRef.current?.move(-1)} aria-label="Move left">←</button><button className="jump" onClick={()=>gameRef.current?.jump()}>JUMP</button><button onClick={()=>gameRef.current?.move(1)} aria-label="Move right">→</button></div>
      </section>
      <footer><span>MADE TO KEEP YOU MOVING</span><button className="sound" onClick={()=>setSound(v=>!v)}>{sound?"♪ SOUND ON":"♪ SOUND OFF"}</button><span>© SAILU RUN</span></footer>
    </main>
  );
}
