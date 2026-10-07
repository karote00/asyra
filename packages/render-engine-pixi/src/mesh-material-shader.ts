import {
  Shader,
  GlProgram,
  compileHighShaderGl,
  compileHighShaderGpuProgram,
  vertexGlTemplate,
  fragmentGlTemplate,
  globalUniformsBitGl,
  colorBit,
  colorBitGl,
  roundPixelsBit,
  roundPixelsBitGl,
  getBatchSamplersUniformGroup
} from 'pixi.js'

const glEvaluation = `
float parameter(int source, int index) {
  uvec4 bytes = uvec4(round(parameterBytes(source, index) * 255.0));
  return uintBitsToFloat(bytes.r | (bytes.g << 8u) | (bytes.b << 16u) | (bytes.a << 24u));
}
vec4 recordAt(int source, int index) {
  int offset = index * 4;
  return vec4(parameter(source, offset), parameter(source, offset+1), parameter(source, offset+2), parameter(source, offset+3));
}
float phaseAt(int mode, vec2 uv, vec4 axis, vec4 side) {
  vec2 d = axis.zw - axis.xy;
  vec2 p = uv - axis.xy;
  float length2 = dot(d, d);
  if(length2 == 0.0) return 0.0;
  if(mode == 1) return dot(p, d) / length2;
  if(mode == 3) {
    float phase = (atan(p.y,p.x) - atan(d.y,d.x)) / 6.283185307179586;
    return phase - floor(phase);
  }
  vec2 second = vec2(-d.y,d.x);
  if(side.z > 0.5) second = side.xy - axis.xy;
  float determinant = d.x*second.y - d.y*second.x;
  if(determinant == 0.0) return 0.0;
  vec2 q = vec2(p.x*second.y-p.y*second.x, d.x*p.y-d.y*p.x) / determinant;
  if(mode == 2) return length(q);
  return abs(q.x)+abs(q.y);
}
vec4 stopColor(int source, int start, int count, float phase) {
  if(count == 0) return vec4(0.0);
  vec4 previous = recordAt(source, start+1);
  float position = recordAt(source, start).x;
  if(phase < position) return previous;
  for(int i=1; i<count; i++) {
    float nextPosition = recordAt(source, start+i*2).x;
    vec4 nextColor = recordAt(source, start+i*2+1);
    if(phase < nextPosition) return mix(previous, nextColor, clamp((phase-position)/(nextPosition-position),0.0,1.0));
    position = nextPosition;
    previous = nextColor;
  }
  return previous;
}
vec4 materialColor(int source, vec2 uv) {
  int count = int(recordAt(source,0).x);
  int offset = 1;
  vec4 result = vec4(0.0);
  for(int i=0; i<count; i++) {
    vec4 header = recordAt(source,offset);
    float phase = phaseAt(int(header.x),uv,recordAt(source,offset+1),recordAt(source,offset+2));
    vec4 color = stopColor(source,offset+3,int(header.y),phase);
    color = vec4(color.rgb*color.a,color.a);
    result = color + result*(1.0-color.a);
    offset = int(header.z);
  }
  return result;
}`

const gpuEvaluation = `
fn parameter(source: u32, index: i32) -> f32 {
  let bytes = vec4<u32>(round(parameterBytes(source, index)*255.0));
  return bitcast<f32>(bytes.r | (bytes.g << 8u) | (bytes.b << 16u) | (bytes.a << 24u));
}
fn recordAt(source: u32, index: i32) -> vec4<f32> {
  let offset = index*4;
  return vec4<f32>(parameter(source,offset),parameter(source,offset+1),parameter(source,offset+2),parameter(source,offset+3));
}
fn phaseAt(mode: i32, uv: vec2<f32>, axis: vec4<f32>, side: vec4<f32>) -> f32 {
  let d = axis.zw-axis.xy;
  let p = uv-axis.xy;
  let length2 = dot(d,d);
  if(length2 == 0.0) { return 0.0; }
  if(mode == 1) { return dot(p,d)/length2; }
  if(mode == 3) {
    let phase = (atan2(p.y,p.x)-atan2(d.y,d.x))/6.283185307179586;
    return phase-floor(phase);
  }
  var second = vec2<f32>(-d.y,d.x);
  if(side.z > 0.5) { second = side.xy-axis.xy; }
  let determinant = d.x*second.y-d.y*second.x;
  if(determinant == 0.0) { return 0.0; }
  let q = vec2<f32>(p.x*second.y-p.y*second.x,d.x*p.y-d.y*p.x)/determinant;
  if(mode == 2) { return length(q); }
  return abs(q.x)+abs(q.y);
}
fn stopColor(source: u32, start: i32, count: i32, phase: f32) -> vec4<f32> {
  if(count == 0) { return vec4<f32>(0.0); }
  var previous = recordAt(source,start+1);
  var position = recordAt(source,start).x;
  if(phase < position) { return previous; }
  for(var i=1; i<count; i++) {
    let nextPosition = recordAt(source,start+i*2).x;
    let nextColor = recordAt(source,start+i*2+1);
    if(phase < nextPosition) { return mix(previous,nextColor,clamp((phase-position)/(nextPosition-position),0.0,1.0)); }
    position = nextPosition;
    previous = nextColor;
  }
  return previous;
}
fn materialColor(source: u32, uv: vec2<f32>) -> vec4<f32> {
  let count = i32(recordAt(source,0).x);
  var offset = 1;
  var result = vec4<f32>(0.0);
  for(var i=0; i<count; i++) {
    let header = recordAt(source,offset);
    let phase = phaseAt(i32(header.x),uv,recordAt(source,offset+1),recordAt(source,offset+2));
    var color = stopColor(source,offset+3,i32(header.y),phase);
    color = vec4<f32>(color.rgb*color.a,color.a);
    result = color+result*(1.0-color.a);
    offset = i32(header.z);
  }
  return result;
}`

