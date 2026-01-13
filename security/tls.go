package security

import (
	"crypto/tls"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/acme"
	"golang.org/x/crypto/acme/autocert"
)

type Config struct {
	CertCacheDir string
	AllowedHosts []string
	UseStaging   bool
	HTTPPort     string
	HTTPSPort    string
}

func DefaultConfig() *Config {
	return &Config{
		CertCacheDir: "/var/cache/image-converter/autocert",
		AllowedHosts: []string{"superigloo.com", "www.superigloo.com"},
		UseStaging:   true,
		HTTPPort:     ":80",
		HTTPSPort:    ":443",
	}
}

type Manager struct {
	config      *Config
	autoTLS     *autocert.Manager
	httpServer  *http.Server
	httpsServer *http.Server
}

func NewManager(config *Config) *Manager {
	if config == nil {
		config = DefaultConfig()
	}

	acmeClient := &acme.Client{}
	if config.UseStaging {
		acmeClient.DirectoryURL = "https://acme-staging-v02.api.letsencrypt.org/directory"
	}

	autoTLS := &autocert.Manager{
		Prompt:     autocert.AcceptTOS,
		Cache:      autocert.DirCache(config.CertCacheDir),
		HostPolicy: autocert.HostWhitelist(config.AllowedHosts...),
		Client:     acmeClient,
	}

	return &Manager{
		config:  config,
		autoTLS: autoTLS,
	}
}

func (m *Manager) SetupServers(e *echo.Echo) (*http.Server, *http.Server) {
	m.httpServer = &http.Server{
		Addr:    m.config.HTTPPort,
		Handler: m.autoTLS.HTTPHandler(e),
	}

	m.httpsServer = &http.Server{
		Addr:    m.config.HTTPSPort,
		Handler: e,
		TLSConfig: &tls.Config{
			GetCertificate: m.autoTLS.GetCertificate,
			NextProtos:     []string{acme.ALPNProto},
		},
	}

	return m.httpServer, m.httpsServer
}

func (manager *Manager) StartServers(httpServer, httpsServer *http.Server) error {
	go func() {
		log.Println("Starting HTTP server on", manager.config.HTTPPort, "(for HTTP-01 challenge)")
		err := httpServer.ListenAndServe()
		if err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		} else {
			log.Println("HTTP server closed")
		}
	}()

	log.Println("Starting HTTPS server on", manager.config.HTTPSPort)
	return httpsServer.ListenAndServeTLS("", "")
}