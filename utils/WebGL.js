// Based ON:
// * https://webgl2fundamentals.org/webgl/lessons/webgl-gpgpu.html

export default class WebGLUtils {
  m4 = {
    orthographic: function(left, right, bottom, top, near, far) {
      return [
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, 2 / (near - far), 0,

        (left + right) / (left - right),
        (bottom + top) / (bottom - top),
        (near + far) / (near - far),
        1,
      ];
    }
  }

  resizeCanvasToDisplaySize(canvas) {

    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    const needResize = canvas.width  - displayWidth ||
      canvas.height !== displayHeight;

    if (needResize) {
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }

    return needResize;
  }

  getGLContext(canvas, bgColor) {
    const defaultBgColor = [1, 1, 1, 1];
    const gl = canvas.getContext("webgl2");

    gl.clearColor(...(bgColor ? bgColor : defaultBgColor));
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    return gl;
  }
  getGLContext(canvas) {
    return canvas.getContext("webgl2");
  }

  createShader(gl, shaderSource, shaderType) {
    const shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  createProgram(gl, shaderSources, transformFeedbackVaryings) {
    const program = gl.createProgram();
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
      const shader = this.createShader(gl, shaderSources[ndx], type);
      gl.attachShader(program, shader);
    });
    if (transformFeedbackVaryings) {
      gl.transformFeedbackVaryings(
        program,
        transformFeedbackVaryings,
        gl.SEPARATE_ATTRIBS,
      );
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramParameter(program));
    }
    return program;
  }

  makeBuffer(gl, sizeOrData, usage) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
    return buf;
  }

  makeVertexArray(gl, bufLocPairs) {
    const va = gl.createVertexArray();
    gl.bindVertexArray(va);
    for (const [buffer, loc] of bufLocPairs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(
        loc,      // attribute location
        2,        // number of elements
        gl.FLOAT, // type of data
        false,    // normalize
        0,        // stride (0 = auto)
        0,        // offset
      );
    }
    return va;
  }

  makeTransformFeedback(gl, buffer) {
    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);
    return tf;
  }
}