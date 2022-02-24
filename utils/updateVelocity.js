import {emptyFS, updateVelocityVS} from "../data/shaderVar";

// Uniforms
const speedModifier = 1.0;
const forceModifier = 1.0;
const maxRotation = 360.0;
// Avoidance Variables
const avoidModifier = 1.2;
const avoidDesired = 11.0;
// Align Variables
const alignModifier = 1.0;
const alignRange = 35.0;
// Untie Variables
const uniteModifier = 1.0;
const uniteRange = 20.0;
// Wall Collision Variables
const wallAvoidModifier = 1.2;
const wallAvoidRange = 120.0;

// View Variables
const VoFhalf = 120.0;

const UV_ProgramAndLocs = (gl, webGL) => {
  const updateVelocityProgram = webGL.createProgram(
    gl,
    [updateVelocityVS, emptyFS],
    ["newVelocity"]
  );

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
    }
  };

  return {program: updateVelocityProgram, locations: updateVelocityPrgLocs};
};

const UV_VA_FB = (
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

const UV_Update = (
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

  gl.enable(gl.RASTERIZER_DISCARD);

  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.vtf);
  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, numParticles);
  gl.endTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

  gl.disable(gl.RASTERIZER_DISCARD);
};

export {UV_ProgramAndLocs, UV_VA_FB, UV_Update};
