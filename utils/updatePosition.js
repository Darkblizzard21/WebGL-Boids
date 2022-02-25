import {emptyFS, updatePositionVS} from "../data/shaderVar";
import {getCanvasScale} from "./ScaleUtility";

const UP_ProgramAndLocs = (gl, webGL) => {
  const updatePositionProgram = webGL.createProgram(
    gl,
    [updatePositionVS, emptyFS],
    ["newPosition"]
  );

  const updatePositionPrgLocs = {
    oldPosition: gl.getAttribLocation(updatePositionProgram, "oldPosition"),
    velocity: gl.getAttribLocation(updatePositionProgram, "velocity"),
    canvasDimensions: gl.getUniformLocation(
      updatePositionProgram,
      "canvasDimensions"
    ),
    margin: gl.getUniformLocation(updatePositionProgram, "margin"),
    deltaTime: gl.getUniformLocation(updatePositionProgram, "deltaTime")
  };

  return {program: updatePositionProgram, locations: updatePositionPrgLocs};
};

const UP_VA_FB = (
  gl,
  webGL,
  pos1Buffer,
  pos2Buffer,
  vel1Buffer,
  vel2Buffer,
  updatePositionPrgLocs
) => {
  const genVA = (posBuffer, velBuffer) => {
    const VA = gl.createVertexArray();
    gl.bindVertexArray(VA);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(
      updatePositionPrgLocs.oldPosition,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(updatePositionPrgLocs.oldPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
    gl.vertexAttribPointer(
      updatePositionPrgLocs.velocity,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(updatePositionPrgLocs.velocity);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return VA;
  };

  return {
    va1: genVA(pos1Buffer, vel2Buffer),
    va2: genVA(pos2Buffer, vel1Buffer),
    fb1: webGL.makeTransformFeedback(gl, pos1Buffer),
    fb2: webGL.makeTransformFeedback(gl, pos2Buffer)
  };
};

const UP_Update = (
  gl,
  updatePositionProgram,
  updatePositionPrgLocs,
  deltaTime,
  margin,
  numParticles,
  current
) => {
  gl.enable(gl.RASTERIZER_DISCARD);
  gl.useProgram(updatePositionProgram);
  gl.bindVertexArray(current.updatePositionVA);
  let canvasScale = getCanvasScale();
  gl.uniform2f(
    updatePositionPrgLocs.canvasDimensions,
    gl.canvas.width * canvasScale,
    gl.canvas.height * canvasScale
  );
  gl.uniform1f(updatePositionPrgLocs.deltaTime, deltaTime);
  gl.uniform1f(updatePositionPrgLocs.margin, margin);

  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.ptf);
  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, numParticles);
  gl.endTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

  // turn on using fragment shaders again
  gl.disable(gl.RASTERIZER_DISCARD);
};

export {UP_ProgramAndLocs, UP_VA_FB, UP_Update};
