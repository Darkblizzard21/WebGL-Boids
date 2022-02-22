// Write vertex shaders
const vertexShader = `#version 300 es
precision mediump float;

uniform float scale;
uniform vec2 position;
in vec2 vertexPos;

void main () {
    gl_Position = vec4(position.x + vertexPos.x * scale, position.y + vertexPos.y * scale, 0.0, 1.0); // x,y,z,w
}
`;

// Write fragment shaders
const fragmentShader = `#version 300 es
precision mediump float;
out vec4 color;

void main () {
    color = vec4(0.7, 0.89, 0.98, 1.0);
}
`;


const updateVelocityVS = `#version 300 es
precision highp float;
precision highp int;
precision highp isampler2D;
in vec2 position;
in vec2 oldVelocity;
in float maxSpeed;
/**/
// Data Uniforms
uniform float speedModifier;
uniform float deltaTime;
uniform vec2 canvasDimensions;
uniform vec2 allOldPositions[200];
uniform vec2 allOldVelocities[200];

// General Config Uniform
uniform float minSpeed;
uniform float size;
uniform float forceModifier;
uniform float maxRotation;
uniform float VoFhalf;
// Avoid Conifg Uniform
uniform float avoidModifier;
uniform float avoidDesired;
// Align Conifg Uniform
uniform float alignModifier;
uniform float alignRange;
// Unite Config Uniform
uniform float uniteModifier;
uniform float uniteRange;
// Wall Avoidance Uniform
uniform float wallAvoidModifier;
uniform float wallAvoidRange;

// Transform Feedback
out vec2 newVelocity;

//#textureInput

// Random Noise from stackoverflow https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl/17479300
uint hash( uint x ) {
    x += ( x << 10u );
    x ^= ( x >>  6u );
    x += ( x <<  3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
}

uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }

float floatConstruct( uint m ) {
    const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
    const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32

    m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
    m |= ieeeOne;                          // Add fractional part to 1.0

    float  f = uintBitsToFloat( m );       // Range [1:2]
    return f - 1.0;                        // Range [0:1]
}

float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
// End Noise

// limits.x == min, limits.y == max;
vec2 inLimits(vec2 vector, vec2 limits) {
    float l = length(vector);
    if (limits.y < l){
        vector = normalize(vector) * limits.y;
    }
    if(l < limits.x){
        vector = normalize(vector) * limits.x;
    }
    return vector;
}

float distanceToCanvasX(){
    return min(position.x, canvasDimensions.x - position.x);
}

float distanceToCanvasY(){
    return min(position.y, canvasDimensions.y - position.y);
}

float angleBetween(vec2 first, vec2 second){
    float dividend = dot(first,second);
    float divisor = length(first)*length(second);
    float rotation = acos(dividend/divisor);
    if(first.x > 0.0)
    rotation = -rotation;
    return rotation;
}

vec2 rotate(vec2 origin, float rad){
    float x = cos(rad)*origin.x - sin(rad) * origin.y;
    float y = sin(rad)*origin.x + cos(rad) * origin.y;
    return vec2(x, y);
}

vec2 calcChaseForce(vec2 targetPos, float targetRange, vec2 speed){
    vec2 diff = targetPos - position;
    float dist = length(diff);
    if (targetRange < dist){
        if (dist < 100.0){
            diff = normalize(diff);
            float divider = speed.y * dist / 100.0;
            diff = diff / vec2(divider, divider);
        }
        else {
            diff = inLimits(diff, speed);
        }
    }
    else
    {
        diff = vec2(0, 0);
    }
    diff = diff - oldVelocity;
    return inLimits(diff, speed);
}

//#textureFunctions

void main() {
    vec2 speed = vec2(minSpeed, maxSpeed) * speedModifier;
    // Avoidance Variables
    vec2 avoidSum = vec2(0, 0);
    vec2 avoidForce = vec2(0, 0);
    int avoidCount = 0;
    // Align Variables
    vec2 alignSum = vec2(0, 0);
    vec2 alignForce = vec2(0, 0);
    int alignCount = 0;
    // Untie Variables
    vec2 uniteSum = vec2(0, 0);
    vec2 uniteForce = vec2(0, 0);
    int uniteCount = 0;
    // Wall Collision Variables
    vec2 wallAvoidForce = vec2(0,0);

    // View Variables
    float viewDistance = max(max(alignRange,avoidDesired),uniteRange);

    // Collect nearby boids
    int nearCount = 0;
    vec2 relevantBoidsPositions[200];
    vec2 relevantBoidsVelocities[200];
    for (int i=0;i<200;++i)
    {
        vec2 otherPosition = allOldPositions[i];
        if (otherPosition.x == position.x && otherPosition.y == position.y)
        continue;
        vec2 distanceTo = otherPosition - position;
        float angle = angleBetween(oldVelocity, distanceTo);
        if (length(distanceTo) < viewDistance && -VoFhalf < angle && VoFhalf > angle) {
            relevantBoidsPositions[nearCount] = otherPosition;
            relevantBoidsVelocities[nearCount] = allOldVelocities[i];
            nearCount++;
        }
    }

    // Calculate Data from nearby boids
    for (int i=0;i<nearCount;++i)
    {
        vec2 otherPosition = relevantBoidsPositions[i];
        vec2 otherVelocity = relevantBoidsVelocities[i];
        vec2 distanceTo = otherPosition - position;
        float lengthDT = length(distanceTo);
        // Avoid Other Boids
        if (lengthDT < avoidDesired){
            vec2 diff = -distanceTo;
            diff = normalize(diff);
            diff = diff / vec2(lengthDT, lengthDT);
            avoidSum += diff;
            avoidCount++;
        }
        // Align vector
        if (lengthDT < alignRange){
            alignSum += otherVelocity;
            alignCount++;
        }
        // unite vector
        if (lengthDT < uniteRange){
            uniteSum += otherPosition;
            uniteCount++;
        }
    }

    // Calculate Avoid
    if (0 < avoidCount){
        avoidSum = avoidSum / vec2(avoidCount, avoidCount);
        avoidSum = normalize(avoidSum);
        float avoidSpeed = speed.y * avoidModifier;
        avoidSum = avoidSum * vec2(avoidSpeed, avoidSpeed);
        avoidSum = avoidSum - oldVelocity;
        avoidForce = inLimits(avoidSum, speed);
    }
    // Calculate Align
    if (0 < alignCount){
        alignSum = alignSum / vec2(alignCount, alignCount);
        alignSum = normalize(alignSum);
        float alignSpeed = speed.y * alignModifier;
        alignSum = alignSum * vec2(alignSpeed, alignSpeed);
        alignSum = alignSum - oldVelocity;
        alignForce = inLimits(alignSum, speed);
    }
    // Calculate Unite
    if (0 < uniteCount){
        vec2 targetPos = uniteSum / vec2(uniteCount, uniteCount);
        uniteForce = calcChaseForce(targetPos, avoidDesired, speed) * uniteModifier;
    }


    // Avoid Walls
    if(distanceToCanvasX() < wallAvoidRange || distanceToCanvasY() < wallAvoidRange){
        wallAvoidForce = calcChaseForce(canvasDimensions/2.0, avoidDesired , speed) * wallAvoidModifier;
    }


    // calculate velocity
    vec2 boidForces = avoidForce + alignForce + uniteForce + wallAvoidForce;

    //#textureForces

    vec2 nextVelocity = oldVelocity + (boidForces * deltaTime * forceModifier);

    // add randomness
    float luck = random(vec4(oldVelocity, position));
    if(luck < 0.05){
        nextVelocity = rotate(nextVelocity, (luck - 0.025));
    }

    newVelocity = inLimits(nextVelocity, speed);

    // Smooth Rotation
    float deltaAngle = angleBetween(newVelocity, oldVelocity);
    if(maxRotation * deltaTime < abs(deltaAngle)){
        float allowedAngle = maxRotation * deltaTime * sign(deltaAngle);
        float length = length(newVelocity);
        newVelocity = normalize(rotate(oldVelocity,allowedAngle)) * length;
    }

}
  `;

