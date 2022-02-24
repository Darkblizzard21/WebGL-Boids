import {emptyFS, updateVelocityVS} from "../data/shaderVar";
import {getTexture} from "./textureManager";

// Uniforms
const speedModifierActive = 0.7;
let speedModifier = 1.0;
const forceModifier = 1.0;
const maxRotation = 360.0;
// Avoidance Variables
const avoidDefault = 1.2;
const avoidTexture = 100.0;
let avoidModifier = avoidDefault;
const avoidDesired = 15.0;
// Align Variables
const alignModifier = 1.0;
const alignRange = 35.0;
// Untie Variables
const uniteModifier = 1.0;
const uniteRange = 20.0;
// Wall Collision Variables
const wallAvoidModifier = 1.2;
const wallAvoidRange = 120.0;
// Tex Variables
const outerForceModifierActive = 1200.0;
let outerForceModifier = 0.0;
const innerForceModifierActive = 1800.0;
let innerForceModifier = 0.0;
const canvasForceModifierActive = 1.0;
let canvasForceModifier = 0.0;
// View Variables
const VoFhalf = 90.0;

// Change Texture Data
let UV_gl = undefined;
let UV_program = undefined;
let targetImage = undefined;
let texture = undefined;
const activateTexture = img => {
  if (!img) {
    img = getTexture();
  }
  if (targetImage !== img) {
    targetImage = img;
    UFVT_BindTexture(UV_gl, UV_program, targetImage);
  }
  speedModifier = speedModifierActive;
  outerForceModifier = outerForceModifierActive;
  innerForceModifier = innerForceModifierActive;
  canvasForceModifier = canvasForceModifierActive;
  avoidModifier = avoidTexture;
};

const deactivateTexture = () => {
  speedModifier = 1.0;
  outerForceModifier = 0.0;
  innerForceModifier = 0.0;
  canvasForceModifier = 0.0;
  avoidModifier = avoidDefault;
};

