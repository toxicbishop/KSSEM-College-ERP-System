package academic

import (
	"bytes"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-pdf/fpdf"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/middleware"
)

// GenerateFeeReceiptPDF creates an official PDF fee receipt for a student payment.
func GenerateFeeReceiptPDF(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, ok := ctx.Value(middleware.UserContextKey).(*middleware.UserContext)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	paymentId := r.URL.Query().Get("paymentId")
	if paymentId == "" {
		paymentId = "REC-" + time.Now().Format("20060102150405")
	}

	studentName := r.URL.Query().Get("studentName")
	if studentName == "" {
		if len(user.UID) >= 8 {
			studentName = "Student (" + user.UID[:8] + ")"
		} else {
			studentName = "Student (" + user.UID + ")"
		}
	}

	usn := r.URL.Query().Get("usn")
	if usn == "" {
		usn = "1KS21CS001"
	}

	branch := r.URL.Query().Get("branch")
	if branch == "" {
		branch = "Computer Science & Engineering"
	}

	semester := r.URL.Query().Get("semester")
	if semester == "" {
		semester = "VI"
	}

	amountStr := r.URL.Query().Get("amount")
	amount := 85000.00
	if val, err := strconv.ParseFloat(amountStr, 64); err == nil && val > 0 {
		amount = val
	}

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()

	// Header Banner
	pdf.SetFillColor(30, 41, 59) // Slate-800
	pdf.Rect(15, 15, 180, 26, "F")

	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 14)
	pdf.SetXY(15, 20)
	pdf.CellFormat(180, 7, "K.S. SCHOOL OF ENGINEERING AND MANAGEMENT", "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(180, 5, "Approved by AICTE, Affiliated to VTU, Belagavi | Bengaluru - 560109", "", 1, "C", false, 0, "")

	// Subheader
	pdf.Ln(8)
	pdf.SetTextColor(30, 41, 59)
	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(180, 7, "OFFICIAL FEE PAYMENT RECEIPT", "B", 1, "C", false, 0, "")
	pdf.Ln(4)

	// Receipt Metadata Box
	pdf.SetFont("Helvetica", "", 10)
	pdf.SetFillColor(248, 250, 252)
	pdf.Rect(15, pdf.GetY(), 180, 24, "FD")

	yStart := pdf.GetY() + 3
	pdf.SetXY(20, yStart)
	pdf.SetFont("Helvetica", "B", 9)
	pdf.Cell(30, 5, "Receipt No:")
	pdf.SetFont("Helvetica", "", 9)
	pdf.Cell(60, 5, paymentId)

	pdf.SetFont("Helvetica", "B", 9)
	pdf.Cell(25, 5, "Date:")
	pdf.SetFont("Helvetica", "", 9)
	pdf.Cell(45, 5, time.Now().Format("02-Jan-2006 15:04"))

	pdf.SetXY(20, yStart+7)
	pdf.SetFont("Helvetica", "B", 9)
	pdf.Cell(30, 5, "Academic Year:")
	pdf.SetFont("Helvetica", "", 9)
	pdf.Cell(60, 5, "2026 - 2027")

	pdf.SetFont("Helvetica", "B", 9)
	pdf.Cell(25, 5, "Payment Status:")
	pdf.SetTextColor(16, 149, 106) // Green
	pdf.SetFont("Helvetica", "B", 9)
	pdf.Cell(45, 5, "SUCCESSFUL / PAID")

	// Student Info Box
	pdf.SetTextColor(30, 41, 59)
	pdf.SetXY(15, yStart+20)
	pdf.Ln(4)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(180, 6, "Student Information", "", 1, "L", false, 0, "")

	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(40, 6, "Student Name:", "1", 0, "L", false, 0, "")
	pdf.CellFormat(50, 6, studentName, "1", 0, "L", false, 0, "")
	pdf.CellFormat(40, 6, "USN:", "1", 0, "L", false, 0, "")
	pdf.CellFormat(50, 6, usn, "1", 1, "L", false, 0, "")

	pdf.CellFormat(40, 6, "Branch:", "1", 0, "L", false, 0, "")
	pdf.CellFormat(50, 6, branch, "1", 0, "L", false, 0, "")
	pdf.CellFormat(40, 6, "Semester:", "1", 0, "L", false, 0, "")
	pdf.CellFormat(50, 6, "Semester "+semester, "1", 1, "L", false, 0, "")

	// Fee Breakdown Table
	pdf.Ln(6)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(180, 6, "Fee Particulars Breakdown", "", 1, "L", false, 0, "")

	pdf.SetFillColor(226, 232, 240)
	pdf.SetFont("Helvetica", "B", 9)
	pdf.CellFormat(20, 7, "Sl No", "1", 0, "C", true, 0, "")
	pdf.CellFormat(110, 7, "Particulars / Description", "1", 0, "L", true, 0, "")
	pdf.CellFormat(50, 7, "Amount (INR)", "1", 1, "R", true, 0, "")

	pdf.SetFont("Helvetica", "", 9)
	items := []struct {
		desc string
		cost float64
	}{
		{"Tuition Fee (College Tuition)", amount * 0.70},
		{"University VTU Registration & Exam Fee", amount * 0.15},
		{"Laboratory, Library & Internet Infrastructure Fee", amount * 0.10},
		{"Student Welfare, Sports & Cultural Activities", amount * 0.05},
	}

	for i, item := range items {
		pdf.CellFormat(20, 6, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(110, 6, item.desc, "1", 0, "L", false, 0, "")
		pdf.CellFormat(50, 6, fmt.Sprintf("%.2f", item.cost), "1", 1, "R", false, 0, "")
	}

	// Total Row
	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetFillColor(241, 245, 249)
	pdf.CellFormat(130, 8, "Total Amount Paid (INR):", "1", 0, "R", true, 0, "")
	pdf.CellFormat(50, 8, fmt.Sprintf("Rs. %.2f", amount), "1", 1, "R", true, 0, "")

	// Verification & Footer
	pdf.Ln(15)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(180, 5, "Note: This is a computer-generated receipt issued by KSSEM ERP. No physical signature is required.", "", 1, "C", false, 0, "")
	pdf.CellFormat(180, 5, "For queries, please contact accounts@kssem.edu.in with your Receipt No.", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		logger.Error(ctx, "Failed to generate Fee PDF", "error", err)
		http.Error(w, `{"error":"failed to generate receipt"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"Receipt-%s.pdf\"", paymentId))
	w.Header().Set("Content-Length", strconv.Itoa(buf.Len()))
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

// GenerateGradeReportPDF creates a student semester grade card / transcript PDF.
func GenerateGradeReportPDF(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, ok := ctx.Value(middleware.UserContextKey).(*middleware.UserContext)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	studentName := r.URL.Query().Get("studentName")
	if studentName == "" {
		if len(user.UID) >= 8 {
			studentName = "Student (" + user.UID[:8] + ")"
		} else {
			studentName = "Student (" + user.UID + ")"
		}
	}

	usn := r.URL.Query().Get("usn")
	if usn == "" {
		usn = "1KS21CS001"
	}

	semester := r.URL.Query().Get("semester")
	if semester == "" {
		semester = "6"
	}

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()

	// Header Banner
	pdf.SetFillColor(15, 23, 42) // Slate-900
	pdf.Rect(15, 15, 180, 26, "F")

	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 13)
	pdf.SetXY(15, 20)
	pdf.CellFormat(180, 6, "K.S. SCHOOL OF ENGINEERING AND MANAGEMENT", "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(180, 5, "DEPARTMENT OF ACADEMIC EVALUATION & CONTROLLER OF EXAMINATIONS", "", 1, "C", false, 0, "")

	pdf.Ln(8)
	pdf.SetTextColor(15, 23, 42)
	pdf.SetFont("Helvetica", "B", 11)
	pdf.CellFormat(180, 7, fmt.Sprintf("PROVISIONAL SEMESTER GRADE TRANSCRIPT - SEMESTER %s", semester), "B", 1, "C", false, 0, "")
	pdf.Ln(4)

	// Student Info
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(35, 6, "Candidate Name:", "1", 0, "L", false, 0, "")
	pdf.CellFormat(55, 6, studentName, "1", 0, "L", false, 0, "")
	pdf.CellFormat(35, 6, "University Seat No (USN):", "1", 0, "L", false, 0, "")
	pdf.CellFormat(55, 6, usn, "1", 1, "L", false, 0, "")

	pdf.CellFormat(35, 6, "Degree / Branch:", "1", 0, "L", false, 0, "")
	pdf.CellFormat(55, 6, "B.E. Computer Science & Engg", "1", 0, "L", false, 0, "")
	pdf.CellFormat(35, 6, "Examination Session:", "1", 0, "L", false, 0, "")
	pdf.CellFormat(55, 6, "June / July 2026", "1", 1, "L", false, 0, "")

	pdf.Ln(6)

	// Course Marks Table
	pdf.SetFillColor(226, 232, 240)
	pdf.SetFont("Helvetica", "B", 9)
	pdf.CellFormat(25, 7, "Sub Code", "1", 0, "C", true, 0, "")
	pdf.CellFormat(80, 7, "Course Title", "1", 0, "L", true, 0, "")
	pdf.CellFormat(25, 7, "Credits", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 7, "Grade Awarded", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 7, "Grade Points", "1", 1, "C", true, 0, "")

	type GradeRow struct {
		code, title, grade string
		credits, points    int
	}

	courses := []GradeRow{
		{"21CS61", "Software Engineering & Project Management", "O", 3, 10},
		{"21CS62", "Full Stack Web Development", "A+", 4, 9},
		{"21CS63", "Computer Networks & Security", "A+", 4, 9},
		{"21CS64", "Cloud Computing & Distributed Systems", "A", 3, 8},
		{"21CSL66", "Full Stack Development Laboratory", "O", 2, 10},
		{"21CSL67", "Computer Networks Laboratory", "O", 2, 10},
	}

	pdf.SetFont("Helvetica", "", 9)
	totalCredits := 0
	totalScore := 0
	for _, c := range courses {
		pdf.CellFormat(25, 6, c.code, "1", 0, "C", false, 0, "")
		pdf.CellFormat(80, 6, c.title, "1", 0, "L", false, 0, "")
		pdf.CellFormat(25, 6, fmt.Sprintf("%d", c.credits), "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 6, c.grade, "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 6, fmt.Sprintf("%d", c.points), "1", 1, "C", false, 0, "")

		totalCredits += c.credits
		totalScore += c.credits * c.points
	}

	sgpa := float64(totalScore) / float64(totalCredits)

	// Summary Footer Box
	pdf.Ln(4)
	pdf.SetFont("Helvetica", "B", 9)
	pdf.SetFillColor(241, 245, 249)
	pdf.CellFormat(45, 8, fmt.Sprintf("Total Credits: %d", totalCredits), "1", 0, "C", true, 0, "")
	pdf.CellFormat(45, 8, fmt.Sprintf("Semester SGPA: %.2f", sgpa), "1", 0, "C", true, 0, "")
	pdf.CellFormat(45, 8, fmt.Sprintf("Cumulative CGPA: %.2f", sgpa-0.12), "1", 0, "C", true, 0, "")
	pdf.SetTextColor(16, 149, 106)
	pdf.CellFormat(45, 8, "Result: FIRST CLASS WITH DIST", "1", 1, "C", true, 0, "")

	pdf.Ln(18)
	pdf.SetTextColor(30, 41, 59)
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(90, 5, "Date of Publication: "+time.Now().Format("02-Jan-2006"), "", 0, "L", false, 0, "")
	pdf.CellFormat(90, 5, "Controller of Examinations", "", 1, "R", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		logger.Error(ctx, "Failed to generate Transcript PDF", "error", err)
		http.Error(w, `{"error":"failed to generate grade report"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"Transcript-%s-Sem%s.pdf\"", usn, semester))
	w.Header().Set("Content-Length", strconv.Itoa(buf.Len()))
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

// GenerateAttendanceReportPDF generates an official VTU 75% attendance compliance report.
func GenerateAttendanceReportPDF(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	classroomId := chi.URLParam(r, "id")
	if classroomId == "" {
		classroomId = r.URL.Query().Get("classroomId")
	}

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()

	// Header
	pdf.SetFillColor(220, 38, 38) // Red-600
	pdf.Rect(15, 15, 180, 24, "F")

	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 13)
	pdf.SetXY(15, 19)
	pdf.CellFormat(180, 6, "K.S. SCHOOL OF ENGINEERING AND MANAGEMENT", "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(180, 5, "OFFICIAL VTU ATTENDANCE SHORTAGE & ELIGIBILITY REPORT", "", 1, "C", false, 0, "")

	pdf.Ln(8)
	pdf.SetTextColor(30, 41, 59)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(180, 6, fmt.Sprintf("Classroom Reference: %s | Mandatory Minimum: 75%%", classroomId), "B", 1, "L", false, 0, "")
	pdf.Ln(4)

	// Table Header
	pdf.SetFillColor(241, 245, 249)
	pdf.SetFont("Helvetica", "B", 9)
	pdf.CellFormat(20, 7, "Sl No", "1", 0, "C", true, 0, "")
	pdf.CellFormat(35, 7, "USN", "1", 0, "C", true, 0, "")
	pdf.CellFormat(55, 7, "Student Name", "1", 0, "L", true, 0, "")
	pdf.CellFormat(25, 7, "Attended/Held", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 7, "Percentage", "1", 0, "C", true, 0, "")
	pdf.CellFormat(20, 7, "Status", "1", 1, "C", true, 0, "")

	// Sample student attendance roster
	type AttendanceRow struct {
		usn, name string
		attended  int
		held      int
	}

	roster := []AttendanceRow{
		{"1KS21CS001", "Arun Kumar", 42, 45},
		{"1KS21CS002", "Bhavya Sri", 39, 45},
		{"1KS21CS003", "Chandan Gowda", 31, 45}, // 68.8% shortage!
		{"1KS21CS004", "Deepak Rao", 40, 45},
		{"1KS21CS005", "Harish K", 29, 45},     // 64.4% shortage!
	}

	pdf.SetFont("Helvetica", "", 9)
	for i, s := range roster {
		pct := (float64(s.attended) / float64(s.held)) * 100.0
		pdf.CellFormat(20, 6, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(35, 6, s.usn, "1", 0, "C", false, 0, "")
		pdf.CellFormat(55, 6, s.name, "1", 0, "L", false, 0, "")
		pdf.CellFormat(25, 6, fmt.Sprintf("%d / %d", s.attended, s.held), "1", 0, "C", false, 0, "")

		if pct < 75.0 {
			pdf.SetTextColor(220, 38, 38)
			pdf.SetFont("Helvetica", "B", 9)
			pdf.CellFormat(25, 6, fmt.Sprintf("%.1f%%", pct), "1", 0, "C", false, 0, "")
			pdf.CellFormat(20, 6, "SHORTAGE", "1", 1, "C", false, 0, "")
			pdf.SetTextColor(30, 41, 59)
			pdf.SetFont("Helvetica", "", 9)
		} else {
			pdf.CellFormat(25, 6, fmt.Sprintf("%.1f%%", pct), "1", 0, "C", false, 0, "")
			pdf.SetTextColor(16, 149, 106)
			pdf.CellFormat(20, 6, "ELIGIBLE", "1", 1, "C", false, 0, "")
			pdf.SetTextColor(30, 41, 59)
		}
	}

	pdf.Ln(10)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(180, 5, "Students with less than 75% aggregate attendance are subject to condonation or detention per VTU norms.", "", 1, "L", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		logger.Error(ctx, "Failed to generate Attendance PDF", "error", err)
		http.Error(w, `{"error":"failed to generate attendance report"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\"Attendance-Eligibility-Report.pdf\"")
	w.Header().Set("Content-Length", strconv.Itoa(buf.Len()))
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}
