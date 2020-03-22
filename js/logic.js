
function vertexShader() {
    return `
      varying vec3 vUv; 
  
      void main() {
        vUv = position * .5 + .5; 
  
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition; 
        gl_Position = vec4(position, 1); 
      }
    `
  }

  function fragmentShader() {
    return `
    
    uniform vec3 lowerLeftCorner;
    uniform vec3 horizontal;
    uniform vec3 vertical;
    uniform vec3 origin;
    uniform vec3 random;
    uniform float ratio;
    uniform float corner;
    uniform int iteration;
    
    varying vec3 vUv;

    struct Ray
    {
      vec3 dir;
      vec3 origin;
    };

    struct Sphere
    {
      vec3 center;
      float radius;
      vec3 color;
      int mat;
    };

    struct HitRecord
    {
      float t;
      vec3 p;
      vec3 normal;
      vec3 albedo;
      int mat;
    };

    bool hitSphere(Sphere s, Ray r, out HitRecord rec) 
    {
      vec3 oc = r.origin - s.center;
      float a = dot(r.dir, r.dir);
      float b = dot(oc, r.dir);
      float c = dot(oc, oc) - s.radius*s.radius;
      float discriminant = b*b - a*c;
      if (discriminant > 0.0) {
          float temp = (-b - sqrt(discriminant))/a;
          if (temp < 0.0) 
            return false;
          rec.t = temp;
          rec.p = r.origin + r.dir * rec.t;
          rec.normal = (rec.p - s.center) / s.radius;
          rec.albedo = s.color;
          rec.mat = s.mat;
          return true;
      }
      return false;
    }

    bool hitWorld(Ray r, out HitRecord rec)
    {
      const int objCnt = 5;
      Sphere objects[objCnt];
      objects[0] = Sphere(vec3(0.0, 0.4, -1.0), .8, vec3(1., 1., 1.0), 1);
      objects[1] = Sphere(vec3(0.0,-100.5,-1.0), 100.1, vec3(1.0, 1.0, 1.0), 1);
      objects[2] = Sphere(vec3(sin(corner), -.1, cos(corner) - 1.0), 0.3, vec3(1.0, 1.0, 0.0), 0);
      objects[3] = Sphere(vec3(1.0, 0.0, -0.5), 0.3, vec3(1.0, 1.0, 1.0), 0);
      objects[4] = Sphere(vec3(-1.0, 0.7, -0.5), 0.3, vec3(1.0, 0.5, 0.0) * 5.0, 1);

      
      //objects[2] = Sphere(vec3(0.7, 0.2, cos(corner+3.14 * .3) - 1.0), 0.15, vec3(1.0, 1.0, .0) * 2.0, 2);

      bool hit = false;
      rec.t = 1000000.0;
      for (int i = 0; i < objCnt; ++i)
      {
        HitRecord thisHit;
        bool wasHit = hitSphere(objects[i], r, thisHit);
        if (wasHit && thisHit.t < rec.t)
        {
          hit = true;
          rec = thisHit;
        }
      }

      return hit;
    }

    float rand(float n){return fract(sin(n) * 43758.5453123);}
    vec2 hash2( vec2 p )
    {
      return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
    }

    vec3 randomPointOnSphere(int it)
    {
      vec2 hash = hash2(vUv.xy * random.xy);
      
      float theta = hash.x * 3.14 * 2.0;
      float phi = acos(2.0 * hash.y - 1.0);
      float sinTheta = sin(theta);
      float cosTheta = cos(theta);
      float sinPhi = sin(phi);
      float cosPhi = cos(phi);

      vec3 p = vec3(sinPhi * cosTheta, cosPhi, sinPhi * sinTheta);

      return p;
    }

    Ray material(int mat, Ray r, HitRecord rec, int it, out bool stopTrace)
    {
      stopTrace = false;
      Ray rOut;
      rOut.origin = rec.p;
      if (mat == 0)
      {
        rOut.dir = r.dir - 2.0 * dot(r.dir,rec.normal) * rec.normal;
      }
      else if(mat == 1) // else its difuse ... heh
      {
        vec3 target = rec.p + normalize(rec.normal) + randomPointOnSphere(it);
        rOut.dir = normalize(target - rec.p);
      }
      else // Its light source
      {
        stopTrace = true;
      }
      
      rOut.origin += rOut.dir * 0.0001;
      return rOut;
    }

    vec3 color(Ray r, int it) {

      vec3 lightDecay = vec3(1.0, 1.0, 1.0);
      for (int i = 0; i < 20; ++i)
      {
        HitRecord rec;
        if (hitWorld(r, rec))
        {
          bool stopTrace;
          r = material(rec.mat, r, rec, it, stopTrace);
          if (stopTrace)
          {
            return lightDecay * rec.albedo;
          }

          lightDecay *= 0.7 * rec.albedo;
        }
        else
          continue;
      }

      vec3 unit_direction = r.dir;
      float t = 0.5*(unit_direction.y + 1.0);
      return lightDecay * ((1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0));
    }

    void main() {
      gl_FragColor = vec4(0.0,1.0, 1.0, 1.0);

      //vec3 lowerLeftCorner = vec3(-1.0 * ratio, -1.0, -1.0);
      //vec3 horizontal = vec3(2.0 * ratio, 0.0, 0.0);
      //vec3 vertical = vec3(0.0, 2.0, 0.0);
      //vec3 origin = vec3(0.0, 0.0, 1.0);

      vec3 dir = (lowerLeftCorner + vUv.x*horizontal + vUv.y*vertical) - origin;
      Ray r;
      r.dir = normalize(dir);
      r.origin = origin;

      const int NUM_SAMPLES = 1;
      vec3 col = vec3(0.0, 0.0, 0.0);
      for (int i = 0; i < NUM_SAMPLES; ++i)
      {
        col += color(r, i + iteration * NUM_SAMPLES);
      }
      col *= 1.0/float(NUM_SAMPLES);

      gl_FragColor = vec4(col, 1.0);
    }
`
}

