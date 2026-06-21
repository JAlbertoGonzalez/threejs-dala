// Shader de vértice para líneas con opacidad basada en profundidad
varying float vDepth;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z; // Profundidad en espacio de cámara (positivo hacia adelante)
    gl_Position = projectionMatrix * mvPosition;
}