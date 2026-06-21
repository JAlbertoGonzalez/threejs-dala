varying vec3 vColor;
varying float vDist;
varying vec3 vLocalPos;

void main() {
  // Ajusta estos valores para controlar el rango de transparencia
  float minDist = 0.0;
  float maxDist = 1.2;
  float alpha = 1.0 - smoothstep(minDist, maxDist, vDist);

  // Thin edge mask based on the second-largest local component.
  // For a cube, edges are where two axes are close to the outer boundary.
  vec3 local = abs(vLocalPos);
  float secondLargest = max(min(local.x, local.y), max(min(local.x, local.z), min(local.y, local.z)));
  float smallest = min(local.x, min(local.y, local.z));

  float edgeBand = smoothstep(0.94, 0.985, secondLargest);
  float cornerBand = smoothstep(0.965, 0.995, smallest);
  float edgeOnly = edgeBand * (1.0 - cornerBand);
  edgeOnly = pow(edgeOnly, 2.4);

  vec3 color = mix(vColor, vec3(1.0), edgeOnly * 0.42);
  float finalAlpha = max(alpha, edgeOnly * 0.28);

  gl_FragColor = vec4(color, finalAlpha);
  if (gl_FragColor.a < 0.035) discard;
}
