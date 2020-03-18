
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
    };

    struct HitRecord
    {
      float t;
      vec3 p;
      vec3 normal;
      vec3 albedo;
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
          return true;
      }
      return false;
    }

    bool hitWorld(Ray r, out HitRecord rec)
    {
      const int objCnt = 3;
      Sphere objects[objCnt];
      objects[0] = Sphere(vec3(0.0, 0.0, -1.0), 0.5, vec3(1., 1., 0.0));
      objects[1] = Sphere(vec3(0.0,-100.5,-1.0), 100.0, vec3(1.0, 1.0, 1.0));
      objects[2] = Sphere(vec3(sin(corner), 0, cos(corner) - 1.0), 0.2, vec3(1.0, 0.2, 0.0));

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
      vec3 p = vec3(hash, fract(hash.x+hash.y));
      p = 2.0 * p - 1.0;
      p *= 1.0 / sqrt(3.0); // savage? :)

      return p;
    }

    vec3 color(Ray r, int it) {

      vec3 lightDecay = vec3(1.0, 1.0, 1.0);
      for (int i = 0; i < 5; ++i)
      {
        HitRecord rec;
        if (hitWorld(r, rec))
        {
          vec3 target = rec.p + rec.normal + randomPointOnSphere(it);
          r.origin = rec.p;
          r.dir = normalize(target - rec.p);
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
      vec3 lower_left_corner = vec3(-1.0 * ratio, -1.0, -1.0);
      vec3 horizontal = vec3(2.0 * ratio, 0.0, 0.0);
      vec3 vertical = vec3(0.0, 2.0, 0.0);
      vec3 origin = vec3(0.0, 0.0, 1.0);

      vec3 dir = lower_left_corner + vUv.x*horizontal + vUv.y*vertical;
      Ray r;
      r.dir = normalize(dir);
      r.origin = origin;

      const int NUM_SAMPLES = 25;
      vec3 col = vec3(0.0, 0.0, 0.0);
      for (int i = 0; i < NUM_SAMPLES; ++i)
      {
        col += color(r, i);
      }
      col *= 1.0/float(NUM_SAMPLES);

      gl_FragColor = vec4(col, 1.0);
    }
`
}

let uniforms = {
        colorB: {type: 'vec3', value: new THREE.Color(0xACB6E5)},
        colorA: {type: 'vec3', value: new THREE.Color(0xFF0000)},
        ratio: {value: 0.5},
        corner: {value: -0.5}
}

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize( window.innerWidth * .9, window.innerHeight * .9);

document.body.appendChild( renderer.domElement );

var geometry = new THREE.Geometry();
geometry.vertices= [new THREE.Vector3(-1,-1,0), new THREE.Vector3(3,-1,0), new THREE.Vector3(-1,3,0)]; 
geometry.faces = [new THREE.Face3(0,1,2)];

uniforms.ratio.value = window.innerWidth / window.innerHeight;

let material =  new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader(),
    vertexShader: vertexShader(),
  })

var plane = new THREE.Mesh( geometry, material);
scene.add( plane );

camera.position.z = 5;

let oldTime = 0;
function animate(timestamp) 
{
  let delta = timestamp - oldTime;
  oldTime = timestamp

  
  plane.material.uniforms.corner.value = Math.sin(timestamp * .001) * 1.5;

  renderer.render( scene, camera );
  requestAnimationFrame( animate );

}
requestAnimationFrame( animate );