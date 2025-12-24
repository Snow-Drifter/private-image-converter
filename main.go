package main

import (
	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Header().Set("Cross-Origin-Opener-Policy", "same-origin")
			c.Response().Header().Set("Cross-Origin-Embedder-Policy", "credentialless")
			return next(c)
		}
	})

	e.Static("/ffmpeg", "node_modules/@ffmpeg/ffmpeg/dist/esm")
	e.Static("/ffmpeg-util", "node_modules/@ffmpeg/util/dist/esm")
	e.Static("/", "public")

	port := ":3000"
	e.Logger.Info("Server running on http://localhost" + port)
	e.Logger.Fatal(e.Start(port))
}
