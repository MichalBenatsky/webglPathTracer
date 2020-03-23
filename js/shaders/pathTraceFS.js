export function pathTraceFS() {return `

  uniform vec3 lowerLeftCorner;
  uniform vec3 horizontal;
  uniform vec3 vertical;
  uniform vec3 origin;
  uniform vec3 random;
  uniform vec2 screenSizeInv;
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
    const int objCnt = 7;
    Sphere objects[objCnt];
    objects[0] = Sphere(vec3(0.0, 0.4, -1.0), .8, vec3(0.5, 1.0, 1.0), 1);
    objects[1] = Sphere(vec3(0.0,-100.5,-1.0), 100.1, vec3(1.0, 1.0, 1.0) * .7, 1);
    objects[2] = Sphere(vec3(sin(corner), -.1, cos(corner) - 1.0), 0.3, vec3(1.0, 1.0, 0.0), 0);
    objects[3] = Sphere(vec3(1.0, 0.0, -0.5), 0.3, vec3(1.0, 1.0, 1.0), 0);
    objects[4] = Sphere(vec3(-0.9, 0.7, -0.8), 0.15, vec3(1.0, 1.0, 0.0) * 1.0, 1);
    objects[5] = Sphere(vec3(1.0, 0.7, 0.0), 0.1, vec3(1, 0.0, 0.0) * 30., 2);
    objects[6] = Sphere(vec3(-1.0, 0.4, -1.0), .2, vec3(1., .5, 0.7), 1);

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

    vec2 aaUVs = screenSizeInv * random.yz + vUv.xy;

    vec3 dir = (lowerLeftCorner + aaUVs.x*horizontal + aaUVs.y*vertical) - origin;
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

}`;}