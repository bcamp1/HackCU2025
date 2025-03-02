import * as THREE from "three"

export class Building {
    /*
    Stores:
    - type ["house", "townhall", ""]
    - health [0-100]
    - mesh
    - width
    - height
    */
    constructor(type, x, y, z, scene, modelsDict) {
        this.type = type;
        this.gridPosition = new THREE.Vector3(x, y, z);
        this.modelsDict = modelsDict;

        // Construct mesh
        if(this.type == "house") {
            this.model = this.modelsDict.house.clone();
            this.offset = new THREE.Vector3(0,0,0);
            this.model.position.set(this.gridPosition.x + this.offset.x, 
                                    this.gridPosition.y + this.offset.y,
                                    this.gridPosition.z + this.offset.z);
            scene.add(this.model);

            this.materialsColors = [];
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.receiveShadow = true;
                    this.materialsColors.push(child.material.color);

                    if (child.userData.outline) {
                        // Remove the old outline from the clone (if it exists)
                        if (child.getObjectById(child.userData.outline.id)) {
                          child.remove(child.userData.outline);
                        }
                        // Create a new outline using the mesh's geometry
                        const edges = new THREE.EdgesGeometry(child.geometry);
                        const lineMaterial = new THREE.LineBasicMaterial({
                          color: 0x000000,
                          linewidth: 10,
                        });
                        const newOutline = new THREE.LineSegments(edges, lineMaterial);
                        // Store the new outline in userData for later reference
                        child.userData.outline = newOutline;
                        child.add(newOutline);
                    }
                }
            });

            this.width = 2;
            this.height = 2;
            this.health = 100;
        } else if(this.type == "townhall") {
            this.model = this.modelsDict.townhall.clone();
            this.offset = new THREE.Vector3(1,0,1);
            this.model.position.set(this.gridPosition.x + this.offset.x, 
                                    this.gridPosition.y + this.offset.y,
                                    this.gridPosition.z + this.offset.z);
            scene.add(this.model);

            this.materialsColors = [];
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.receiveShadow = true;
                    this.materialsColors.push(child.material.color);

                    if (child.userData.outline) {
                        // Remove the old outline from the clone (if it exists)
                        if (child.getObjectById(child.userData.outline.id)) {
                          child.remove(child.userData.outline);
                        }
                        // Create a new outline using the mesh's geometry
                        const edges = new THREE.EdgesGeometry(child.geometry);
                        const lineMaterial = new THREE.LineBasicMaterial({
                          color: 0x000000,
                          linewidth: 10,
                        });
                        const newOutline = new THREE.LineSegments(edges, lineMaterial);
                        // Store the new outline in userData for later reference
                        child.userData.outline = newOutline;
                        child.add(newOutline);
                    }
                }
            });

            this.width = 4;
            this.height = 4;
            this.health = 100;
        } else if(this.type == "barracks") {
            this.model = this.modelsDict.barracks.clone();
            this.offset = new THREE.Vector3(1,0,1);
            this.model.position.set(this.gridPosition.x + this.offset.x, 
                                    this.gridPosition.y + this.offset.y,
                                    this.gridPosition.z + this.offset.z);
            this.model.rotation.z = Math.PI/2;
            scene.add(this.model);

            this.materialsColors = [];
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.receiveShadow = true;
                    this.materialsColors.push(child.material.color);

                    if (child.userData.outline) {
                        // Remove the old outline from the clone (if it exists)
                        if (child.getObjectById(child.userData.outline.id)) {
                          child.remove(child.userData.outline);
                        }
                        // Create a new outline using the mesh's geometry
                        const edges = new THREE.EdgesGeometry(child.geometry);
                        const lineMaterial = new THREE.LineBasicMaterial({
                          color: 0x000000,
                          linewidth: 10,
                        });
                        const newOutline = new THREE.LineSegments(edges, lineMaterial);
                        // Store the new outline in userData for later reference
                        child.userData.outline = newOutline;
                        child.add(newOutline);
                    }
                }
            });

            this.width = 4;
            this.height = 4;
            this.health = 100;
        }
    }

    async loadModel(type) {
        
    }

    moveTo(position) {
        // this.mesh.position.set(position.x + this.offset.x, position.y + this.offset.y, position.z + this.offset.z);
        this.gridPosition = position;
        this.model.position.set(this.gridPosition.x + this.offset.x, 
                                this.gridPosition.y + this.offset.y,
                                this.gridPosition.z + this.offset.z);
    }

    changeHealth(amount) {
        if(this.health + amount > 0) {
            this.health += amount;
            return true;
        } else {
            return false;
        }
    }

    instantiateBuilding(scene) {
        scene.add(this.model);
    }

    setVisible(visible) {
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.visible = visible;
            }
        });
    }

    setAppearance_CanBuild() {
        this.changeRenderOrder();
        const unobstructedColor = new THREE.Color().setHex(0x00ff00)

        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material.color = unobstructedColor;
                child.material.opacity = 0.3;
            }
        });
    }

    setAppearance_CantBuild() {
        this.changeRenderOrder();
        const obstructedColor = new THREE.Color().setHex(0xff0000)

        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material.color = obstructedColor;
                child.material.opacity = 0.4;
            }
        });
    }

    changeRenderOrder() {
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material.transparent = true;
                if(child.userData.outline) {
                    child.userData.outline.renderOrder = 1000; 
                    child.userData.outline.material.depthTest = false;
                }
            }
        });
    }
}