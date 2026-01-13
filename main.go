package main

import (
	"private_image_converter/security"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func sharedArrayBufferHeaders(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		c.Response().Header().Set("Cross-Origin-Embedder-Policy", "credentialless")
		return next(c)
	}
}

func main() {
	e := echo.New()

	e.Pre(middleware.WWWRedirect())

	e.Use(middleware.Secure())
	e.Use(middleware.CORS())
	e.Use(sharedArrayBufferHeaders)

	e.Static("/ffmpeg", "node_modules/@ffmpeg/ffmpeg/dist/esm")
	e.Static("/ffmpeg-util", "node_modules/@ffmpeg/util/dist/esm")
	e.Static("/", "public")

	tlsManager := security.NewManager(security.DefaultConfig())
	httpServer, httpsServer := tlsManager.SetupServers(e)

	if err := tlsManager.StartServers(httpServer, httpsServer); err != nil {
		e.Logger.Fatal(err)
	}
}
