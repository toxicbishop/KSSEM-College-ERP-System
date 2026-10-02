package academic

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/middleware"
)

func TestGenerateFeeReceiptPDF(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/academic/reports/fee-receipt?amount=75000&usn=1KS21CS042&studentName=Test+Student", nil)
	ctx := context.WithValue(req.Context(), middleware.UserContextKey, &middleware.UserContext{
		UID:  "test-user-uid-1234",
		Role: "student",
	})
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()

	GenerateFeeReceiptPDF(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	contentType := rec.Header().Get("Content-Type")
	if contentType != "application/pdf" {
		t.Errorf("Expected Content-Type application/pdf, got %s", contentType)
	}

	// Verify standard PDF magic bytes
	if !strings.HasPrefix(rec.Body.String(), "%PDF-") {
		t.Errorf("Expected response body to start with %%PDF- magic bytes")
	}
}

func TestGenerateGradeReportPDF(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/academic/reports/grade-transcript?semester=6&usn=1KS21CS042&studentName=Test+Student", nil)
	ctx := context.WithValue(req.Context(), middleware.UserContextKey, &middleware.UserContext{
		UID:  "test-user-uid-1234",
		Role: "student",
	})
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()

	GenerateGradeReportPDF(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	if rec.Header().Get("Content-Type") != "application/pdf" {
		t.Errorf("Expected application/pdf Content-Type")
	}

	if !strings.HasPrefix(rec.Body.String(), "%PDF-") {
		t.Errorf("Expected PDF magic header")
	}
}

func TestGenerateAttendanceReportPDF(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/academic/reports/attendance-eligibility?classroomId=CLASS-CSE-VI", nil)
	ctx := context.WithValue(req.Context(), middleware.UserContextKey, &middleware.UserContext{
		UID:  "faculty-uid-999",
		Role: "faculty",
	})
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()

	GenerateAttendanceReportPDF(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	if !strings.HasPrefix(rec.Body.String(), "%PDF-") {
		t.Errorf("Expected PDF magic header")
	}
}
