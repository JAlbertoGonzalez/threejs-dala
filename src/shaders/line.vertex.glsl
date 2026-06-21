// Shader de vértice para líneas con opacidad por profundidad y proximidad al puntero.
uniform vec3 uPointer;
uniform float uHover;

varying float vDepth;
varying float vReveal;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    float d = distance(uPointer, worldPos);
    // Reveal más amplio para que el efecto sea visible incluso con pequeños movimientos.
    float nearPointer = smoothstep(0.6, 0.12, d);
    vReveal = nearPointer * uHover;
    vDepth = -mvPosition.z; // Profundidad en espacio de cámara (positivo hacia adelante)
    gl_Position = projectionMatrix * mvPosition;
}