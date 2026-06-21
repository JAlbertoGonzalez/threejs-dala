// Shader de vértice para líneas con opacidad por profundidad y proximidad al puntero.
uniform vec3 uPointer;
uniform float uHover;

varying float vDepth;
varying float vReveal;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    float d = distance(uPointer, worldPos);
    // Reveal algo más amplio para reforzar visibilidad sin invadir toda la malla.
    float nearPointer = smoothstep(0.68, 0.14, d);
    vReveal = nearPointer * uHover;
    vDepth = -mvPosition.z; // Profundidad en espacio de cámara (positivo hacia adelante)
    gl_Position = projectionMatrix * mvPosition;
}