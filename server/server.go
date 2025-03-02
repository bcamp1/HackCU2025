package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var game Game
var connections = make(map[*websocket.Conn]PlayerID)
var connMutex sync.Mutex

type MoveTroopCommand struct {
	ID  int    `json:"id"`
	POS Float3 `json:"pos"`
}

type PlaceBuildingCommand struct {
	TYPE string `json:"type"`
	POS  Float3 `json:"pos"`
}

type AttackCommand struct {
	TARGET_ID   int `json:"target_id"`
	ATTACKER_ID int `json:"attacker_id"`
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
	defer ws.Close()

	connMutex.Lock()
	playerID := PlayerID(len(connections) + 1)
	log.Printf("Player %v connected", playerID)
	connections[ws] = playerID

	// Send player ID to the client
	idMessage := map[string]any{"playerId": playerID}
	idEncoded, err := json.Marshal(idMessage)
	if err != nil {
		log.Printf("Error marshalling JSON: %v", err)
		return
	}

	err = ws.WriteMessage(websocket.TextMessage, idEncoded)

	connMutex.Unlock()
	if err != nil {
		log.Printf("Error sending player ID: %v", err)
		connMutex.Lock()
		delete(connections, ws)
		connMutex.Unlock()
		return
	}

	for {
		var msgTemp []map[string]any
		err = ws.ReadJSON(&msgTemp)
		if err != nil {
			log.Printf("Error reading message: %v", err)
			connMutex.Lock()
			delete(connections, ws)
			connMutex.Unlock()
			break
		} else {
			if msgTemp[0]["noop"] != true {
				for i := range msgTemp {
					for key := range msgTemp[i] {
						if command, ok := msgTemp[i][key].(map[string]any); ok {
							log.Printf("Command: %v", command)
							log.Printf("key: %v", key)

							switch key {
								case "moveUnit":
									pos := mapToFloat3(command["pos"].(map[string]any))
									id := EntityID(int(command["id"].(float64)))
									moveType := command["type"].(string)
									log.Printf("Move type: %v", moveType)
									unit := game.getMovable(id)
									if unit != nil {
										unit.SetGoalPosition(pos)
									}

								case "placeBuilding":
									pos := mapToGridLocation(command["pos"].(map[string]any))
									switch command["type"].(string) {
										case "house":
											game.createHouse(pos, playerID)
										case "townhall":
											game.createTownHall(pos, playerID)
										case "barracks":
											game.createBarracks(pos, playerID)
										default:
											log.Printf("Invalid building type: %v", command["buildingType"])
									}


								case "createKnight":
									pos := mapToFloat3(command["pos"].(map[string]any))
									game.createKnight(pos, playerID)

								case "createBuilder":
									pos := mapToFloat3(command["pos"].(map[string]any))
									game.createBuilder(pos, playerID)

								case "attack":
									log.Printf("Attack command")

								default:
									log.Printf("Invalid command type: %v", key)
								}
						} else {
							log.Printf("Invalid command format: %v", msgTemp[i][key])
						}
					}
				}
			}
		}
	}
}

func broadcastGameState() {
	for {
		time.Sleep(10 * time.Millisecond)
		game.update(0.05)
		gameState := game.GetState()
		gameStateEncoded, err := json.Marshal(gameState)
		if err != nil {
			log.Printf("Error marshalling JSON: %v", err)
			continue
		}

		connMutex.Lock()
		for conn := range connections {
			err := conn.WriteMessage(websocket.TextMessage, gameStateEncoded)
			if err != nil {
				log.Printf("Error writing message: %v", err)
				conn.Close()
				delete(connections, conn)
			}
		}
		connMutex.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	game = MakeTwoPlayerGame()

	game.createKnight(Float3{5, .25, 1}, 1)
	game.createKnight(Float3{5, .25, 2}, 1)
	game.createKnight(Float3{5, .25, 3}, 1)

	game.createKnight(Float3{5, .25, 4}, 1)
	game.createKnight(Float3{-9, .25, 10}, 2)
	game.createKnight(Float3{-11, .25, 10}, 2)
	game.createKnight(Float3{-10, .25, 10}, 2)
	game.createBuilder(Float3{0, .25, 0}, 1)
	game.createBuilder(Float3{0, .25, 1}, 1)
	game.createBuilder(Float3{0, .25, -1}, 1)
	game.createBuilder(Float3{5, .25, 0}, 2)
	game.createBuilder(Float3{5, .25, 1}, 2)
	game.createBuilder(Float3{5, .25, -1},2)
	game.addGold(1, 1000)
	game.addStone(1, 1000)
	game.addWood(1, 100)
	game.addGold(2, 2000)
	game.addStone(2, 2000)
	game.addWood(2, 20000)


	go broadcastGameState()

	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}