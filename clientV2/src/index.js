import * as THREE from "three"
import { Scene } from "./scene.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

InitScene()
var gameState = {}

const urlSearchParams = new URLSearchParams(window.location.search)
const port = urlSearchParams.get("portNumber")
const host = "10.0.0.186"
console.log("HELLP")



async function InitScene() {
	const models = await loadModels()
	const scene = new Scene("threejs-container", models)
	scene.startAnimationLoop()

	// const socket = new WebSocket("ws://10.0.0.43:8080/ws")
	const socket = new WebSocket(`ws://${host}:8080/${port}`)

	window.addEventListener('keydown', (event) => {
		if (event.key.toLowerCase() === 't') {
			const command = prompt("Enter terminal command:")
			console.log("Sending command: " + command);
			const messageMap = {
				"messageType": "command",
				"data": {
					"command": command
				}
			}
			socket.send(JSON.stringify(messageMap))
			console.log(JSON.stringify(messageMap))
		}
	});

	socket.addEventListener("open", function (event) {
		console.log("Connected to server", event.data)
	})

	socket.addEventListener("error", function (event) {
		console.error("Error connecting to server", event)
	})
	// UI interaction: Rotate the cube when the button is clicked
	// ADD HOUSE BUTTON
	// ADD HOUSE BUTTON
	const addHouseButton = document.getElementById("addHouse")
	addHouseButton?.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "house"
	})
	// ADD TOWN HALL BUTTON
	const addTownHallButton = document.getElementById("addTownHall")
	addTownHallButton?.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "townhall"
	})
	// ADD BARRACKS BUTTON
	const addBarracksButton = document.getElementById("addBarracks")
	addBarracksButton?.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "barracks"
	})
	const addKnight = document.getElementById("addKnight")
	addKnight?.addEventListener("click", () => {
		console.log("Adding knight")
		scene.commandBuffer.push({ createKnight: { some: "knight" } })
	})
	// ADD BARRACKS BUTTON
	const addWorker = document.getElementById("addWorker")
	addWorker?.addEventListener("click", () => {
		scene.commandBuffer.push({ createBuilder: { some: "builder" } })
	})

	const playerNumElem = document.getElementById("player-number")

	const goldDisplay = document.getElementById("gold")
	const woodDisplay = document.getElementById("wood")
	const stoneDisplay = document.getElementById("stone")
	const populationDisplay = document.getElementById("population")
	const playerLabel = document.getElementById("player-label")

	// Handle resizing
	// window.addEventListener("resize", () => {
	// 	camera.aspect = window.innerWidth / window.innerHeight
	// 	camera.updateProjectionMatrix()
	// 	renderer.setSize(window.innerWidth, window.innerHeight)
	// })

	window.addEventListener("mousemove", (event) => {
		scene.mouseX = (event.clientX / window.innerWidth) * 2 - 1
		scene.mouseY = -(event.clientY / window.innerHeight) * 2 + 1
	})

	window.addEventListener("keydown", (event) => {
		scene.keysPressed[event.key] = true
		if (event.key === "1") {
			scene.moveType = 1
		} else if (event.key === "2") {
			scene.moveType = 0
		}
	})

	window.addEventListener("keyup", (event) => {
		scene.keysPressed[event.key] = false
	})

	window.addEventListener(
		"wheel",
		(event) => {
			const minZoom = 0.5
			const maxZoom = 3.0
			const zoomSensitivity = 0.001
			event.preventDefault()

			// Adjust zoom based on the vertical scroll amount (deltaY)
			scene.zoom += event.deltaY * zoomSensitivity
			scene.zoom = Math.min(maxZoom, Math.max(minZoom, scene.zoom))
			scene.updateCamera()
		},
		{ passive: false }
	)

	window.addEventListener("contextmenu", (event) => {
		event.preventDefault()
	})

	const handleMessage = (event) => {
		const message = JSON.parse(event.data)
		console.log(message)
		switch (message.messageType) {
			case "playerNumber":
				playerNumElem.innerText = `${message.data.playerNumber}`
				break
			case "commandResponse":
				break
			default:
				console.log("Unknown message type", message.type)
		}
	}

	socket.addEventListener("message", function (event) {
		handleMessage(event)
	})
}

