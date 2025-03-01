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
		this.cubes = []

		this.camera.position.z = 20

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

	addCube(x, y, z, l) {
		this.geometry = new THREE.BoxGeometry(l, l, l)
		this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
		const cube = new THREE.Mesh(this.geometry, this.material)
		cube.position.set(x, y, z)
		this.cubes.push(cube)
		this.scene.add(cube)
	}

	startAnimationLoop() {
		this.renderer.setAnimationLoop(this.animate.bind(this))
	}

	rotateCube(x, y) {
		this.cube.rotation.x += x
		this.cube.rotation.y += y
	}
}
