import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  W,
  H,
  TAU,
  host,
  renderer,
  scene,
  camera,
  target,
  view,
  initialView,
  updateCamera,
  world,
  yaw0,
  right,
  near,
  pos,
  rnd,
  random,
  mat,
  glowMat,
  silver,
  white,
  black,
  glass,
  tubeGlass,
  cyan,
  blue,
  violet,
  clickable,
  animated,
  labels,
  mesh,
  box,
  sphere,
  cyl,
  line,
  beam,
  ring,
  textureCanvas,
  rr,
  pool,
  softGlow,
  textSprite,
  label,
  groupAt,
  levels,
} from "../core.js";
import { register, capture } from "../registry.js";
import { tree } from "./city.js";
export let earth, earthMat, atmo;
export function createEarth() {
  return capture(
    "world.earth",
    {
      name: "现实世界 · 地球",
      category: "世界环境",
      source: "components/earth.js",
      rect: [158, 862, 1217, 162],
      shader: true,
    },
    () => {
      // The Earth uses deterministic spherical noise for ocean, terrain, cloud wisps and city light.
      earthMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec3 vLocal;varying vec3 vNormal;varying vec3 vView;void main(){vLocal=position;vNormal=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `
precision highp float;varying vec3 vLocal;varying vec3 vNormal;varying vec3 vView;uniform float uTime;
float hash(vec3 p){p=fract(p*.3183099+vec3(.13,.17,.19));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<6;i++){v+=a*noise(p);p=p*2.09+vec3(4.5,6.2,8.1);a*=.5;}return v;}
void main(){vec3 p=normalize(vLocal);float landBase=fbm(p*4.4+vec3(8.4,1.7,2.8));float land=smoothstep(.46,.52,landBase);float detail=fbm(p*170.);float ridge=fbm(p*52.);vec3 ocean=mix(vec3(.007,.022,.052),vec3(.028,.070,.125),detail);vec3 terrain=mix(vec3(.045,.06,.085),vec3(.14,.155,.18),ridge)*(.6+detail*.8);vec3 color=mix(ocean,terrain,land);float coast=1.-smoothstep(.004,.025,abs(landBase-.489));color+=coast*vec3(.025,.07,.11);float cloudNoise=fbm(p*28.+vec3(sin(p.y*32.)*.65,0.,0.));float cloud=smoothstep(.53,.73,cloudNoise)*.45;color=mix(color,vec3(.39,.47,.59),cloud);float city=pow(noise(p*1450.),20.)*smoothstep(.48,.59,landBase);float region=smoothstep(.48,.62,fbm(p*36.));color*=.56;color+=city*region*vec3(1.,.65,.23)*2.7;float fresnel=pow(1.-max(dot(normalize(vNormal),normalize(vView)),0.),3.5);color+=fresnel*vec3(.018,.055,.12);gl_FragColor=vec4(color,1.);}`,
      });
      earth = sphere(17.35, earthMat, pos(0, -18.87, -3), scene);
      earth.geometry.dispose();
      earth.geometry = new THREE.SphereGeometry(17.35, 160, 100);
      const atmosphere = new THREE.ShaderMaterial({
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),5.);gl_FragColor=vec4(.22,.48,1.,f*.28);}`,
      });
      atmo = sphere(17.43, atmosphere, earth.position, scene);
      atmo.geometry.dispose();
      atmo.geometry = new THREE.SphereGeometry(17.43, 100, 64);
      // A continuous radial falloff extends the atmosphere beyond the geometric limb.
      // It is behind the opaque planet, so there is no second hard horizon line.
      const haloMap = textureCanvas(1024, 1024, (c, w, h) => {
        const halo = c.createRadialGradient(
          w / 2,
          h / 2,
          w * 0.46,
          w / 2,
          h / 2,
          w * 0.5,
        );
        halo.addColorStop(0, "#609feb00");
        halo.addColorStop(0.32, "#98c4ff55");
        halo.addColorStop(0.5, "#71a7e732");
        halo.addColorStop(0.73, "#558ae618");
        halo.addColorStop(1, "#436bba00");
        c.fillStyle = halo;
        c.fillRect(0, 0, w, h);
      });
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloMap,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.7,
        }),
      );
      halo.name = "soft-atmosphere-glow";
      halo.scale.setScalar(36.6);
      halo.position
        .copy(earth.position)
        .addScaledVector(
          new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion),
          -1,
        );
      scene.add(halo);
      // Tiny structures on the curved real-world surface make its scale legible.
      const surfaceCity = new THREE.Group();
      scene.add(surfaceCity);
      const earthUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
          camera.quaternion,
        ),
        earthForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
          camera.quaternion,
        );
      const earthTowerMat = mat(0x31424e, { roughness: 0.7, metalness: 0.15 });
      for (let i = 0; i < 115; i++) {
        const x = (random() - 0.5) * 15.8,
          f = 1.1 + random() * 5.7;
        const u = Math.sqrt(17.35 * 17.35 - x * x - f * f);
        const p = earth.position
          .clone()
          .addScaledVector(right, x)
          .addScaledVector(earthUp, u)
          .addScaledVector(earthForward, f);
        const normal = p.clone().sub(earth.position).normalize();
        const g = new THREE.Group();
        g.position.copy(p);
        g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        surfaceCity.add(g);
        if (i % 3 === 0) {
          const h = 0.055 + random() * 0.17;
          const o = mesh(
            new THREE.BoxGeometry(
              0.03 + random() * 0.06,
              h,
              0.04 + random() * 0.07,
            ),
            earthTowerMat,
            g,
          );
          o.position.y = h / 2;
        } else {
          tree(g, 0, 0, 0, 0.2 + random() * 0.23);
        }
        if (i % 4 === 0)
          sphere(
            0.013,
            glowMat(0xe9b55b, 1.2),
            new THREE.Vector3(0.07, 0.01, 0.02),
            g,
          );
      }
    },
  );
}
