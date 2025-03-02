import * as THREE from "three"
import { Scene } from "./scene.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

InitScene()
var gameState = {}

async function InitScene() {
	const models = await loadModels()
	const scene = new Scene("threejs-container", models)
	scene.startAnimationLoop()

	const socket = new WebSocket("ws://localhost:8080/ws")

	socket.addEventListener("open", function (event) {
		console.log("Connected to server", event.data)
	})

	socket.addEventListener("error", function (event) {
		console.error("Error connecting to server", event)
	})
	// UI interaction: Rotate the cube when the button is clicked
	// ADD HOUSE BUTTON
	document.getElementById("addHouse").addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "house"
	})
	// ADD TOWN HALL BUTTON
	document.getElementById("addTownHall").addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "townhall"
	})
    // ADD BARRACKS BUTTON
    document.getElementById("addBarracks").addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "barracks"
	})


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
	})

	window.addEventListener("keyup", (event) => {
		scene.keysPressed[event.key] = false
	})

	window.addEventListener("contextmenu", (event) => {
		event.preventDefault()
	})

	socket.addEventListener("message", function (event) {
		gameState = JSON.parse(event.data)

		if (scene.commandBuffer.length > 0) {
			socket.send(JSON.stringify(scene.commandBuffer))
			scene.commandBuffer = []
		} else {
			socket.send(JSON.stringify([{ noop: true }]))
		}
		// if we just connected we should get our player id
		if (gameState["playerId"] === undefined) {
			step()
		} else {
			console.log("Game state", gameState)
			scene.playerId = gameState["playerId"]
		}
	})

	function step() {
		Object.keys(gameState["players"]).forEach((pId, _) => {
			const playerData = gameState["players"][pId]
			Object.keys(playerData["fighters"]).forEach((key, _) => {
				const fighter = playerData["fighters"][key]
				if (scene.unitsMap[fighter.id] === undefined) {
					scene.addUnit(
						fighter.id,
						pId,
						fighter.unitType,
						fighter.position.x,
						fighter.position.y,
						fighter.position.z
					)
				} else {
					scene.moveUnit(
						fighter.id,
						fighter.position.x,
						fighter.position.y,
						fighter.position.z
					)
				}
				// todo remove fighter if dead
			})
			Object.keys(playerData["buildings"]).forEach((key, _) => {
				const building = playerData["buildings"][key]
				if (scene.buildingsMap[building.id] === undefined) {
					scene.createBuilding(
						building.id,
						pId,
						building.buildingType,
						building.position.x,
						building.position.z
					)
				}
				// todo remove building if dead
			})
			Object.keys(playerData["builders"]).forEach((key, _) => {
				const builder = playerData["builders"][key]
				if (scene.unitsMap[builder.id] === undefined) {
					scene.addUnit(
						builder.id,
						pId,
						"builder",
						builder.position.x,
						builder.position.y,
						builder.position.z
					)
				} else {
					scene.moveUnit(
						builder.id,
						builder.position.x,
						builder.position.y,
						builder.position.z
					)
				}
				// todo remove building if dead
			})
		})
	}
}

async function loadModels() {
	var modelsDict = {}
	const houseModel = await loadModel(
		"public/models/buildings/house/house_full.glb"
	)
    const townhallModel = await loadModel(
		"public/models/buildings/townhall/townhall_full.glb"
	)
    const barracksModel = await loadModel(
		"public/models/buildings/barracks/barracks_full.glb"
	)
	modelsDict.house = houseModel;
    modelsDict.townhall = townhallModel;
    modelsDict.barracks = barracksModel;

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
                        child.userData.outline = outline;
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
