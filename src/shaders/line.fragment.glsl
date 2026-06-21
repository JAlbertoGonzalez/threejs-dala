// Shader de fragmento para líneas con opacidad basada en profundidad
uniform float uOpacity;

varying float vDepth;
varying float vReveal;

void main() {
    // Ajusta estos valores para controlar el rango de transparencia
    float minDepth = 0.2;
    float maxDepth = 2.0;
    float depthAlpha = 1.0 - smoothstep(minDepth, maxDepth, vDepth);
    float alpha = depthAlpha * vReveal;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.72 * uOpacity); // Blanco, opacidad controlada por capa
    if (gl_FragColor.a < 0.005) discard;
}