function fragmentShaderToScreen() {
  return `

  varying vec3 vUv;

  uniform sampler2D map;
  uniform float numSamples;
  

  void main() {

    vec3 textureColor = vec3(texture2D(map, vUv.xy).rgb); 

    gl_FragColor = vec4(textureColor / numSamples, 1.0);
  }
  `
}

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
  random: {type: 'vec3', value: new THREE.Vector3(0, 0, 0)}
}

uniformsPathTrace.ratio.value = screenWidth / screenHeight;

let pathTraceMaterial =  new THREE.ShaderMaterial({
  uniforms: uniformsPathTrace,
  vertexShader: vertexShader(),
  fragmentShader: fragmentShader(),
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

let material =  new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderToScreen(),
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
  
  //let lower_left_corner = new THREE.Vector3(-1,-1,-1); 
  let lower_left_corner = origin.clone().sub(horizontalHalf).sub(verticalHalf).sub(w);
 // lower_left_corner.lerp(new THREE.Vector3(-1,-1,-1), 0.5);
 //lower_left_corner.z = -1;

  console.log(origin.clone().sub(lookat));
  console.log({theta, half_height, half_width, horizontalHalf, verticalHalf, origin, lower_left_corner, horizontal, vertical, w, u, v});

  shaderValues.origin.value = origin;
  shaderValues.lowerLeftCorner.value = lower_left_corner;
  shaderValues.horizontal.value = horizontal;
  shaderValues.vertical.value = vertical;
}
//
updateCamera(new THREE.Vector3(0,1,1),new THREE.Vector3(0,0.0,-1),new THREE.Vector3(0,1,0), 90.0, screenWidth / screenHeight, planePathTrace.material.uniforms);


let iteration = 0;
let numSamples = 0.0;
let oldTime = 0;
function animate(timestamp) 
{
  let delta = timestamp - oldTime;
  oldTime = timestamp
  
  numSamples = numSamples + 1.0;
  //planePathTrace.material.uniforms.corner.value = Math.sin(timestamp * .0005) * 1.5;
  planePathTrace.material.uniforms.iteration.value = iteration;
  planePathTrace.material.uniforms.random.value = new THREE.Vector3(Math.random(), Math.random(), Math.random());


  renderer.setRenderTarget(bufferTexture);
  renderer.render(scenePathTrace, camera);

  iteration = iteration + 1;

  material.uniforms.numSamples.value = numSamples;
  renderer.setRenderTarget(null);
  renderer.render( scene, camera );
  requestAnimationFrame( animate );

}
requestAnimationFrame( animate );