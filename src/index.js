
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  LoadingManager,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three'

// Remove this if you don't need to load any 3D model
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'

import { gsap } from 'gsap'
import Stats from 'stats.js'

const stats = new Stats()
// document.body.appendChild(stats.dom)

class App {
  constructor(container) {
    this.container = document.querySelector(container)

    this.hover = false

    this.colors = [
      new Color(0x963CBD),
      new Color(0xFF6F61),
      new Color(0xC5299B),
      new Color(0xFEAE51)
    ]

    this.uniforms = {
      uHover: 0
    }

    this.touchActive = false
    this.lastInputSource = 'mouse'
    this.lineMaterials = []

    this._resizeCb = () => this._onResize()
    this._mousemoveCb = e => this._onMousemove(e)
    this._touchstartCb = e => this._onTouchstart(e)
    this._touchmoveCb = e => this._onTouchmove(e)
    this._touchendCb = () => this._onTouchend()
  }

  _addLights() {
    // Luz ambiental suave
    const ambientLight = new AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    // Luz direccional
    const directionalLight = new DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 2)
    this.scene.add(directionalLight)
  }

  init() {
    this._createScene()

  this._createCamera()
  this._createRenderer()
  this._createRaycaster()
  this._createLoader()
  this._addLights()
  this._checkMobile()

    this._loadModel().then(() => {
      this._addListeners()

      this.renderer.setAnimationLoop(() => {
        stats.begin()

        this._update()
        this._render()

        stats.end()
      })

      console.log(this)
    })
  }

  destroy() {
    gsap.killTweensOf(this.camera?.position)
    gsap.killTweensOf(this.point)
    gsap.killTweensOf(this.uniforms)
    this.renderer.dispose()
    this._removeListeners()
  }

  _update() {
    this.camera.lookAt(0, 0, 0)

    if (this.isMobile) {
      this.camera.position.z = 2.3
    }
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
    this.camera.position.set(0, 0, 1.2)
  }

  _createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio === 1
    })

    this.container.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
    this.renderer.physicallyCorrectLights = true
  }

  _createLoader() {
    this.loadingManager = new LoadingManager()

    this.loadingManager.onLoad = () => {
      document.documentElement.classList.add('model-loaded')
    }

    this.gltfLoader = new GLTFLoader(this.loadingManager)
  }

  /**
   * Load the 3D model and position a set of `InstancedMesh` on each vertex.
   */
  _loadModel() {
    return new Promise(resolve => {
      this.gltfLoader.load('./brain.glb', gltf => {
        // The brain model is not added to the scene porque no es necesario para el raycaster.
        this.brain = gltf.scene.children[0]

        // Visualización de conectores (aristas) entre vértices
        const edges = new EdgesGeometry(this.brain.geometry)
        const lineLayers = [
          { scale: 1.0, opacity: 1.0 },
          { scale: 1.007, opacity: 0.62 },
          { scale: 1.014, opacity: 0.34 }
        ]

        this.lineMaterials = []

        lineLayers.forEach(layer => {
          const lineMaterial = new ShaderMaterial({
            vertexShader: require('./shaders/line.vertex.glsl'),
            fragmentShader: require('./shaders/line.fragment.glsl'),
            uniforms: {
              uPointer: { value: new Vector3() },
              uHover: { value: this.uniforms.uHover },
              uOpacity: { value: layer.opacity }
            },
            transparent: true
          })

          const lines = new LineSegments(edges, lineMaterial)
          lines.scale.setScalar(layer.scale)
          this.scene.add(lines)
          this.lineMaterials.push(lineMaterial)
        })

        // Create the `InstancedMesh`
        const geometry = new BoxGeometry(0.004, 0.004, 0.004, 1, 1, 1)

        const material = new ShaderMaterial({
          vertexShader: require('./shaders/brain.vertex.glsl'),
          fragmentShader: require('./shaders/brain.fragment.glsl'),
          uniforms: {
            uPointer: { value: new Vector3() },
            uColor: { value: new Color() },
            uRotation: { value: 0 },
            uSize: { value: 0 },
            uHover: { value: this.uniforms.uHover }
          }
        })

        this.instancedMesh = new InstancedUniformsMesh(geometry, material, this.brain.geometry.attributes.position.count)

        // Add the `InstancedMesh` to the scene
        this.scene.add(this.instancedMesh)

        // Dummy `Object3D` que contendrá la matriz de cada instancia
        const dummy = new Object3D()

        // Obtener los valores X, Y y Z de cada vértice de la geometría y usarlos para
        // posicionar cada instancia. También setear los uniforms `uColor` y `uRotation`.
        const positions = this.brain.geometry.attributes.position.array
        for (let i = 0; i < positions.length; i += 3) {
          dummy.position.set(
            positions[i + 0],
            positions[i + 1],
            positions[i + 2]
          )

          dummy.updateMatrix()

          this.instancedMesh.setMatrixAt(i / 3, dummy.matrix)

          this.instancedMesh.setUniformAt('uRotation', i / 3, MathUtils.randFloat(-3.14, 3.14))

          this.instancedMesh.setUniformAt('uSize', i / 3, MathUtils.randFloat(0.3, 3))

          const colorIndex = MathUtils.randInt(0, this.colors.length - 1)
          this.instancedMesh.setUniformAt('uColor', i / 3, this.colors[colorIndex])
        }

        resolve()
      })
    })
  }

  _createRaycaster() {
    this.mouse = new Vector2()
    this.raycaster = new Raycaster()
    this.intersects = []
    this.point = new Vector3()
  }

  _addListeners() {
    window.addEventListener('resize', this._resizeCb, { passive: true })
    window.addEventListener('mousemove', this._mousemoveCb, { passive: true })
    window.addEventListener('touchstart', this._touchstartCb, { passive: true })
    window.addEventListener('touchmove', this._touchmoveCb, { passive: true })
    window.addEventListener('touchend', this._touchendCb, { passive: true })
    window.addEventListener('touchcancel', this._touchendCb, { passive: true })
  }

  _removeListeners() {
    window.removeEventListener('resize', this._resizeCb, { passive: true })
    window.removeEventListener('mousemove', this._mousemoveCb, { passive: true })
    window.removeEventListener('touchstart', this._touchstartCb, { passive: true })
    window.removeEventListener('touchmove', this._touchmoveCb, { passive: true })
    window.removeEventListener('touchend', this._touchendCb, { passive: true })
    window.removeEventListener('touchcancel', this._touchendCb, { passive: true })
  }

  _onMousemove(e) {
    if (this.touchActive) {
      return
    }

    this._handlePointerMoveFromClientCoords(e.clientX, e.clientY, 'mouse')
  }

  _onTouchstart(e) {
    if (!e.touches || e.touches.length === 0) {
      return
    }

    this.touchActive = true
    const touch = e.touches[0]
    this._handlePointerMoveFromClientCoords(touch.clientX, touch.clientY, 'touch')
  }

  _onTouchmove(e) {
    if (!e.touches || e.touches.length === 0) {
      return
    }

    this.touchActive = true
    const touch = e.touches[0]
    this._handlePointerMoveFromClientCoords(touch.clientX, touch.clientY, 'touch')
  }

  _onTouchend() {
    this.touchActive = false

    if (this.hover) {
      this.hover = false
      this._animateHoverUniform(0)
    }
  }

  _handlePointerMoveFromClientCoords(clientX, clientY, source) {
    if (!this.brain || !this.instancedMesh || !Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return
    }

    this.lastInputSource = source

    const x = clientX / this.container.offsetWidth * 2 - 1
    const y = -(clientY / this.container.offsetHeight * 2 - 1)

    this.mouse.set(x, y)

    if (source === 'touch') {
      const cameraFactorX = 0.08
      const cameraFactorY = 0.06

      gsap.to(this.camera.position, {
        x: () => x * cameraFactorX,
        y: () => y * cameraFactorY,
        duration: 0.5
      })
    } else {
      const radius = 1.25
      const yaw = x * Math.PI
      const pitch = y * 1.1

      gsap.to(this.camera.position, {
        x: () => Math.sin(yaw) * Math.cos(pitch) * radius,
        y: () => Math.sin(pitch) * radius,
        z: () => Math.cos(yaw) * Math.cos(pitch) * radius,
        duration: 0.55
      })
    }

    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Check if the ray casted by the `Raycaster` intersects with the brain model
    this.intersects = this.raycaster.intersectObject(this.brain)

    if (this.intersects.length === 0) { // Mouseleave
      if (this.hover) {
        this.hover = false
        this._animateHoverUniform(0)
      }
    } else { // Mouseenter
      if (!this.hover) {
        this.hover = true
        this._animateHoverUniform(1)
      }

      // Tween the point to project on the brain mesh
      gsap.to(this.point, {
        x: () => this.intersects[0]?.point.x || 0,
        y: () => this.intersects[0]?.point.y || 0,
        z: () => this.intersects[0]?.point.z || 0,
        overwrite: true,
        duration: 0.3,
        onUpdate: () => {
          this.lineMaterials.forEach(lineMaterial => {
            lineMaterial.uniforms.uPointer.value.copy(this.point)
          })

          for (let i = 0; i < this.instancedMesh.count; i++) {
            this.instancedMesh.setUniformAt('uPointer', i, this.point)
          }
        }
      })
    }
  }

  _animateHoverUniform(value) {
    gsap.to(this.uniforms, {
      uHover: value,
      duration: 0.25,
      onUpdate: () => {
        this.lineMaterials.forEach(lineMaterial => {
          lineMaterial.uniforms.uHover.value = this.uniforms.uHover
        })

        for (let i = 0; i < this.instancedMesh.count; i++) {
          this.instancedMesh.setUniformAt('uHover', i, this.uniforms.uHover)
        }
      }
    })
  }

  _checkMobile() {
    this.isMobile = window.innerWidth < 767
  }

  _onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this._checkMobile()
  }
}

const app = new App('#app')
app.init()
