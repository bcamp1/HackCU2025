package main

import (
	"encoding/json"
	"math"
)

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

func (grid GridLocation) toFloat3() Float3 {
	return Float3{
		X: float64(grid.X),
		Y: 0,
		Z: float64(grid.Z),
	}
}

func (a Float3) scale(c float64) Float3 {
	return Float3{
		a.X * c,
		a.Y * c,
		a.Z * c,
	}
}

func (a Float3) length() float64 {
	return math.Sqrt(a.X*a.X + a.Y*a.Y + a.Z*a.Z)
}

func (a Float3) normalize() Float3 {
	return a.scale(1.0 / a.length())
}

func (a Float3) subtract(b Float3) Float3 {
	return Float3{
		a.X - b.X,
		a.Y - b.Y,
		a.Z - b.Z,
	}
}

func (a Float3) add(b Float3) Float3 {
	return Float3{
		a.X + b.X,
		a.Y + b.Y,
		a.Z + b.Z,
	}
}

func (a Float3) MarshalJSON() ([]byte, error) {
	return json.Marshal(struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
		Z float64 `json:"z"`
	}{
		X: a.X,
		Y: a.Y,
		Z: a.Z,
	})
}
