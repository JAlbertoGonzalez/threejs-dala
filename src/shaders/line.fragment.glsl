// Shader de fragmento para líneas con opacidad basada en profundidad
varying float vDepth;

void main() {
    // Ajusta estos valores para controlar el rango de transparencia
    float minDepth = 0.2;
    float maxDepth = 2.0;
    float alpha = 1.0 - smoothstep(minDepth, maxDepth, vDepth);
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.25); // Blanco, máximo 0.25 de opacidad
    if (gl_FragColor.a < 0.01) discard;
}