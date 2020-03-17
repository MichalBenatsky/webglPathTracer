
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
    varying vec3 vUv;

    struct Ray
    {
      vec3 dir;
      vec3 origin;
    };

    struct HitRecord
    {
      float t;
      vec3 p;
      vec3 normal;
    };



    bool hitSphere(vec3 center, float radius, Ray r, out HitRecord rec) 
    {
      vec3 oc = r.origin - center;
      float a = dot(r.dir, r.dir);
      float b = dot(oc, r.dir);
      float c = dot(oc, oc) - radius*radius;
      float discriminant = b*b - a*c;
      if (discriminant > 0.0) {
          float temp = (-b - sqrt(discriminant))/a;
          rec.t = temp;
          rec.p = r.origin + r.dir * rec.t;
          rec.normal = (rec.p - center) / radius;
          return true;
      }
      return false;
    }

    bool hitWorld(Ray r, out HitRecord rec)
    {
      bool hit = hitSphere(vec3(0,0,-1), 0.5, r, rec);
      return hit;
    }

    vec3 color(Ray r) {
      HitRecord rec;
      if (hitWorld(r, rec))
      {
        return 0.5*vec3(rec.normal.x+1.0, rec.normal.y+1.0, rec.normal.z+1.0);
      }

      vec3 unit_direction = r.dir;
      float t = 0.5*(unit_direction.y + 1.0);
      return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
    }

    void main() {
      vec3 lower_left_corner = vec3(-2.0, -1.0, -1.0);
      vec3 horizontal = vec3(4.0, 0.0, 0.0);
      vec3 vertical = vec3(0.0, 2.0, 0.0);
      vec3 origin = vec3(0.0, 0.0, 0.0);

      vec3 dir = lower_left_corner + vUv.x*horizontal + vUv.y*vertical;
      Ray r;
      r.dir = normalize(dir);
      r.origin = origin;
      vec3 col = color(r);

      gl_FragColor = vec4(col, 1.0);
    }
`
}

let uniforms = {
        colorB: {type: 'vec3', value: new THREE.Color(0xACB6E5)},
        colorA: {type: 'vec3', value: new THREE.Color(0xFF0000)}
}

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize( window.innerWidth / 2, window.innerHeight / 2);

document.body.appendChild( renderer.domElement );

var geometry3 = new THREE.Geometry();
geometry3.vertices= [new THREE.Vector3(-1,-1,0), new THREE.Vector3(3,-1,0), new THREE.Vector3(-1,3,0)]; 
geometry3.faces = [new THREE.Face3(0,1,2)];

const width = 1;
const height = 1;
const widthSegments = 1;
const heightSegments = 1;
const geometry2 = new THREE.PlaneBufferGeometry(width, height, widthSegments, heightSegments);
var geometry = new THREE.BoxGeometry();

let material2 =  new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader(),
    vertexShader: vertexShader(),
  })

var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry3, material2);
scene.add( cube );

camera.position.z = 5;

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    renderer.setClearColor(new THREE.Color( 0xff0000 ), 0);
    //cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
}
animate();