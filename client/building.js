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
        if(this.type == "house" || 1) {
            this.model = this.modelsDict.house.clone();
            this.model.position.copy(this.gridPosition);
            scene.add(this.model);

            this.materialsColors = [];
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.receiveShadow = true;
                    this.materialsColors.push(child.material.color);
                }
            });

            this.width = 2;
            this.height = 2;
            this.health = 100;
        } else if(this.type == "townhall") {
            const tall = 1.4;
            const geometry = new THREE.BoxGeometry(2, tall, 2);
            const material = new THREE.MeshLambertMaterial({ color: 0xdbcba9, shadowSide: THREE.DoubleSide });
            this.mesh = new THREE.Mesh(geometry, material);
            this.offset = new THREE.Vector3(1, tall/2, 1);
            this.mesh.position.set(x + this.offset.x, y + this.offset.y, z + this.offset.z);
            this.mesh.castShadow = true;
            const edges = new THREE.EdgesGeometry(this.mesh.geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
            this.outline = new THREE.LineSegments(edges, lineMaterial);
            this.mesh.add(this.outline);

            this.width = 2;
            this.height = 2;
            this.health = 100;
        }
    }

    async loadModel(type) {
        
    }

    moveTo(position) {
        // this.mesh.position.set(position.x + this.offset.x, position.y + this.offset.y, position.z + this.offset.z);
        this.gridPosition = position;
        this.model.position.copy(this.gridPosition);
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
        // scene.add(this.mesh);
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
                child.material.transparent = true;
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
                child.material.transparent = true;
                child.material.color = obstructedColor;
                child.material.opacity = 0.4;
            }
        });
    }

    changeRenderOrder() {
        // currentTEMP.setVisible(true);
        // currentTEMP.mesh.material.transparent = true
        // currentTEMP.outline.renderOrder = 999;
        // currentTEMP.outline.material.depthTest = false;
    }
}