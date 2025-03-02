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

var game Game


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


var commands = map[string]func(map[string]any){
	"moveTroop": func(command map[string]any){
		pos := mapToFloat3(command["pos"].(map[string]any))			
		
		id := EntityID(int(command["id"].(float64)))
		log.Printf("ID: %v", id)		
		fighter := game.getFighterPointer(id)
		if fighter != nil {
			fighter.SetGoalPosition(pos)
			log.Printf("Move troop command")
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
	lastGameTime := game.elapsedTime
	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
	defer ws.Close()

	for {
		if lastGameTime == game.elapsedTime {
			continue
		}
		if err != nil {
			log.Printf("Error marshalling JSON: %v", err)
			break
		}

		gameState := game.GetState()

		gameStateEncoded, err := json.Marshal(gameState)
		if(err != nil){
			log.Printf("Error marshalling JSON: %v", err)
			break
		}
		err = ws.WriteMessage(websocket.TextMessage, gameStateEncoded)
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
				log.Printf("Received message: %v", msgTemp)
				for i := range msgTemp {
					for key := range msgTemp[i] {
						log.Printf("Key: %v", key)
						log.Printf("Value: %v", msgTemp[i][key])
						if cmd, ok := msgTemp[i][key].(map[string]any); ok {
							commands[key](cmd)
						} else {
							log.Printf("Invalid command format: %v", msgTemp[i][key])
						}
					}

				}
			}
		}
	}
}

func runGameLoop() {
	for {
		time.Sleep(10 * time.Millisecond)
		game.update(0.05);
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	game = MakeTwoPlayerGame()
	game.createKnight(Float3{1, .5, 1}, 1)
	game.createKnight(Float3{2, .5, 1}, 1)
	game.createKnight(Float3{4, .5, 0}, 1)
	game.createKnight(Float3{1, .5, -1}, 1)
	go runGameLoop()

	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}