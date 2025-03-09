package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var gameNumber = 0 
var startPort = 8080



type Game struct {
	Id 	int	
	Players []Player	
} 

type Player struct {
	Number int
}

type IpAddress string
type PortNumber int 
type GameCode string

type GamePlayerPair struct {
	game *Game
	player *Player
}

type IpWsPair struct {
	Ip IpAddress
	Ws *websocket.Conn
	Name string
}

var Lobbies =  make(map[GameCode][]IpWsPair)

var GameConnections = make(map[IpAddress]GamePlayerPair)   

var GameList = make(map[PortNumber]*Game)

// func broadcastGameState() {
	
// }

func initGame()*Game {
	game := &Game{}
	game.Players = make([]Player, 0)
	return game
}

func (g *Game)createPlayer() *Player{
	player := Player{len(g.Players)}
	g.Players = append(g.Players, player)
	return &player
}

func handlePlayerConnection(portNumber PortNumber) http.HandlerFunc{
	return func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)

		if err != nil {
			log.Fatalf("Failed to upgrade to websocket: %v", err)
		}

		ip := IpAddress(ws.RemoteAddr().String())

		defer ws.Close()
		var game *Game
		var player *Player

		value, exists := GameConnections[ip]

		if !exists {
			game = GameList[portNumber]		
			player = game.createPlayer()	
			GameConnections[ip] = GamePlayerPair{game, player}
		}else{
			// game = value.game
			player = value.player
		}

		playerNumber := map[string]int{"playerNumber": player.Number}	

		ws.WriteJSON(playerNumber)
	}
}

func startGame(portNumber PortNumber) {
	game := initGame()
	GameList[portNumber] = game

	slashPort := fmt.Sprintf("/%v", portNumber)
	http.HandleFunc(slashPort, handlePlayerConnection(portNumber))
}

func buildHeader(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Content-Type", "application/json")
}

func handlePlay(w http.ResponseWriter, r *http.Request) {
	buildHeader(&w)
	gameNumber++
	portNumber := PortNumber(startPort+gameNumber)

	log.Printf("Starting game on port %v", portNumber)
	res := make(map[string]PortNumber)
	res["data"] = portNumber

	json.NewEncoder(w).Encode(res)

	startGame(portNumber)
}

func broadcastLobby(ipWsPairs []IpWsPair){
	names := make([]IpAddress, 0)
	for _, pair := range ipWsPairs {
		names = append(names, pair.Ip)
	}
	for _, pair := range ipWsPairs {
		pair.Ws.WriteJSON(names)
	}
}

// func broadcastStart(ipWsPairs []IpWsPair){
// 	for _, pair := range ipWsPairs {
// 		pair.Ws.WriteJSON()
// 	}
// }

func listenForStart(ws *websocket.Conn, gameCode GameCode){
	for {
		var start bool
		err := ws.ReadJSON(&start)
		if err != nil {
			log.Printf("Error reading JSON: %v", err)
			return
		}
		if start {
			// broadcastStart(Lobbies[gameCode])
			log.Printf("Received start signal: %v", start)
			break
		}
	}
}

func handleJoin(w http.ResponseWriter, r *http.Request){
	ws, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}

	ip := IpAddress(ws.RemoteAddr().String())
	gameCode := GameCode(r.URL.Query()["gameCode"][0])
	name := r.URL.Query()["name"][0]

	_, e := Lobbies[gameCode]	

	if !e {
		Lobbies[gameCode] = []IpWsPair{{ip, ws, name}}
	}else{
		Lobbies[gameCode] = append(Lobbies[gameCode], IpWsPair{ip, ws, name})
	}

	broadcastLobby(Lobbies[gameCode])
	listenForStart(ws, gameCode)
}

func main() {
	http.HandleFunc("/play", handlePlay)
	http.HandleFunc("/join", handleJoin)

	port:= fmt.Sprintf(":%v", startPort)
	log.Fatal(http.ListenAndServe(port, nil))
}
