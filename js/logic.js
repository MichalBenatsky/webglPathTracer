
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

    void main() {
        gl_FragColor = vec4(vUv.xy,0.0, 1.0);
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