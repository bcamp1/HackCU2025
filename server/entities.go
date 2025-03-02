package main

type Movable interface {
	GetGoalPosition() Float3
	SetGoalPosition(Float3)
	GetPosition() Float3
	SetPosition(Float3)
	GetSpeed() float64
}

func updateMovable(m Movable, dt float64) {
	// Move movable entity towards goal location
	speed := m.GetSpeed()
	position := m.GetPosition()
	goalPosition := m.GetGoalPosition()
	delta := goalPosition.subtract(position)
	distanceToMove := speed * dt
	if delta.length() <= distanceToMove {
		// We've hit the goal
		m.SetPosition(goalPosition)
	} else {
		// We're getting closer to the goal
		delta_norm := delta.normalize()
		moveVector := delta_norm.scale(distanceToMove)
		newPosition := position.add(moveVector)
		m.SetPosition(newPosition)
	}
}

type Fighter struct {
	Id           EntityID `json:"id"`
	UnitType  string  `json:"unitType"`
	Position     Float3 `json:"position"`
	GoalPosition Float3 `json:"goalPosition"`
	Strength     float64 `json:"strength"`
	Speed        float64 `json:"speed"`
	AreaOfAttack float64 `json:"areaOfAttack"`
	MaxHealth    float64 `json:"maxHealth"`
	Health       float64 `json:"health"`
}

func (g *Game) createKnight(position Float3, id PlayerID) *Fighter {
	entityId := g.newEntityID()

	knight := &Fighter{
		Id:           entityId,
		UnitType:  "knight",
		Position:     position,
		GoalPosition: position,
		Strength:     40,
		AreaOfAttack: 10,
		Speed:        5,
		Health:       100,
		MaxHealth:    100,
	}
	g.players[id].fighters[entityId] = knight
	return knight
}

func (f *Fighter) GetPosition() Float3 {
	return f.Position
}

func (f *Fighter) GetSpeed() float64 {
	return f.Speed
}

func (f *Fighter) GetGoalPosition() Float3 {
	return f.GoalPosition
}

func (f *Fighter) SetPosition(p Float3) {
	f.Position = p
}

func (f *Fighter) SetGoalPosition(p Float3) {
	f.GoalPosition = p
}

const builderSpeed float64 = 1
const builderMaxHealth float64 = 100

type Builder struct {
	Id           EntityID `json:"id"`
	Position     Float3   `json:"position"`
	UnitType	 string   `json:"unitType"`
	GoalPosition Float3   `json:"goalPosition"`
	Gold         float64  `json:"gold"`
	Stone        float64  `json:"stone"`
	Wood         float64  `json:"wood"`
	Health       float64  `json:"health"`
}

func (g *Game) createBuilder(position Float3, id PlayerID) *Builder {
	entityId := g.newEntityID()
	builder := &Builder{
		Id:           entityId,
		Position:    position,
		GoalPosition: position,
		Gold:         0,
		Stone:        0,
		Wood:         0,
		Health:       builderMaxHealth,
	}
	g.players[id].builders[entityId] = builder
	return builder
}

func (b *Builder) GetPosition() Float3 {
	return b.Position
}

func (b *Builder) GetSpeed() float64 {
	return builderSpeed
}

func (b *Builder) GetGoalPosition() Float3 {
	return b.GoalPosition
}

func (b *Builder) SetPosition(p Float3) {
	b.Position = p
}

func (b *Builder) SetGoalPosition(p Float3) {
	b.GoalPosition = p
}

// Building types
// house, townhall, barracks, mine
type Building struct {
	Id           EntityID    `json:"id"`
	BuildingType string      `json:"buildingType"`
	Position     GridLocation `json:"position"`
	// Size         Float3      `json:"size"`
	MaxHealth    float64     `json:"maxHealth"`
	Health       float64     `json:"health"`
	Progress     float64     `json:"progress"`
	BuildTime    float64     `json:"buildTime"`
}

func (g *Game) createHouse(position GridLocation, playerId PlayerID) *Building {
	entityId := g.newEntityID()
	building := &Building{
		Id:           entityId,
		BuildingType: "house",
		Position:     position,
		MaxHealth:    500,
		Health:       500,
		Progress:     0,
		BuildTime:    10,
	}
	g.players[playerId].buildings[entityId] = building
	return building
}

func (g *Game) createTownHall(position GridLocation, playerId PlayerID) *Building {
	entityId := g.newEntityID()
	building := &Building{
		Id:           entityId,
		BuildingType: "townhall",
		Position:     position,
		MaxHealth:    1000,
		Health:       1000,
		Progress:     0,
		BuildTime:    10,
	}
	g.players[playerId].buildings[entityId] = building
	return building
}
