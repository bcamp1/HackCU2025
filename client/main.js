import * as THREE from "three"
import { Scene } from "./scene.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

const socket = new WebSocket("ws://localhost:8080/ws")

socket.addEventListener("open", function (event) {
	console.log("Connected to WebSocket server")
})

var troops = []
var commandBuffer = []

InitScene()
var gameState = {}

async function InitScene() {
	const models = await loadModels()
	const scene = new Scene("threejs-container", models)
	scene.startAnimationLoop()

	function step() {
		Object.entries(troops).forEach((value, _) => {
			const troop = value[1]
			const id = value[0]
			if (scene.troops[troop.player][id] === undefined) {
				scene.addTroop(id, troop.player, troop.pos.x, troop.pos.y, troop.pos.z)
			} else {
				scene.moveTroop(id, troop.player, troop.pos.x, troop.pos.y, troop.pos.z)
			}
		})
	}

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


    window.addEventListener("wheel", (event) => {
        console.log(scene.zoom)
        const minZoom = 0.5;
        const maxZoom = 3.0;
        const zoomSensitivity = 0.001; 
        event.preventDefault(); 

        // Adjust zoom based on the vertical scroll amount (deltaY)
        scene.zoom += event.deltaY * zoomSensitivity;
        scene.zoom = Math.min(maxZoom, Math.max(minZoom, scene.zoom));
        scene.updateCamera();
    }, { passive: false });

	window.addEventListener("contextmenu", (event) => {
		event.preventDefault()
	})

	socket.addEventListener("message", function (event) {
		gameState = JSON.parse(event.data)

		if (scene.commandBuffer.length > 0) {
			console.log("Sending message buffer", scene.commandBuffer)
			socket.send(JSON.stringify(scene.commandBuffer))
			scene.commandBuffer = []
		} else {
			socket.send(JSON.stringify([{ noop: true }]))
		}
		// console.log("Received game state", gameState)

		step()
		// You can handle the incoming message here
	})

	function step() {
		Object.keys(gameState["players"]).forEach((pId, _) => {
			const playerData = gameState["players"][pId]
			Object.keys(playerData["fighters"]).forEach((key, _) => {
				const fighter = playerData["fighters"][key]
				if (!Object.keys(scene.fighters).includes(pId)) {
					scene.fighters[pId] = {}
				}
				if (scene.fighters[pId][fighter.id] === undefined) {
					scene.addFighter(
						fighter.id,
						pId,
						fighter.type,
						fighter.position.x,
						fighter.position.y,
						fighter.position.z
					)
				} else {
					scene.moveFighter(
						fighter.id,
						pId,
						fighter.position.x,
						fighter.position.y,
						fighter.position.z
					)
				}
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
