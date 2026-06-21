varying vec3 vColor;
varying float vDist;

void main() {
  // Ajusta estos valores para controlar el rango de transparencia
  float minDist = 0.0;
  float maxDist = 1.2;
  float alpha = 1.0 - smoothstep(minDist, maxDist, vDist);
  gl_FragColor = vec4(vColor, alpha);
  if (gl_FragColor.a < 0.05) discard;
}
