package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var troops = map[int]struct {
	POS Float3 `json:"pos"`
	PLAYER string `json:"player"`
}{
	0: {POS: Float3 {X: 1, Y: 1, Z: 4}, PLAYER: "p1"},
	1: {POS: Float3 {X: 2, Y: 1, Z: 3},  PLAYER: "p1"},
	2: {POS: Float3 {X: 3, Y: 1, Z: 2},  PLAYER: "p1"},
	3: {POS: Float3 {X: 4, Y: 1, Z: 1},  PLAYER: "p1"},
}

var currentID int = 1



type Float3 struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

func mapToFloat3(m map[string]any) Float3 {
	return Float3{
		X: m["x"].(float64),
		Y: m["y"].(float64),
		Z: m["z"].(float64),
	}
}

type MoveTroopCommand struct {
	ID int `json:"id"`
	POS Float3 `json:"pos"`
}

type PlaceBuildingCommand struct {
	TYPE string `json:"type"`
	POS Float3 `json:"pos"`
}

type AttackCommand struct {
	TARGET_ID int `json:"target_id"`
	ATTACKER_ID int `json:"attacker_id"`
}

func moveTroop(command MoveTroopCommand) {
	troop := troops[command.ID]
	troop.POS = command.POS
	troops[command.ID] = troop
}	


var commands = map[string]func(map[string]any){
	"moveTroop": func(command map[string]any){
		id, idOk := command["id"].(float64)
		pos, posOk := command["pos"].(map[string]any)
		if idOk && posOk {
			moveTroop(MoveTroopCommand{
				ID: int(id),
				POS: Float3{
					X: pos["x"].(float64),
					Y: pos["y"].(float64),
					Z: pos["z"].(float64),
				},
			})
		} else {
			log.Printf("Invalid moveTroop command: %v", command)
		}
	},
	"placeBuilding": func(command map[string]any){
		log.Printf("Place building command")
	},
	"attack": func(command map[string]any){
		log.Printf("Attack command")
	},
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
	defer ws.Close()

	for {
		time.Sleep(50 * time.Millisecond)
		// for i := range troops {
		// 	tempTroop := troops[i]
		// 	tempTroop.POS.X = math.Sin(float64(time.Now().UnixNano()) * 0.000000001)
		// 	troops[i] = tempTroop
		// }
		circleJSON, err := json.Marshal(troops)
		if err != nil {
			log.Printf("Error marshalling JSON: %v", err)
			break
		}
		err = ws.WriteMessage(websocket.TextMessage, circleJSON)
		if err != nil {
			log.Printf("Error writing message: %v", err)
			break
		}

		var msgTemp []map[string]any
		err = ws.ReadJSON(&msgTemp)
		if err != nil {
			log.Printf("Error reading message: %v", err)
		}else{
			if(msgTemp[0]["noop"] != true){
				for key := range msgTemp[0] {
					log.Printf("Key: %v", key)
					log.Printf("Value: %v", msgTemp[0][key])
					if cmd, ok := msgTemp[0][key].(map[string]any); ok {
						commands[key](cmd)
					} else {
						log.Printf("Invalid command format: %v", msgTemp[0][key])
					}
					log.Printf("Troops: %v", troops)
				}
			}
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}