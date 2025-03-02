package main

import "math"

type Float3 struct {
	x float64
	y float64
	z float64
}

func (a Float3) scale(c float64) Float3 {
	return Float3{
		a.x * c,
		a.y * c,
		a.z * c,
	}
}

func (a Float3) length() float64 {
	return math.Sqrt(a.x*a.x + a.y*a.y + a.z*a.z)
}

func (a Float3) normalize() Float3 {
	return a.scale(1.0 / a.length())
}

func (a Float3) subtract(b Float3) Float3 {
	return Float3{
		a.x - b.x,
		a.y - b.y,
		a.z - b.z,
	}
}

func (a Float3) add(b Float3) Float3 {
	return Float3{
		a.x + b.x,
		a.y + b.y,
		a.z + b.z,
	}
}