const UVFT_ProgramAndLocs = (gl, webGL) => {
  // Modify updateVelocityVs
  const inputAdditions = `
    uniform sampler2D sampler;
    uniform float innerForceModifier;
    uniform float outerForceModifier;
    uniform float canvasForceModifier;
  `;
  const functionAdditions = ``;
  const forceCalculationAdditions = `
    vec2 textureForce = vec2(0,0);
    float edgeMargin = 0.0;
    vec2 lowerEdge = vec2(0,0);
    vec2 upperEdge = canvasDimensions;
    if(canvasDimensions.x < canvasDimensions.y){
        float margin = (canvasDimensions.y - canvasDimensions.x) / 2.0;
        lowerEdge = vec2(lowerEdge.x,lowerEdge.y + margin);
        upperEdge = vec2(upperEdge.x,upperEdge.y - margin);
    }else{
        float margin = (canvasDimensions.x - canvasDimensions.y) / 2.0;
        lowerEdge = vec2(lowerEdge.x + margin, lowerEdge.y);
        upperEdge = vec2(upperEdge.x - margin, upperEdge.y);
    }
    lowerEdge += edgeMargin;
    upperEdge += edgeMargin;
    if(lowerEdge.x <= position.x && upperEdge.x >= position.x && lowerEdge.y <= position.y && upperEdge.y >= position.y){
      float textureSize = min(canvasDimensions.x,canvasDimensions.y);
      vec2 texCoord = (position-lowerEdge) / textureSize;
      vec3 texVec = texture(sampler, texCoord).xyz;
      
      float forceMul = innerForceModifier;
      /**/
      if(texVec.z < 0.5){
        if(0.0 < outerForceModifier)
          speed += texVec.z * 2.0; 
        // Out of Form
        float range =  2.0 * texVec.z * 10.0;
        float rangeInfluence = range * range;
        forceMul = outerForceModifier * range;
      }
      else{
        // Inform
        float range = (texVec.z - 0.5) * 2.0 * 10.0;
        float rangeInfluence = range * range;
        forceMul = innerForceModifier * rangeInfluence;
      }
      vec2 texDir = (texVec.xy - 0.495) * 2.0;
      texDir = vec2(texDir.x,-texDir.y);
      if(length(texDir) < 0.05)
        texDir = vec2(0,0);
      textureForce = texDir * forceMul;
    }
    else {
      if(canvasForceModifier > 0.0){
          speed = speed/ speedModifier; 
          textureForce = normalize(canvasDimensions/2.0-position) * speed.y;
      }
    }
    boidForces = boidForces + textureForce;
  `;

  const injectedUpdateVelocityVS = updateVelocityVS
    .replace("//#textureInput", inputAdditions)
    .replace("//#textureFunctions", functionAdditions)
    .replace("//#textureForces", forceCalculationAdditions);

  const updateVelocityProgram = webGL.createProgram(
    gl,
    [injectedUpdateVelocityVS, emptyFS],
    ["newVelocity"]
  );

  console.log("use forceTexture");

  const updateVelocityPrgLocs = {
    position: gl.getAttribLocation(updateVelocityProgram, "position"),
    oldVelocity: gl.getAttribLocation(updateVelocityProgram, "oldVelocity"),
    maxSpeed: gl.getAttribLocation(updateVelocityProgram, "maxSpeed"),
    data: {
      deltaTime: gl.getUniformLocation(updateVelocityProgram, "deltaTime"),
      canvasDimensions: gl.getUniformLocation(
        updateVelocityProgram,
        "canvasDimensions"
      ),
      allOldPositions: gl.getUniformLocation(
        updateVelocityProgram,
        "allOldPositions"
      ),
      allOldVelocities: gl.getUniformLocation(
        updateVelocityProgram,
        "allOldVelocities"
      )
    },
    general: {
      speedModifier: gl.getUniformLocation(
        updateVelocityProgram,
        "speedModifier"
      ),
      minSpeed: gl.getUniformLocation(updateVelocityProgram, "minSpeed"),
      size: gl.getUniformLocation(updateVelocityProgram, "size"),
      forceModifier: gl.getUniformLocation(
        updateVelocityProgram,
        "forceModifier"
      ),
      maxRotation: gl.getUniformLocation(updateVelocityProgram, "maxRotation"),
      VoFhalf: gl.getUniformLocation(updateVelocityProgram, "VoFhalf")
    },
    avoid: {
      modifier: gl.getUniformLocation(updateVelocityProgram, "avoidModifier"),
      desired: gl.getUniformLocation(updateVelocityProgram, "avoidDesired")
    },
    align: {
      modifier: gl.getUniformLocation(updateVelocityProgram, "alignModifier"),
      range: gl.getUniformLocation(updateVelocityProgram, "alignRange")
    },
    unite: {
      modifier: gl.getUniformLocation(updateVelocityProgram, "uniteModifier"),
      range: gl.getUniformLocation(updateVelocityProgram, "uniteRange")
    },
    wall: {
      avoidModifier: gl.getUniformLocation(
        updateVelocityProgram,
        "wallAvoidModifier"
      ),
      avoidRange: gl.getUniformLocation(updateVelocityProgram, "wallAvoidRange")
    },
    tex: {
      sampler: gl.getUniformLocation(updateVelocityProgram, "sampler"),
      innerForceMod: gl.getUniformLocation(
        updateVelocityProgram,
        "innerForceModifier"
      ),
      outerForceMod: gl.getUniformLocation(
        updateVelocityProgram,
        "outerForceModifier"
      ),
      canvasForceMod: gl.getUniformLocation(
        updateVelocityProgram,
        "canvasForceModifier"
      )
    }
  };

  UV_gl = gl;
  UV_program = updateVelocityProgram;
  return {program: updateVelocityProgram, locations: updateVelocityPrgLocs};
};

