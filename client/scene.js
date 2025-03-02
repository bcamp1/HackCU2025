import * as THREE from "three"
import { Building } from "./building.js";

export class Scene {
	constructor(containerId) {
		this.keysPressed = {};
		this.buildings = [];
		this.isBuilding = false;
		this.canBuild = false;
		this.currentBuildingType = false;
		this.mouseX = 0;
		this.mouseY = 0;

		this.container = document.getElementById(containerId)
		this.scene = new THREE.Scene()
		this.scene.background = new THREE.Color(0x333344);
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.shadowMap.enabled = true;
		this.container.appendChild(this.renderer.domElement);

		// Ground plane
		const groundPlaneSize = 100;
		const planeGeometry = new THREE.PlaneGeometry(groundPlaneSize, groundPlaneSize);
		const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA, shadowSide: THREE.DoubleSide });
		this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
		this.groundPlane.rotation.x = -Math.PI / 2;
		this.groundPlane.receiveShadow = true;
		this.scene.add( this.groundPlane );

		// Grid
		const totalSize = groundPlaneSize;
		const cellSize = 1;
		const divisions = totalSize / cellSize;
		this.grid = new THREE.GridHelper(totalSize, divisions);
		this.scene.add(this.grid);

		// Temporary Buildings
		this.TEMP_house = new Building("house", 0, 0, 0);
		this.scene.add( this.TEMP_house.mesh );
		this.TEMP_house.mesh.visible = false;

		this.TEMP_townhall = new Building("townhall", 0, 0, 0);
		this.scene.add( this.TEMP_townhall.mesh );
		this.TEMP_townhall.mesh.visible = false;

		// TODO: Scene Init

		this.setupLights();
		
		// TODO: REMOVE TO ADD CAMERA CONTROLLER
		this.camera.position.set(0, 5, 11);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));

		window.addEventListener("resize", this.onWindowResize.bind(this))
	}

	/* Add all lights to the scene */
	setupLights() {
		const lights = [
			new THREE.AmbientLight(0xffffff, 0),
			new THREE.DirectionalLight(0xffffff, 3),
			new THREE.DirectionalLight(0xffffff, 0.5),
			new THREE.DirectionalLight(0xffffff, 0.2)
		];

		lights[1].position.set(0.2, 1, 0.2);
		lights[2].position.set(1, 1, 0);
		lights[3].position.set(0, 1, 1);

		lights.forEach(light => {
			if(light.isDirectionalLight) {
				light.castShadow = true;
				light.target.position.set(0, 0, 0);
			}
		});

		this.scene.add(...lights);
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

<<<<<<< HEAD
=======
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

>>>>>>> 612ced3d63d92428df5c82a1031addc16628fdd0
	startAnimationLoop() {
		this.renderer.setAnimationLoop(this.animate.bind(this))
	}

	rotateCube(x, y) {
		this.cube.rotation.x += x
		this.cube.rotation.y += y
	}

	handleClick(mouseButton, mouseX, mouseY) {
		const clickLocation = this.getMouseCoordinatesOnGroundPlane(mouseX, mouseY);
		
		if (this.isBuilding) {
			if(this.canBuild) {
				if(mouseButton == 0 && clickLocation) {
					// Left click
					const buildingCoordinates = this.getGridCoordinates(clickLocation);
					const newBuilding = new Building(this.currentBuildingType, buildingCoordinates.x, buildingCoordinates.y, buildingCoordinates.z);
					this.scene.add( newBuilding.mesh );
					this.buildings.push(newBuilding);
					this.isBuilding = false;
					return;
				} else {
					// Other click
					this.isBuilding = false;
					return;
				}
			} else {
				console.log("Can't Build there!");
			}
		}
	}

	checkGridCollisions(gridLocation, width, height) {
		var collide = false;
		const buildingPositions = [];
		this.buildings.forEach(building => {
			const buildingPos = this.getGridCoordinates(building.mesh.position);
			for(var x = 0; x < building.width; x ++) {
				for(var z = 0; z < building.height; z ++) {
					const posX = buildingPos.x - x;
					const posZ = buildingPos.z - z;
					const loc = new THREE.Vector3(posX, buildingPos.y, posZ);
					buildingPositions.push(loc);
				}
			}
		});

		for(var x = 0; x < width; x ++) {
			for(var z = 0; z < height; z ++) {
				const posX = gridLocation.x + x;
				const posZ = gridLocation.z + z;

				buildingPositions.forEach(buildingPosition => {
					if(Math.abs(posX - buildingPosition.x) < 0.01 && Math.abs(posZ - buildingPosition.z) < 0.01) {
						collide = true;
						return;
					}
				});
			}
		}

		return collide;

	}

	getMouseCoordinatesOnGroundPlane(mouseX, mouseY) {
		const raycaster = new THREE.Raycaster();
		const mousePosition = new THREE.Vector2(mouseX, mouseY);
		raycaster.setFromCamera(mousePosition, this.camera);
		const intersects = raycaster.intersectObject(this.groundPlane);
		if(intersects.length > 0) {
			return intersects[0].point;
		} else {
			return null;
		}
	}

	getGridCoordinates(position) {
		const x = Math.floor(position.x);
		const z = Math.floor(position.z);

		return new THREE.Vector3(x, position.y, z);
	}

	updateCamera() {
		const speed = 0.1; // Adjust speed as needed

		// Move forward
		if (this.keysPressed["ArrowUp"]) {
		  this.camera.position.z -= speed;
		}
		// Move backward
		if (this.keysPressed["ArrowDown"]) {
		  this.camera.position.z += speed;
		}
		// Move left
		if (this.keysPressed["ArrowLeft"]) {
		  this.camera.position.x -= speed;
		}
		// Move right
		if (this.keysPressed["ArrowRight"]) {
		  this.camera.position.x += speed;
		}
		// Move up
		if (this.keysPressed["w"] || this.keysPressed["W"]) {
		  this.camera.position.y += speed;
		}
		// Move down
		if (this.keysPressed["s"] || this.keysPressed["S"]) {
		  this.camera.position.y -= speed;
		}
	}

	animate() {
		this.updateCamera();
		this.grid.visible = this.isBuilding;
		if(this.isBuilding) {
			const groundMousePos = this.getMouseCoordinatesOnGroundPlane(this.mouseX, this.mouseY);
			if(groundMousePos) {
				var currentTEMP = this.TEMP_house;
				if(this.currentBuildingType == "house") {
					currentTEMP = this.TEMP_house;
				} else if(this.currentBuildingType == "townhall") {
					currentTEMP = this.TEMP_townhall;
				}

				currentTEMP.mesh.visible = true;
				currentTEMP.mesh.material.transparent = true;
					
				const gridMousePos = this.getGridCoordinates(groundMousePos);
				currentTEMP.moveTo(gridMousePos);
				const collision = this.checkGridCollisions(gridMousePos, currentTEMP.width, currentTEMP.height);
				if(collision) {
					const obstructedColor = new THREE.Color().setHex( 0x550000 );
					currentTEMP.mesh.material.color = obstructedColor;
					currentTEMP.mesh.scale.set(1.02, 1.02, 1.02);
					currentTEMP.mesh.material.opacity = 0.9;
					this.canBuild = false;
				} else {
					const unobstructedColor = new THREE.Color().setHex( 0x005500 );
					currentTEMP.mesh.material.color = unobstructedColor;
					currentTEMP.mesh.scale.set(1,1,1);
					currentTEMP.mesh.material.opacity = 0.3;
					this.canBuild = true;
				}
				
			}
			
		} else {
			this.TEMP_house.mesh.visible = false;
			this.TEMP_townhall.mesh.visible = false;
			this.canBuild = false;
		}
		this.renderer.render(this.scene, this.camera)
	}
}
