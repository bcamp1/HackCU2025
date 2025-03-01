import * as THREE from "three"

export class Scene {
	constructor(containerId) {
		this.container = document.getElementById(containerId)
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		)
		this.renderer = new THREE.WebGLRenderer()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.container.appendChild(this.renderer.domElement)

		this.geometry = new THREE.BoxGeometry(1, 1, 1)
		this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
		this.cube = new THREE.Mesh(this.geometry, this.material)
		this.scene.add(this.cube)

		this.camera.position.z = 5

		window.addEventListener("resize", this.onWindowResize.bind(this))
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	animate() {
		this.renderer.render(this.scene, this.camera)
	}

	startAnimationLoop() {
		this.renderer.setAnimationLoop(this.animate.bind(this))
	}

	rotateCube(x, y) {
		this.cube.rotation.x += x
		this.cube.rotation.y += y
	}
}
