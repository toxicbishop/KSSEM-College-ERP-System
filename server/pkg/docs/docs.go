package docs

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// OpenAPISpec contains the JSON schema representation of the College ERP API.
var OpenAPISpec = map[string]interface{}{
	"openapi": "3.0.3",
	"info": map[string]interface{}{
		"title":       "KSSEM College ERP System API",
		"version":     "1.0.0",
		"description": "Enterprise modular monolith backend API for K.S. School of Engineering and Management.",
		"contact": map[string]interface{}{
			"name":  "KSSEM ERP Engineering",
			"email": "erp@kssem.edu.in",
		},
	},
	"servers": []map[string]interface{}{
		{
			"url":         "http://localhost:8080",
			"description": "Local Development Server",
		},
	},
	"components": map[string]interface{}{
		"securitySchemes": map[string]interface{}{
			"BearerAuth": map[string]interface{}{
				"type":         "http",
				"scheme":       "bearer",
				"bearerFormat": "JWT",
				"description":  "Firebase Auth JWT ID Token",
			},
		},
	},
	"security": []map[string]interface{}{
		{"BearerAuth": []string{}},
	},
	"paths": map[string]interface{}{
		"/health/live": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "Liveness Probe",
				"description": "Returns 200 OK if the Go server process is alive.",
				"security":    []interface{}{},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "Server is live"},
				},
			},
		},
		"/health/ready": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "Readiness Probe",
				"description": "Verifies Cloud Firestore and Firebase Auth connectivity.",
				"security":    []interface{}{},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "All backend services healthy"},
					"503": map[string]interface{}{"description": "Downstream service degraded or uninitialized"},
				},
			},
		},
		"/api/academic/events": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Academic"},
				"summary":     "Get Academic Calendar Events",
				"description": "Fetches academic calendar milestones, examination dates, and holidays (cached with 10m TTL).",
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "List of calendar events"},
				},
			},
		},
		"/api/academic/attendance": map[string]interface{}{
			"post": map[string]interface{}{
				"tags":        []string{"Attendance"},
				"summary":     "Submit Lecture Attendance",
				"description": "Faculty submits lecture attendance roster for a classroom session.",
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "Attendance recorded"},
					"400": map[string]interface{}{"description": "Invalid payload or status"},
				},
			},
		},
		"/api/academic/reports/fee-receipt": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Reports"},
				"summary":     "Generate Fee Receipt PDF",
				"description": "Generates a downloadable, computer-generated student fee receipt PDF.",
				"parameters": []map[string]interface{}{
					{"name": "paymentId", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "studentName", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "usn", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "amount", "in": "query", "schema": map[string]string{"type": "number"}},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "PDF binary stream", "content": map[string]interface{}{"application/pdf": map[string]interface{}{}}},
				},
			},
		},
		"/api/academic/reports/grade-transcript": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Reports"},
				"summary":     "Generate Grade Transcript PDF",
				"description": "Generates a provisional semester grade card with SGPA and CGPA.",
				"parameters": []map[string]interface{}{
					{"name": "usn", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "semester", "in": "query", "schema": map[string]string{"type": "string"}},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "PDF binary stream", "content": map[string]interface{}{"application/pdf": map[string]interface{}{}}},
				},
			},
		},
		"/api/academic/reports/attendance-eligibility": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Reports"},
				"summary":     "Generate Attendance Eligibility Report PDF",
				"description": "Generates VTU 75% attendance shortage report.",
				"parameters": []map[string]interface{}{
					{"name": "classroomId", "in": "query", "schema": map[string]string{"type": "string"}},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "PDF binary stream", "content": map[string]interface{}{"application/pdf": map[string]interface{}{}}},
				},
			},
		},
		"/api/communication/chat/send": map[string]interface{}{
			"post": map[string]interface{}{
				"tags":        []string{"Communication"},
				"summary":     "Send Classroom Chat Message",
				"description": "Posts a real-time message to a classroom and broadcasts to active SSE listeners.",
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "Message published"},
				},
			},
		},
		"/api/communication/chat/stream": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Communication"},
				"summary":     "Stream Real-time Chat Messages (SSE)",
				"description": "Establishes a Server-Sent Events stream for real-time classroom chat.",
				"parameters": []map[string]interface{}{
					{"name": "classroomId", "in": "query", "required": true, "schema": map[string]string{"type": "string"}},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "Server-Sent Events event stream", "content": map[string]interface{}{"text/event-stream": map[string]interface{}{}}},
				},
			},
		},
		"/api/admin/audit-logs": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Admin"},
				"summary":     "List Audit Logs",
				"description": "Admin-only: lists recent audit trails.",
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "List of audit logs"},
					"403": map[string]interface{}{"description": "Forbidden - requires Admin role"},
				},
			},
		},
	},
}

// RegisterRoutes mounts the interactive documentation endpoints.
func RegisterRoutes(r chi.Router) {
	r.Get("/docs/openapi.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(OpenAPISpec)
	})

	r.Get("/docs", func(w http.ResponseWriter, r *http.Request) {
		html := `<!doctype html>
<html>
  <head>
    <title>KSSEM College ERP - Interactive API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/png" href="/Favicon/collage-logo.png" />
    <style>body { margin: 0; padding: 0; background: #0f172a; }</style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/docs/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(html))
	})
}
