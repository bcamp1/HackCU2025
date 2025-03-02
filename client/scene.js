import * as THREE from "three"
import { SelectionBox } from "three/addons/interactive/SelectionBox.js"
import { SelectionHelper } from "three/addons/interactive/SelectionHelper.js"

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
		this.troops = { p1: {}, p2: {} }
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
		this.camera.lookAt(new THREE.Vector3(0, 0, 0))
		this.selectionBox = new SelectionBox(this.camera, this.scene)
		this.helper = new SelectionHelper(this.renderer, "selectBox")

		window.addEventListener("resize", this.onWindowResize.bind(this))
		this.container.addEventListener("mousedown", this.onMouseDown.bind(this))
		this.container.addEventListener("mousemove", this.onMouseMove.bind(this))
		this.container.addEventListener("mouseup", this.onMouseUp.bind(this))
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	onMouseDown(e) {
		e.preventDefault()
		for (const item of this.selectionBox.collection) {
			if (!item.isSelectable) {
				continue
			}
			item.material.color.set(0x00ff00)
		}
		this.selectionBox.startPoint.set(
			(e.clientX / window.innerWidth) * 2 - 1,
			(-e.clientY / window.innerHeight) * 2 + 1,
			0.5
		)
	}

	onMouseMove(e) {
		if (this.helper.isDown) {
			for (let i = 0; i < this.selectionBox.collection.length; i++) {
				if (!this.selectionBox.collection[i].isSelectable) {
					continue
				}
				this.selectionBox.collection[i].material.color.set(0x000000)
			}

			this.selectionBox.endPoint.set(
				(e.clientX / window.innerWidth) * 2 - 1,
				-(e.clientY / window.innerHeight) * 2 + 1,
				0.5
			)

			const allSelected = this.selectionBox.select()

			for (let i = 0; i < allSelected.length; i++) {
				if (!allSelected[i].isSelectable) {
					continue
				}
				allSelected[i].material.color.set(0xffffff)
			}
		}
	}

	onMouseUp(event) {
		this.selectionBox.endPoint.set(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1,
			0.5
		)

		const allSelected = this.selectionBox.select()

		for (let i = 0; i < allSelected.length; i++) {
			if (!allSelected[i].isSelectable) {
				continue
			}
			allSelected[i].material.emissive.set(0xffffff)
		}
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

	addTroop(id, player, x, y, z) {
		const geometry = new THREE.BoxGeometry(1, 1, 1)
		const material = new THREE.MeshBasicMaterial({ color: 0x1167ad })
		const cube = new THREE.Mesh(geometry, material)
		cube.position.set(x, y, z)
		cube.castShadow = true
		cube.isSelectable = true
		const edges = new THREE.EdgesGeometry(cube.geometry)
		const lineMaterial = new THREE.LineBasicMaterial({
			color: 0x000000,
			linewidth: 5,
		})
		const outline = new THREE.LineSegments(edges, lineMaterial)
		cube.add(outline)
		this.troops[player][id] = cube
		this.scene.add(cube)
	}

	moveTroop(id, player, x, y, z) {
		const troop = this.troops[player][id]
		troop.position.set(x, y, z)
	}

	startAnimationLoop() {
		this.renderer.setAnimationLoop(this.animate.bind(this))
	}

	rotateCube(x, y) {
		this.cube.rotation.x += x
		this.cube.rotation.y += y
	}
}
