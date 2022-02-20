import {drawParticlesInstancedFS, drawParticlesInstancedVS} from "../data/shaderVar";
import {ship} from "../data/models";

const ID_ProgramAndLocs = (gl, webGL) => {
  const drawInstancedProgram = webGL.createProgram(
    gl, [drawParticlesInstancedVS, drawParticlesInstancedFS]);

  const drawInstancedProgLocs = {
    i_velocity: gl.getAttribLocation(drawInstancedProgram, "i_velocity"),
    i_offset: gl.getAttribLocation(drawInstancedProgram, "i_offset"),
    a_position: gl.getAttribLocation(drawInstancedProgram, "a_position"),
    a_color: gl.getAttribLocation(drawInstancedProgram, "a_color"),
    matrix: gl.getUniformLocation(drawInstancedProgram, "matrix"),
    scale: gl.getUniformLocation(drawInstancedProgram, "scale")
  };

  return {program: drawInstancedProgram, locations: drawInstancedProgLocs};
};

const ID_VA = (gl, webGL,
               pos1Buffer, pos2Buffer,
               vel1Buffer, vel2Buffer,
               drawInstancedProgLocs,
               numParticles, colors) => {
  const modelBuffer = webGL.makeBuffer(gl, ship.modelAndColor, gl.STATIC_DRAW);
  const colorBuffer = webGL.makeBuffer(gl, new Float32Array(colors), gl.STATIC_DRAW);

  const makeInstancedVA = (posBuffer, velBuffer) => {
    const instancedVA = gl.createVertexArray();
    gl.bindVertexArray(instancedVA);
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);
    gl.vertexAttribPointer(drawInstancedProgLocs.a_position, 2, gl.FLOAT, false, 20, 0);

    gl.enableVertexAttribArray(drawInstancedProgLocs.a_position);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(drawInstancedProgLocs.a_color, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(drawInstancedProgLocs.a_color, colors.length > 3 ? numParticles - 1 : numParticles);
    gl.enableVertexAttribArray(drawInstancedProgLocs.a_color);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(drawInstancedProgLocs.i_offset, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(drawInstancedProgLocs.i_offset, 1);
    gl.enableVertexAttribArray(drawInstancedProgLocs.i_offset);


    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
    gl.vertexAttribPointer(drawInstancedProgLocs.i_velocity, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(drawInstancedProgLocs.i_velocity, 1);
    gl.enableVertexAttribArray(drawInstancedProgLocs.i_velocity);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return instancedVA;
  };

  return {
    va1: makeInstancedVA(pos1Buffer, vel1Buffer),
    va2: makeInstancedVA(pos2Buffer, vel2Buffer)
  };
};

const ID_Draw = (gl, webGL,
                 drawInstancedProgram, drawInstancedProgLocs,
                 numParticles, size, VA) => {
  gl.useProgram(drawInstancedProgram);
  gl.bindVertexArray(VA);

  // code above this line is initialization code.
  // code below this line is rendering code.
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.uniformMatrix4fv(
    drawInstancedProgLocs.matrix,
    false,
    webGL.m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1));
  gl.uniform1f(drawInstancedProgLocs.scale, size);
  // draw
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 14*14);
};

export {
  ID_ProgramAndLocs,
  ID_VA,
  ID_Draw
};