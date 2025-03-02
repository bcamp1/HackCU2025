import * as THREE from "three"
import { SelectionBox } from "three/addons/interactive/SelectionBox.js"
import { SelectionHelper } from "three/addons/interactive/SelectionHelper.js"
import { Building } from "./building.js"
import { Knight } from "./fighters.js"

export class Scene {
	constructor(containerId, models) {
		this.keysPressed = {}
		this.buildings = []
		this.isBuilding = false
		this.canBuild = false
		this.currentBuildingType = false
		this.mouseX = 0
		this.mouseY = 0
		this.modelsDict = models;
		const Orthographic = true;

		this.fighters = {}
		this.commandBuffer = []
		this.container = document.getElementById(containerId)
		this.scene = new THREE.Scene()
		this.scene.background = new THREE.Color(0x333344)
		
		if (Orthographic) {
			const frustumSize = 20;
			const aspect = window.innerWidth / window.innerHeight;
			this.camera = new THREE.OrthographicCamera(
				-frustumSize * aspect / 2,  // left
				frustumSize * aspect / 2,  // right
				frustumSize / 2,           // top
				-frustumSize / 2,           // bottom
				0.1,                       // near
				1000                       // far
			);
			this.camera.position.set(200, 200, 200);
			this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		} else {
			this.camera = new THREE.PerspectiveCamera(
				75, 
				window.innerWidth / window.innerHeight, 
				0.1,
				1000
			);
			this.camera.position.set(10, 20, 10)
			this.camera.lookAt(new THREE.Vector3(0, 0, 0))
		}
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
		this.renderer.shadowMap.enabled = true
		this.container.appendChild(this.renderer.domElement)

		// Ground plane
		const groundPlaneSize = 100
		const planeGeometry = new THREE.PlaneGeometry(
			groundPlaneSize,
			groundPlaneSize
		)
		const planeMaterial = new THREE.MeshLambertMaterial({
			color: 0x2c7037,
			shadowSide: THREE.DoubleSide,
		})
		this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial)
		this.groundPlane.rotation.x = -Math.PI / 2
		this.groundPlane.receiveShadow = true
		this.scene.add(this.groundPlane)
		this.selectionBox = new SelectionBox(this.camera, this.scene)
		this.helper = new SelectionHelper(this.renderer, "selectBox")
		// Grid
		const totalSize = groundPlaneSize
		const cellSize = 1
		const divisions = totalSize / cellSize
		this.grid = new THREE.GridHelper(totalSize, divisions)
		this.scene.add(this.grid)

		// Temporary Buildings
		this.TEMP_house = new Building("house", 0, 0, 0, this.scene, this.modelsDict);
		this.TEMP_house.setVisible(true);

		this.TEMP_townhall = new Building("townhall", 0, 0, 0, this.scene, this.modelsDict)
		this.TEMP_townhall.setVisible(false);

		// TODO: Scene Init

		this.setupLights()

