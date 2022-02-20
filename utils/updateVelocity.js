import {emptyFS, updateVelocityVS} from "../data/shaderVar";

const UV_ProgramAndLocs = (gl, webGL) => {
  const updateVelocityProgram = webGL.createProgram(
    gl, [updateVelocityVS, emptyFS], ["newVelocity"]);

  const updateVelocityPrgLocs = {
    position: gl.getAttribLocation(updateVelocityProgram, "position"),
    oldVelocity: gl.getAttribLocation(updateVelocityProgram, "oldVelocity"),
    maxSpeed: gl.getAttribLocation(updateVelocityProgram, "maxSpeed"),
    minSpeed: gl.getUniformLocation(updateVelocityProgram, "minSpeed"),
    size: gl.getUniformLocation(updateVelocityProgram, "size"),
    deltaTime: gl.getUniformLocation(updateVelocityProgram, "deltaTime"),
    canvasDimensions: gl.getUniformLocation(updateVelocityProgram, "canvasDimensions"),
    allOldPositions: gl.getUniformLocation(updateVelocityProgram, "allOldPositions"),
    allOldVelocities: gl.getUniformLocation(updateVelocityProgram, "allOldVelocities")
  };

  return {program: updateVelocityProgram, locations: updateVelocityPrgLocs};
};

const UV_VA_FB = (gl, webGL,
                  pos1Buffer, pos2Buffer,
                  vel1Buffer, vel2Buffer,
                  speedBuffer,
                  updateVelocityPrgLocs) => {
  const genVA = (posBuffer, velBuffer) => {
    const VA = gl.createVertexArray();
    gl.bindVertexArray(VA);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(updateVelocityPrgLocs.position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(updateVelocityPrgLocs.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
    gl.vertexAttribPointer(updateVelocityPrgLocs.oldVelocity, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(updateVelocityPrgLocs.oldVelocity);

    gl.bindBuffer(gl.ARRAY_BUFFER, speedBuffer);
    gl.vertexAttribPointer(updateVelocityPrgLocs.maxSpeed, 1, gl.FLOAT, false, 0, 0);
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

const UV_Update = (gl,
                   updateVelocityProgram, updateVelocityPrgLocs,
                   minSpeed, deltaTime, numParticles, size, current) => {
  // compute the new velocities
  gl.useProgram(updateVelocityProgram);
  gl.bindVertexArray(current.updateVelocityVA);
  gl.uniform1f(updateVelocityPrgLocs.minSpeed, minSpeed);
  gl.uniform1f(updateVelocityPrgLocs.size, size);
  gl.uniform1f(updateVelocityPrgLocs.deltaTime, deltaTime);
  gl.uniform2f(updateVelocityPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);

  let positionsView = new Float32Array(numParticles * 2);
  gl.bindBuffer(gl.ARRAY_BUFFER, current.pReadBuffer);
  gl.getBufferSubData(gl.ARRAY_BUFFER, 0, positionsView);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.uniform2fv(updateVelocityPrgLocs.allOldPositions, positionsView);

  let velocitiesView = new Float32Array(numParticles * 2);
  gl.bindBuffer(gl.ARRAY_BUFFER, current.vReadBuffer);
  gl.getBufferSubData(gl.ARRAY_BUFFER, 0, velocitiesView);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.uniform2fv(updateVelocityPrgLocs.allOldVelocities, velocitiesView);

  gl.enable(gl.RASTERIZER_DISCARD);

  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.vtf);
  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, numParticles);
  gl.endTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);


  gl.disable(gl.RASTERIZER_DISCARD);
};

export {
  UV_ProgramAndLocs,
  UV_VA_FB,
  UV_Update,
};