async function loadModels() {
	var modelsDict = {}
	const houseModel_red = await loadModel(
		"public/models/buildings/house/house_red.glb"
	)
	const houseModel_blue = await loadModel(
		"public/models/buildings/house/house_blue.glb"
	)
	const townhallModel_red = await loadModel(
		"public/models/buildings/townhall/townhall_red.glb"
	)
	const townhallModel_blue = await loadModel(
		"public/models/buildings/townhall/townhall_blue.glb"
	)
	const barracksModel_red = await loadModel(
		"public/models/buildings/barracks/barracks_red.glb"
	)
	const barracksModel_blue = await loadModel(
		"public/models/buildings/barracks/barracks_blue.glb"
	)
	const goldModel = await loadModelResource(
		"public/models/buildings/nodes/gold/gold.glb"
	)
	const stoneModel = await loadModelResource(
		"public/models/buildings/nodes/stone/stone.glb"
	)
	const wood = await loadModelResource(
		"public/models/buildings/nodes/wood/wood.glb"
	)
	const knight_red_idle = await loadModelResource(
		"public/models/characters/knight_red/knight_red_idle.glb"
	)
	const knight_blue_idle = await loadModelResource(
		"public/models/characters/knight_blue/knight_blue_idle.glb"
	)
	const knight_red_attack = await loadModelResource(
		"public/models/characters/knight_red/knight_red_attack.glb"
	)
	const knight_blue_attack = await loadModelResource(
		"public/models/characters/knight_blue/knight_blue_attack.glb"
	)
	const worker_red = await loadModelResource(
		"public/models/characters/worker/worker_red.glb"
	)
	const worker_blue = await loadModelResource(
		"public/models/characters/worker/worker_blue.glb"
	)
	modelsDict.house = [houseModel_blue, houseModel_red]
	modelsDict.townhall = [townhallModel_blue, townhallModel_red]
	modelsDict.barracks = [barracksModel_blue, barracksModel_red]
	modelsDict.gold = goldModel
	modelsDict.stone = stoneModel
	modelsDict.wood = wood
	modelsDict.knight_attack = [knight_blue_attack, knight_red_attack]
	modelsDict.knight_idle = [knight_blue_idle, knight_red_idle]
	modelsDict.worker = [worker_blue, worker_red]

	return modelsDict
}

async function loadModel(path) {
	const loader = new GLTFLoader()

	return new Promise((resolve, reject) => {
		loader.load(
			path,
			(gltf) => {
				let model = gltf.scene
				model.rotation.x = -Math.PI / 2

				model.traverse((child) => {
					if (child.isMesh) {
						const edges = new THREE.EdgesGeometry(child.geometry)
						const lineMaterial = new THREE.LineBasicMaterial({
							color: 0x000000,
							linewidth: 10,
						})
						const outline = new THREE.LineSegments(edges, lineMaterial)
						child.userData.outline = outline
						child.add(outline)
						child.castShadow = true
					}
				})
				console.log("Model loaded")
				resolve(model)
			},
			undefined,
			(error) => {
				console.error("Found an error", error)
				reject(error)
			}
		)
	})
}

async function loadModelResource(path) {
	const loader = new GLTFLoader()

	return new Promise((resolve, reject) => {
		loader.load(
			path,
			(gltf) => {
				let model = gltf.scene
				model.rotation.x = -Math.PI / 2

				model.traverse((child) => {
					if (child.isMesh) {
						child.castShadow = true
					}
				})
				console.log("Model loaded")
				resolve(model)
			},
			undefined,
			(error) => {
				console.error("Found an error", error)
				reject(error)
			}
		)
	})
}

async function loadCharacter(path) {
	const loader = new GLTFLoader()

	return new Promise((resolve, reject) => {
		loader.load(
			path,
			(gltf) => {
				let model = gltf.scene
				model.rotation.x = -Math.PI / 2

				model.traverse((child) => {
					if (child.isMesh) {
						child.castShadow = true
					}
				})
				console.log("Model loaded")
				resolve(model)
			},
			undefined,
			(error) => {
				console.error("Found an error", error)
				reject(error)
			}
		)
	})
}
