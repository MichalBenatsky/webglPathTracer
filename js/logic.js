import {pathTraceFS} from "./shaders/pathTraceFS.js";
import {passThroughVS} from "./shaders/passThroughVS.js";
import {passThroughDivideFS} from "./shaders/passThroughDivideFS.js";

// full screen triangle geometry
let geometry = new THREE.Geometry();
geometry.vertices= [new THREE.Vector3(-1,-1,0), new THREE.Vector3(3,-1,0), new THREE.Vector3(-1,3,0)]; 
geometry.faces = [new THREE.Face3(0,1,2)];

let screenWidth = window.innerWidth * 1;
let screenHeight = window.innerHeight * 1;

let scenePathTrace = new THREE.Scene();
let bufferTexture = new THREE.WebGLRenderTarget( screenWidth, screenHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat ,type:THREE.FloatType });

let uniformsPathTrace = {
  lowerLeftCorner: {type: 'vec3', value: new THREE.Vector3(-1, -1, -1)},
  horizontal: {type: 'vec3', value: new THREE.Vector3(2, 0, 0)},
  vertical: {type: 'vec3', value: new THREE.Vector3(0, 2, 0)},
  origin: {type: 'vec3', value: new THREE.Vector3(0, 0, 1)},
  ratio: {value: 0.5},
  corner: {value: -0.5},
  iteration: {value: 0},
  random: {type: 'vec3', value: new THREE.Vector3(0, 0, 0)},
  screenSizeInv: {type: 'vec2', value: new THREE.Vector2(1.0 / screenWidth, 1.0 / screenHeight)}
}

uniformsPathTrace.ratio.value = screenWidth / screenHeight;

let pathTraceMaterial =  new THREE.ShaderMaterial({
  uniforms: uniformsPathTrace,
  vertexShader: passThroughVS(),
  fragmentShader: pathTraceFS(),
});
pathTraceMaterial.blending = THREE.AdditiveBlending;

let planePathTrace = new THREE.Mesh(geometry, pathTraceMaterial);
scenePathTrace.add(planePathTrace);

// **********

let uniforms = {
  map: { value: bufferTexture.texture } ,
  numSamples: {value: 1.0}
}

let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
let renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize( screenWidth, screenHeight);
renderer.autoClear = false;

document.body.appendChild( renderer.domElement );

let mouseDown = false;
let mousePos = 0;
let cameraPos = 0;
let cameraChange = 0;
renderer.domElement.addEventListener('mousedown', e => 
{
  mouseDown = true;
  mousePos = new THREE.Vector2(e.clientX, e.clientY);
});

renderer.domElement.addEventListener('mousemove', e => 
{
  if (mouseDown == true) 
  {
    cameraChange = (mousePos.x - e.clientX) * .01;
    mousePos = new THREE.Vector2(e.clientX, e.clientY); 
  }
});

renderer.domElement.addEventListener('mouseup', e => 
{
  mouseDown = false;
  cameraChange = 0;
});

let material =  new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: passThroughVS(),
    fragmentShader: passThroughDivideFS(),
  })

let plane = new THREE.Mesh( geometry, material);
let scene = new THREE.Scene();
scene.add( plane );


// lowerLeftCorner: {type: 'vec3', value: new THREE.Vector3(-1, -1, -1)},
// horizontal: {type: 'vec3', value: new THREE.Vector3(2, 0, 0)},
// vertical: {type: 'vec3', value: new THREE.Vector3(0, 2, 0)},
// origin: {type: 'vec3', value: new THREE.Vector3(0, 0, 1)},
// *****************************
function updateCamera(origin, lookat, vup, vfov, aspect, shaderValues) 
{
  const PI = 3.1415926;
  // vfov is top to bottom in degrees
  let u, v, w;
  let theta = vfov*PI/180;
  let half_height = Math.tan(theta/2);
  let half_width = aspect * half_height;
  w = (origin.clone().sub(lookat)).normalize();  // unit_vector(lookfrom - lookat);
  u = (vup.clone().cross(w)).normalize(); //    unit_vector(cross(vup, w));
  v = w.clone().cross(u); //  cross(w, u);
  //let lower_left_corner = origin.clone().sub((u.clone().multiplyScalar(half_width)).sub(v.clone().multiplyScalar(half_height)).sub(w)); //     origin - half_width*u - half_height*v - w;
  let horizontalHalf =  u.clone().multiplyScalar(half_width);
  let verticalHalf = v.clone().multiplyScalar(half_height);
  
  let horizontal = horizontalHalf.clone().multiplyScalar(2.0);
  let vertical = verticalHalf.clone().multiplyScalar(2.0);

  let lower_left_corner = origin.clone().sub(horizontalHalf).sub(verticalHalf).sub(w);

  shaderValues.origin.value = origin;
  shaderValues.lowerLeftCorner.value = lower_left_corner;
  shaderValues.horizontal.value = horizontal;
  shaderValues.vertical.value = vertical;
}

let numSamples = 0.0;
let oldTime = 0;
function animate(timestamp) 
{
  let delta = timestamp - oldTime;
  oldTime = timestamp
  
  numSamples = numSamples + 1.0;
  planePathTrace.material.uniforms.iteration.value = numSamples;
  planePathTrace.material.uniforms.random.value = new THREE.Vector3(Math.random(), Math.random(), Math.random());

  cameraPos = cameraPos + cameraChange;
  let target = new THREE.Vector3(0,0.0,-1);
  let dist = 2;
  let cameraPosition = target.clone().add(new THREE.Vector3(Math.sin(cameraPos)*dist,0.3,Math.cos(cameraPos)*dist));
  updateCamera(cameraPosition, target, new THREE.Vector3(0,1,0), 100.0, screenWidth / screenHeight, planePathTrace.material.uniforms);

  renderer.setRenderTarget(bufferTexture);
  //renderer.clear();
  if (Math.abs(cameraChange) > 0.00001)
  {
    renderer.clear();
    numSamples = 1;
    cameraChange = 0;
  }

  renderer.render(scenePathTrace, camera);

  material.uniforms.numSamples.value = numSamples;
  renderer.setRenderTarget(null);
  renderer.render( scene, camera );
  requestAnimationFrame( animate );

}
requestAnimationFrame( animate );