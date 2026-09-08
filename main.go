package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

//go:embed all:dist
var distFS embed.FS

var (
	port        = 4983
	dataDir     string
	projectsDir string
	trashDir    string
	localIP     = "127.0.0.1"
	authToken   = "writ-local-secure-token"
)

func init() {
	// Setup MIME types for fonts and modern web assets
	mime.AddExtensionType(".woff", "font/woff")
	mime.AddExtensionType(".woff2", "font/woff2")
	mime.AddExtensionType(".ttf", "font/ttf")
	mime.AddExtensionType(".js", "application/javascript; charset=utf-8")
	mime.AddExtensionType(".mjs", "application/javascript; charset=utf-8")
	mime.AddExtensionType(".css", "text/css; charset=utf-8")
	mime.AddExtensionType(".json", "application/json; charset=utf-8")
	mime.AddExtensionType(".svg", "image/svg+xml")
	mime.AddExtensionType(".ico", "image/x-icon")
	mime.AddExtensionType(".png", "image/png")

	// Determine physical data storage directory
	if custom := os.Getenv("WRIT_DATA_DIR"); custom != "" {
		dataDir = custom
	} else {
		home, err := os.UserHomeDir()
		if err != nil {
			home = "."
		}
		dataDir = filepath.Join(home, "Documents", "Writ", "data")
	}

	projectsDir = filepath.Join(dataDir, "projects")
	trashDir = filepath.Join(dataDir, "trash")

	// Ensure physical directories exist on disk
	for _, dir := range []string{dataDir, projectsDir, trashDir} {
		_ = os.MkdirAll(dir, 0755)
	}

	// Detect private LAN IP
	addrs, err := net.InterfaceAddrs()
	if err == nil {
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ipnet.IP.To4() != nil {
					localIP = ipnet.IP.String()
					break
				}
			}
		}
	}
}

func main() {
	// Find available port starting from 4983
	listener, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		listener, err = net.Listen("tcp", ":0")
		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to start listener: %v\n", err)
			os.Exit(1)
		}
		port = listener.Addr().(*net.TCPAddr).Port
	}

	appURL := fmt.Sprintf("http://localhost:%d", port)
	fmt.Printf("[Writ Go-Native Studio] Running on %s (LAN: http://%s:%d)\n", appURL, localIP, port)

	mux := http.NewServeMux()

	// API Handlers
	mux.HandleFunc("/api/status", handleStatus)
	mux.HandleFunc("/api/server-info", handleServerInfo)
	mux.HandleFunc("/api/projects", handleProjects)
	mux.HandleFunc("/api/trash", handleTrash)

	// Static Assets from embedded distFS
	distSub, err := fs.Sub(distFS, "dist")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading embedded assets: %v\n", err)
		os.Exit(1)
	}

	fileServer := http.FileServer(http.FS(distSub))
	mux.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		p := strings.TrimPrefix(filepath.Clean(req.URL.Path), "/")
		if p == "" || p == "." {
			p = "index.html"
		}

		// Check if file exists in embedded filesystem
		f, err := distSub.Open(p)
		if err == nil {
			f.Close()
			// Set explicit content type header for fonts and script
			ext := strings.ToLower(filepath.Ext(p))
			if cType := mime.TypeByExtension(ext); cType != "" {
				w.Header().Set("Content-Type", cType)
			}
			fileServer.ServeHTTP(w, req)
			return
		}

		// Fallback to index.html for client-side routing
		indexBytes, err := fs.ReadFile(distSub, "index.html")
		if err != nil {
			http.Error(w, "Writ Studio UI not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write(indexBytes)
	})

	server := &http.Server{
		Handler: withCORS(mux),
	}

	go func() {
		if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		}
	}()

	// Launch native desktop window in Microsoft Edge App Mode
	go func() {
		time.Sleep(150 * time.Millisecond)
		launchDesktopWindow(appURL)
	}()

	// Wait indefinitely
	select {}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "ok",
		"port":        port,
		"platform":    "go-native",
		"version":     "1.0.0",
		"storageMode": "physical_disk",
		"dataDir":     dataDir,
		"rule1":       "safety_trash_enforced",
	})
}

func handleServerInfo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"port":  port,
		"lanIp": localIP,
		"token": authToken,
	})
}

func handleProjects(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		entries, err := os.ReadDir(projectsDir)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var projects []json.RawMessage
		for _, e := range entries {
			if !e.IsDir() && strings.HasSuffix(e.Name(), ".json") {
				content, err := os.ReadFile(filepath.Join(projectsDir, e.Name()))
				if err == nil {
					projects = append(projects, json.RawMessage(content))
				}
			}
		}

		if projects == nil {
			projects = []json.RawMessage{}
		}
		json.NewEncoder(w).Encode(projects)
		return
	}

	if r.Method == "POST" {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var payload struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(body, &payload); err != nil || payload.ID == "" {
			http.Error(w, "Project ID required", http.StatusBadRequest)
			return
		}

		filePath := filepath.Join(projectsDir, payload.ID+".json")
		backupPath := filepath.Join(projectsDir, payload.ID+".bak")

		// Atomic backup before write
		if _, err := os.Stat(filePath); err == nil {
			_ = os.WriteFile(backupPath, body, 0644)
		}

		if err := os.WriteFile(filePath, body, 0644); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "saved",
			"projectId": payload.ID,
			"filePath":  filePath,
		})
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func handleTrash(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	trashFile := filepath.Join(trashDir, "trash_index.json")

	if r.Method == "GET" {
		content, err := os.ReadFile(trashFile)
		if err != nil {
			w.Write([]byte("[]"))
			return
		}
		w.Write(content)
		return
	}

	if r.Method == "POST" {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var current []json.RawMessage
		content, err := os.ReadFile(trashFile)
		if err == nil {
			_ = json.Unmarshal(content, &current)
		}

		current = append([]json.RawMessage{json.RawMessage(body)}, current...)
		data, _ := json.MarshalIndent(current, "", "  ")
		_ = os.WriteFile(trashFile, data, 0644)

		json.NewEncoder(w).Encode(map[string]string{
			"status": "archived_to_safety_trash",
		})
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func launchDesktopWindow(targetURL string) {
	if runtime.GOOS != "windows" {
		return
	}

	// Candidates for Microsoft Edge executable
	candidates := []string{
		`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
		`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
	}

	var edgePath string
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			edgePath = c
			break
		}
	}

	if edgePath == "" {
		// Fallback: open default system browser
		exec.Command("rundll32", "url.dll,FileProtocolHandler", targetURL).Start()
		return
	}

	// Isolated profile directory for Writ
	localApp, _ := os.UserCacheDir()
	if localApp == "" {
		localApp = os.TempDir()
	}
	profileDir := filepath.Join(localApp, "Writ", "EdgeProfile")
	_ = os.MkdirAll(profileDir, 0755)

	cmd := exec.Command(
		edgePath,
		fmt.Sprintf("--app=%s", targetURL),
		"--window-size=1440,920",
		fmt.Sprintf("--user-data-dir=%s", profileDir),
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-features=TranslateUI",
	)

	if err := cmd.Run(); err != nil {
		// If Edge fails to run in app mode, fallback to default browser
		exec.Command("rundll32", "url.dll,FileProtocolHandler", targetURL).Start()
	} else {
		// When user closes the native app window, exit the Go process cleanly
		os.Exit(0)
	}
}