export const createMeshMaterialShader = (maxTextures: number): Shader => {
  const textureIds = Array.from({ length: maxTextures }, (_, i) => i)
  const glMaterial = {
    name: 'analytic-mesh-material',
    vertex: {
      header:
        'in vec2 aTextureIdAndRound; out float vTextureId; flat out float vMaterial;',
      main: 'vTextureId = aTextureIdAndRound.y; vMaterial = floor(aTextureIdAndRound.x / 2.0);',
      end: 'if(mod(aTextureIdAndRound.x,2.0) == 1.0) { gl_Position.xy = roundPixels(gl_Position.xy, uResolution); }'
    },
    fragment: {
      header: `in float vTextureId; flat in float vMaterial; uniform sampler2D uTextures[${maxTextures}];\nvec4 parameterBytes(int source, int index) {\nswitch(source) {\n${textureIds.map((i) => `case ${i}: { ivec2 size = textureSize(uTextures[${i}],0); return texelFetch(uTextures[${i}],ivec2(index % size.x,index / size.x),0); }`).join('\n')}\n}\nreturn vec4(0.0);\n}\n${glEvaluation}`,
      main:
        'vec2 uvDx = dFdx(vUV); vec2 uvDy = dFdy(vUV);\nif(vMaterial > 0.5) { outColor = materialColor(int(vTextureId+0.5),vUV); } else {\n' +
        textureIds
          .map(
            (i) =>
              `${i ? 'else ' : ''}if(vTextureId < ${i}.5) { outColor = textureGrad(uTextures[${i}],vUV,uvDx,uvDy); }`
          )
          .join('\n') +
        '\n}'
    }
  }
  const gpuMaterial = {
    name: 'analytic-mesh-material',
    vertex: {
      header:
        '@in aTextureIdAndRound: vec2<u32>;\n@out @interpolate(flat) vTextureId: u32;\n@out @interpolate(flat) vMaterial: u32;',
      main: 'vTextureId = aTextureIdAndRound.y; vMaterial = aTextureIdAndRound.x >> 1u;',
      end: 'if((aTextureIdAndRound.x & 1u) == 1u) { vPosition = vec4<f32>(roundPixels(vPosition.xy,globalUniforms.uResolution),vPosition.zw); }'
    },
    fragment: {
      header: `@in @interpolate(flat) vTextureId: u32;\n@in @interpolate(flat) vMaterial: u32;\n${textureIds.map((i) => `@group(1) @binding(${i * 2}) var materialSource${i}: texture_2d<f32>;\n@group(1) @binding(${i * 2 + 1}) var materialSampler${i}: sampler;`).join('\n')}\nfn parameterBytes(source: u32,index: i32) -> vec4<f32> { switch source { ${textureIds.map((i) => `${i === maxTextures - 1 ? 'default' : `case ${i}`}: { let size = textureDimensions(materialSource${i}); return textureLoad(materialSource${i},vec2<i32>(index % i32(size.x),index / i32(size.x)),0); }`).join('\n')} } }\n${gpuEvaluation}`,
      main: `let uvDx = dpdx(vUV); let uvDy = dpdy(vUV);\nif(vMaterial == 1u) { outColor = materialColor(vTextureId,vUV); } else { switch vTextureId { ${textureIds.map((i) => `${i === maxTextures - 1 ? 'default' : `case ${i}`}:{ outColor = textureSampleGrad(materialSource${i},materialSampler${i},vUV,uvDx,uvDy); break; }`).join('\n')} } }`
    }
  }
  return new Shader({
    glProgram: GlProgram.from({
      name: 'analytic-mesh-material',
      preferredFragmentPrecision: 'highp',
      ...compileHighShaderGl({
        template: {
          vertex: '#version 300 es\nprecision highp int;\n' + vertexGlTemplate,
          fragment:
            '#version 300 es\nprecision highp int;\n' + fragmentGlTemplate
        },
        bits: [globalUniformsBitGl, colorBitGl, glMaterial, roundPixelsBitGl]
      })
    }),
    gpuProgram: compileHighShaderGpuProgram({
      name: 'analytic-mesh-material',
      bits: [colorBit, gpuMaterial, roundPixelsBit]
    }),
    resources: { batchSamplers: getBatchSamplersUniformGroup(maxTextures) }
  })
}