		window.addEventListener("resize", this.onWindowResize.bind(this))
		this.container.addEventListener("mousedown", this.onMouseDown.bind(this))
		this.container.addEventListener("mousemove", this.onMouseMove.bind(this))
		this.container.addEventListener("mouseup", this.onMouseUp.bind(this))
	}

	/* Add all lights to the scene */
	setupLights() {
		const lights = [
			new THREE.AmbientLight(0xffffff, 0),
			new THREE.DirectionalLight(0xffffff, 3),
			new THREE.DirectionalLight(0xffffff, 0.5),
			new THREE.DirectionalLight(0xffffff, 0.2),
		]

		const d = 100;
		lights[1].position.set(1*d, 1*d, -1*d)
		lights[2].position.set(1*d, 1*d, 0)
		lights[3].position.set(0, 1*d, 1*d)

		lights.forEach((light) => {
			if (light.isDirectionalLight) {
				light.castShadow = true
				light.shadow.mapSize.width = 2048*2;
				light.shadow.mapSize.height = 2048*2;

				light.shadow.camera.left = -d;
				light.shadow.camera.right = d;
				light.shadow.camera.top = d;
				light.shadow.camera.bottom = -d;
				light.shadow.camera.near = 0.1;
				light.shadow.camera.far = 500;
				light.shadow.camera.updateProjectionMatrix();
			}
		})

		this.scene.add(...lights)
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	onMouseDown(e) {
		this.handleClick(e.button, this.mouseX, this.mouseY)
		const clickLocation = this.getMouseCoordinatesOnGroundPlane(
			this.mouseX,
			this.mouseY
		)
		console.log(e.button)
		if (e.button === 2) {
			for (const selection of this.selectionBox.collection) {
				if (!selection.isSelectable || !selection.isMoveable) {
					continue
				}
				this.commandBuffer.push({
					moveTroop: {
						id: selection.entityId,
						pos: {
							x: clickLocation.x + Math.random() * 2 - 1,
							y: 0.5,
							z: clickLocation.z + Math.random() * 2 - 1,
						},
					},
				})
			}
		}
		for (const selection of this.selectionBox.collection) {
			if (!selection.isSelectable) {
				continue
			}

			selection.children[0].material.color.set(0x000000)
		}

		this.selectionBox.startPoint.set(this.mouseX, this.mouseY, 0.5)
	}

	onMouseMove(e) {
		if (this.helper.isDown) {
			for (let i = 0; i < this.selectionBox.collection.length; i++) {
				if (!this.selectionBox.collection[i].isSelectable) {
					continue
				}
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
				console.log(allSelected[i])
				this.selectionBox.collection[i].children[0].material.color.set(0xff0000)
			}
		}
	}

	onMouseUp(event) {
		this.selectionBox.endPoint.set(this.mouseX, this.mouseY, 0.5)

		const allSelected = this.selectionBox.select()

		for (let i = 0; i < allSelected.length; i++) {
			if (!allSelected[i].isSelectable) {
				continue
			}
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

	addFighter(id, player, type, x, y, z) {
		let fighter
		switch (type) {
			case "knight":
				fighter = new Knight(id)
				break
			default:
				fighter = new Knight(id)
				break
		}
		fighter.mesh.position.set(x, y, z)
		fighter.mesh.isSelectable = true
		fighter.mesh.isMoveable = true
		fighter.mesh.entityId = id
		this.fighters[player][id] = fighter
		this.scene.add(fighter.mesh)
	}

	moveFighter(id, player, x, y, z) {
		const fighter = this.fighters[player][id]
		fighter.mesh.position.set(x, y, z)
	}

	startAnimationLoop() {
		this.renderer.setAnimationLoop(this.animate.bind(this))
	}

	rotateCube(x, y) {
		this.cube.rotation.x += x
		this.cube.rotation.y += y
	}

	handleClick(mouseButton, mouseX, mouseY) {
		const clickLocation = this.getMouseCoordinatesOnGroundPlane(mouseX, mouseY)
		
		if (this.isBuilding) {
			if (this.canBuild) {
				if (mouseButton == 0 && clickLocation) {
					// Left click
					const buildingCoordinates = this.getGridCoordinates(clickLocation)
					const newBuilding = new Building(
						this.currentBuildingType,
						buildingCoordinates.x,
						buildingCoordinates.y,
						buildingCoordinates.z,
						this.scene,
						this.modelsDict
					)
					this.buildings.push(newBuilding)
					this.isBuilding = false
					return
				} else {
					// Other click
					this.isBuilding = false
					return
				}
			} else {
				console.log("Can't Build there!")
			}
		}
	}

	checkGridCollisions(gridLocation, width, height) {
		var collide = false
		const buildingPositions = []
		this.buildings.forEach((building) => {
			const buildingPos = building.gridPosition;
			for (var x = 0; x < building.width; x++) {
				for (var z = 0; z < building.height; z++) {
					const posX = buildingPos.x + x
					const posZ = buildingPos.z + z
					const loc = new THREE.Vector3(posX, buildingPos.y, posZ)
					buildingPositions.push(loc)
				}
			}
		})

		for (var x = 0; x < width; x++) {
			for (var z = 0; z < height; z++) {
				const posX = gridLocation.x + x
				const posZ = gridLocation.z + z

				buildingPositions.forEach((buildingPosition) => {
					if (
						Math.abs(posX - buildingPosition.x) < 0.01 &&
						Math.abs(posZ - buildingPosition.z) < 0.01
					) {
						collide = true
						return
					}
				})
			}
		}

		return collide
	}

	getMouseCoordinatesOnGroundPlane(mouseX, mouseY) {
		const raycaster = new THREE.Raycaster()
		const mousePosition = new THREE.Vector2(mouseX, mouseY)
		raycaster.setFromCamera(mousePosition, this.camera)
		const intersects = raycaster.intersectObject(this.groundPlane)
		if (intersects.length > 0) {
			return intersects[0].point
		} else {
			return null
		}
	}

	getGridCoordinates(position) {
		const x = Math.floor(position.x)
		const z = Math.floor(position.z)

		return new THREE.Vector3(x, position.y, z)
	}

	updateCamera() {
		const speed = 0.1 // Adjust speed as needed

		// Move forward
		if (this.keysPressed["ArrowUp"]) {
			this.camera.position.z -= speed*1.4;
			this.camera.position.x -= speed*1.4;
		}
		// Move backward
		if (this.keysPressed["ArrowDown"]) {
			this.camera.position.z += speed*1.4;
			this.camera.position.x += speed*1.4;
		}
		// Move left
		if (this.keysPressed["ArrowLeft"]) {
			this.camera.position.x -= speed
			this.camera.position.z += speed
		}
		// Move right
		if (this.keysPressed["ArrowRight"]) {
			this.camera.position.x += speed
			this.camera.position.z -= speed
		}
		// Move up
		if (this.keysPressed["w"] || this.keysPressed["W"]) {
			this.camera.position.y += speed
		}
		// Move down
		if (this.keysPressed["s"] || this.keysPressed["S"]) {
			this.camera.position.y -= speed
		}
	}

	animate() {
		this.updateCamera()
		this.grid.visible = this.isBuilding
		if (this.isBuilding) {
			const groundMousePos = this.getMouseCoordinatesOnGroundPlane(
				this.mouseX,
				this.mouseY
			)
			if (groundMousePos) {
				var currentTEMP = this.TEMP_house
				if (this.currentBuildingType == "house") {
					currentTEMP = this.TEMP_house
				} else if (this.currentBuildingType == "townhall") {
					currentTEMP = this.TEMP_townhall
				}

				currentTEMP.setVisible(true);
				const gridMousePos = this.getGridCoordinates(groundMousePos)
				currentTEMP.moveTo(gridMousePos)
				const collision = this.checkGridCollisions(
					gridMousePos,
					currentTEMP.width,
					currentTEMP.height
				)
				if (collision) {
					currentTEMP.setAppearance_CantBuild();
					this.canBuild = false
				} else {
					currentTEMP.setAppearance_CanBuild();
					this.canBuild = true
				}
			}
		} else {
			this.TEMP_house.setVisible(false);
			this.TEMP_townhall.setVisible(false);
			this.canBuild = false
		}
		this.renderer.render(this.scene, this.camera)
	}
}
