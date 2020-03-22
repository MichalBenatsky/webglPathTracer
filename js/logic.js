
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
    uniform vec3 colorA; 
    uniform vec3 colorB; 
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
      const int objCnt = 4;
      Sphere objects[objCnt];
      objects[0] = Sphere(vec3(0.0, 0.4, -1.0), 0.5, vec3(1., 1., 0.0), 1);
      objects[1] = Sphere(vec3(0.0,-100.5,-1.0), 100.0, vec3(1.0, 1.0, 1.0), 1);
      objects[2] = Sphere(vec3(sin(corner), -.1, cos(corner) - 1.0), 0.4, vec3(1.0, 1.0, 1.0), 0);
      objects[3] = Sphere(vec3(sin(corner+3.14*.3), 0.2, cos(corner+3.14 * .3) - 1.0), 0.15, vec3(1.0, 1.0, .0) * 10.0, 2);

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

    vec2 hash2( vec2 p )
    {
      return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
    }

    vec3 randomPointOnSphere(int it)
    {
      vec2 hash = hash2(vUv.xy + float(it) * 0.345);
      
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
        vec3 target = rec.p + rec.normal + randomPointOnSphere(it);
        rOut.dir = normalize(target - rec.p);
      }
      else // Its light source
      {
        stopTrace = true;
      }
      
      //rOut.origin += rOut.dir * 0.001;
      return rOut;
    }

    vec3 color(Ray r, int it) {

      vec3 lightDecay = vec3(1.0, 1.0, 1.0);
      for (int i = 0; i < 10; ++i)
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

          lightDecay *= 0.65 * rec.albedo;
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

      vec3 lower_left_corner = vec3(-1.0 * ratio, -1.0, -1.0);
      vec3 horizontal = vec3(2.0 * ratio, 0.0, 0.0);
      vec3 vertical = vec3(0.0, 2.0, 0.0);
      vec3 origin = vec3(0.0, 0.0, 1.0);

      vec3 dir = lower_left_corner + vUv.x*horizontal + vUv.y*vertical;
      Ray r;
      r.dir = normalize(dir);
      r.origin = origin;

      const int NUM_SAMPLES = 15;
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

let screenWidth = window.innerWidth * .9;
let screenHeight = window.innerHeight * .9;

let scenePathTrace = new THREE.Scene();
let bufferTexture = new THREE.WebGLRenderTarget( screenWidth, screenHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat ,type:THREE.FloatType });

let uniformsPathTrace = {
  colorB: {type: 'vec3', value: new THREE.Color(0xACB6E5)},
  colorA: {type: 'vec3', value: new THREE.Color(0xFF0000)},
  ratio: {value: 0.5},
  corner: {value: -0.5},
  iteration: {value: 0}
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

texture = new THREE.TextureLoader().load( "../TerrainStreaming.png" );
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

// *****************************

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

  renderer.setRenderTarget(bufferTexture);
  renderer.render(scenePathTrace, camera);

  iteration = iteration + 1;

  material.uniforms.numSamples.value = numSamples;
  renderer.setRenderTarget(null);
  renderer.render( scene, camera );
  requestAnimationFrame( animate );

}
requestAnimationFrame( animate );