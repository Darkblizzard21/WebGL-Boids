#version 300 es
in vec2 position;
in vec2 oldVelocity;
in float maxSpeed;

uniform float minSpeed;
uniform float size;
uniform float deltaTime;
uniform vec2 canvasDimensions;
uniform vec2 allOldPositions[200];
uniform vec2 allOldVelocities[200];

out vec2 newVelocity;

vec2 inLimits(vec2 vector) {
    float l = length(vector);
    if (maxSpeed < l){
        vector = normalize(vector) * maxSpeed;
    }
    if(l < minSpeed){
        vector = normalize(vector) * minSpeed;
    }
    return vector;
}

float distanceToCanvasX(){
    return min(position.x, canvasDimensions.x - position.x);
}

float distanceToCanvasY(){
    return min(position.y, canvasDimensions.y - position.y);
}

vec2 projectOnPositive(vec2 from, vec2 to){
    float dotProd = dot(from,to);
    float dot = max(dotProd, -dotProd);
    float toLength = length(to);
    float mul = dot/(toLength * toLength);
    return mul * to;
}

vec2 calcChaseForce(vec2 targetPos, float targetRange){
    vec2 diff = targetPos - position;
    float dist = length(diff);
    if (targetRange < dist){
        if (dist < 100.0){
            diff = normalize(diff);
            float divider = maxSpeed * dist / 100.0;
            diff = diff / vec2(divider, divider);
        }
        else {
            diff = inLimits(diff);
        }
    }
    else
    {
        diff = vec2(0, 0);
    }
    diff = diff - oldVelocity;
    return inLimits(diff);
}

void main() {
    float forceModifier = 1.0;
    // Avoidance Variables
    float avoidModifier = 1.2;
    float avoidDesired = size * 2.0 + 5.0;
    vec2 avoidSum = vec2(0, 0);
    vec2 avoidForce = vec2(0, 0);
    int avoidCount = 0;
    // Align Variables
    float alignModifier = 1.0;
    float alignRange = 50.0;
    vec2 alignSum = vec2(0, 0);
    vec2 alignForce = vec2(0, 0);
    int alignCount = 0;
    // Untie Variables
    float uniteModifier = 1.0;
    float uniteRange = 100.0;
    vec2 uniteSum = vec2(0, 0);
    vec2 uniteForce = vec2(0, 0);
    int uniteCount = 0;
    // Wall Collision Variables
    float wallAvoidModifier = 1.2;
    float wallAvoidRange = 150.0;
    vec2 wallAvoidForce = vec2(0,0);

    // View Variables
    float viewDistance = max(max(alignRange,avoidDesired),uniteRange);
    float VoFhalf = 120.0;

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
        float angle = acos(dot(normalize(oldVelocity), normalize(distanceTo)));
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
        float avoidSpeed = maxSpeed * avoidModifier;
        avoidSum = avoidSum * vec2(avoidSpeed, avoidSpeed);
        avoidSum = avoidSum - oldVelocity;
        avoidForce = inLimits(avoidSum);
    }
    // Calculate Align
    if (0 < alignCount){
        alignSum = alignSum / vec2(alignCount, alignCount);
        alignSum = normalize(alignSum);
        float alignSpeed = maxSpeed * alignModifier;
        alignSum = alignSum * vec2(alignSpeed, alignSpeed);
        alignSum = alignSum - oldVelocity;
        alignForce = inLimits(alignSum);
    }
    // Calculate Unite
    if (0 < uniteCount){
        vec2 targetPos = uniteSum / vec2(uniteCount, uniteCount);
        uniteForce = calcChaseForce(targetPos, avoidDesired) * uniteModifier;
    }

    vec2 boidForces = avoidForce + alignForce + uniteForce + wallAvoidForce;
    vec2 nextVelocity = oldVelocity + boidForces * deltaTime * forceModifier;
    newVelocity = inLimits(nextVelocity);
}