const updatePositionVS = `#version 300 es
  in vec2 oldPosition;
  in vec2 velocity;

  uniform float margin;
  uniform float deltaTime;
  uniform vec2 canvasDimensions;

  out vec2 newPosition;

  vec2 euclideanModulo(vec2 n, vec2 m) {
  \treturn mod(mod(n, m) + m, m);
  }

  vec2 limit(vec2 vector, vec2 limit){
    float x = max(margin, min(vector.x,limit.x - margin));
    float y = max(margin, min(vector.y,limit.y - margin));
    return vec2(x,y);
  }

  void main() {
    newPosition = limit(
        oldPosition + velocity * deltaTime,
        canvasDimensions);
  }
  `;

const emptyFS = `#version 300 es
  precision highp float;
  void main() {
  }
  `;

const drawParticlesVS = `#version 300 es
  in vec2 position;
  
  uniform float size;
  uniform mat4 matrix;

  void main() {
    // do the common matrix math
    gl_Position = matrix * vec4(position,0,1);
    gl_PointSize = size;
  }
  `;

const drawParticlesFS = `#version 300 es
  precision highp float;
  out vec4 outColor;
  void main() {
    outColor = vec4(1, 0, 0, 1);
  }
  `;

const drawParticlesInstancedVS = `#version 300 es
precision mediump float;


in vec2 i_velocity;
in vec2 i_offset;
in vec2 a_position;
in vec3 a_color;

uniform mat4 matrix;
uniform float scale;

out vec4 v_color;

float angleBetween(vec2 first, vec2 second){
    float dividend = dot(first,second);
    float divisor = length(first)*length(second);
    float rotation = acos(dividend/divisor);
    if(first.x > 0.0)
      rotation = -rotation;
    return rotation;
}
  
vec2 rotate(vec2 origin, float rad){
    float x = cos(rad)*origin.x - sin(rad) * origin.y;
    float y = sin(rad)*origin.x + cos(rad) * origin.y;
    return vec2(x, y);
}

void main () {
    float rotation = angleBetween(i_velocity,vec2(0,1));
    vec2 scaledPosition = a_position * scale;
    gl_Position = matrix * vec4(i_offset + (rotate(scaledPosition,rotation)),0,1); // x,y,z,w
    v_color = vec4(a_color,1);
}
  `;

const drawParticlesInstancedFS = `#version 300 es
precision mediump float;

out vec4 color;

in vec4 v_color;

void main () {
    color = v_color;
}`;

export {
  vertexShader,
  fragmentShader,
  updateVelocityVS,
  updatePositionVS,
  emptyFS,
  drawParticlesVS,
  drawParticlesFS,
  drawParticlesInstancedVS,
  drawParticlesInstancedFS
};