const UVFT_VA_FB = (
  gl,
  webGL,
  pos1Buffer,
  pos2Buffer,
  vel1Buffer,
  vel2Buffer,
  speedBuffer,
  updateVelocityPrgLocs
) => {
  const genVA = (posBuffer, velBuffer) => {
    const VA = gl.createVertexArray();
    gl.bindVertexArray(VA);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(
      updateVelocityPrgLocs.position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(updateVelocityPrgLocs.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
    gl.vertexAttribPointer(
      updateVelocityPrgLocs.oldVelocity,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(updateVelocityPrgLocs.oldVelocity);

    gl.bindBuffer(gl.ARRAY_BUFFER, speedBuffer);
    gl.vertexAttribPointer(
      updateVelocityPrgLocs.maxSpeed,
      1,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(updateVelocityPrgLocs.maxSpeed);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return VA;
  };

  return {
    va1: genVA(pos1Buffer, vel1Buffer),
    va2: genVA(pos2Buffer, vel2Buffer),
    fb1: webGL.makeTransformFeedback(gl, vel1Buffer),
    fb2: webGL.makeTransformFeedback(gl, vel2Buffer)
  };
};

const textureSlot = 1;
const UFVT_BindTexture = (gl, program, image) => {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.uniform1i(gl.getUniformLocation(program, "sampler"), textureSlot);
  gl.activeTexture(gl.TEXTURE0 + textureSlot);

  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    256,
    256,
    0,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    image
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
};

const UVFT_Update = (
  gl,
  updateVelocityProgram,
  updateVelocityPrgLocs,
  minSpeed,
  deltaTime,
  numParticles,
  size,
  current
) => {
  // compute the new velocities
  gl.useProgram(updateVelocityProgram);
  gl.bindVertexArray(current.updateVelocityVA);

  // Set Data Uniforms
  gl.uniform1f(updateVelocityPrgLocs.data.deltaTime, deltaTime);
  gl.uniform2f(
    updateVelocityPrgLocs.data.canvasDimensions,
    gl.canvas.width,
    gl.canvas.height
  );

  let positionsView = new Float32Array(numParticles * 2);
  gl.bindBuffer(gl.ARRAY_BUFFER, current.pReadBuffer);
  gl.getBufferSubData(gl.ARRAY_BUFFER, 0, positionsView);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.uniform2fv(updateVelocityPrgLocs.data.allOldPositions, positionsView);

  let velocitiesView = new Float32Array(numParticles * 2);
  gl.bindBuffer(gl.ARRAY_BUFFER, current.vReadBuffer);
  gl.getBufferSubData(gl.ARRAY_BUFFER, 0, velocitiesView);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.uniform2fv(updateVelocityPrgLocs.data.allOldVelocities, velocitiesView);

  // Set General Uniforms
  gl.uniform1f(updateVelocityPrgLocs.general.speedModifier, speedModifier);
  gl.uniform1f(updateVelocityPrgLocs.general.minSpeed, minSpeed);
  gl.uniform1f(updateVelocityPrgLocs.general.size, size);
  gl.uniform1f(updateVelocityPrgLocs.general.forceModifier, forceModifier);
  gl.uniform1f(updateVelocityPrgLocs.general.maxRotation, maxRotation);
  gl.uniform1f(updateVelocityPrgLocs.general.VoFhalf, VoFhalf);

  // Set Avoid Uniform
  gl.uniform1f(updateVelocityPrgLocs.avoid.modifier, avoidModifier);
  gl.uniform1f(updateVelocityPrgLocs.avoid.desired, avoidDesired);

  // Set Align Uniform
  gl.uniform1f(updateVelocityPrgLocs.align.modifier, alignModifier);
  gl.uniform1f(updateVelocityPrgLocs.align.range, alignRange);

  // Set Unite Uniform
  gl.uniform1f(updateVelocityPrgLocs.unite.modifier, uniteModifier);
  gl.uniform1f(updateVelocityPrgLocs.unite.range, uniteRange);
  // Set Wall Avoidance Uniform
  gl.uniform1f(updateVelocityPrgLocs.wall.avoidModifier, wallAvoidModifier);
  gl.uniform1f(updateVelocityPrgLocs.wall.avoidRange, wallAvoidRange);

  // Bind Texture
  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0 + textureSlot);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(updateVelocityPrgLocs.tex.sampler, textureSlot);
  gl.uniform1f(updateVelocityPrgLocs.tex.outerForceMod, outerForceModifier);
  gl.uniform1f(updateVelocityPrgLocs.tex.innerForceMod, innerForceModifier);
  gl.uniform1f(updateVelocityPrgLocs.tex.canvasForceMod, canvasForceModifier);

  gl.enable(gl.RASTERIZER_DISCARD);

  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.vtf);
  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, numParticles);
  gl.endTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

  gl.disable(gl.RASTERIZER_DISCARD);
};

export {
  activateTexture,
  deactivateTexture,
  UVFT_ProgramAndLocs,
  UVFT_VA_FB,
  UVFT_Update,
  UFVT_BindTexture
};
