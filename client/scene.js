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
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.container.appendChild(this.renderer.domElement)
		this.cubes = []

		const planeGeometry = new THREE.PlaneGeometry(100, 100)
		const planeMaterial = new THREE.MeshBasicMaterial({
			color: 0xaaaaaa,
			side: THREE.DoubleSide,
		})
		const plane = new THREE.Mesh(planeGeometry, planeMaterial)
		plane.rotation.x = -Math.PI / 2
		this.scene.add(plane)

		this.camera.position.set(0, 5, 11)
		// Make sure the camera looks towards the origin (where the plane is centered)
		this.camera.lookAt(new THREE.Vector3(0, 0, 0))

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
		const geometry = new THREE.BoxGeometry(l, l, l)
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
		const cube = new THREE.Mesh(geometry, material)
		cube.position.set(x, y, z)
		cube.castShadow = true
		const edges = new THREE.EdgesGeometry(cube.geometry)
		const lineMaterial = new THREE.LineBasicMaterial({
			color: 0x000000,
			linewidth: 5,
		})
		const outline = new THREE.LineSegments(edges, lineMaterial)
		cube.add(outline)
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
