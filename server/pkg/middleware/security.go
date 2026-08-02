package middleware

import (
	"net/http"
)

// SecurityHeadersMiddleware adds essential security headers to every response.
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME-type sniffing
		w.Header().Set("X-Content-Type-Options", "nosniff")

		// Prevent embedding in iframes (clickjacking protection)
		w.Header().Set("X-Frame-Options", "DENY")

		// Strict referrer policy
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Restrict access to device features
		w.Header().Set("Permissions-Policy",
			"camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()")

		// Enforce HTTPS for 2 years with subdomains and preload
		w.Header().Set("Strict-Transport-Security",
			"max-age=63072000; includeSubDomains; preload")

		// Cache control for API responses
		if len(r.URL.Path) > 3 && r.URL.Path[:4] == "/api" {
			w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
		}

		next.ServeHTTP(w, r)
	})
}
