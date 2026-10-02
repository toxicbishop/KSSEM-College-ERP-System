package academic

import (
	"testing"
)

func TestValidAttendanceStatuses(t *testing.T) {
	expectedStatuses := []string{"present", "absent", "late", "excused"}
	for _, status := range expectedStatuses {
		if !validStatuses[status] {
			t.Errorf("Expected status '%s' to be valid", status)
		}
	}

	invalidStatuses := []string{"unknown", "holiday", "bunk", "PENDING", ""}
	for _, status := range invalidStatuses {
		if validStatuses[status] {
			t.Errorf("Expected status '%s' to be invalid", status)
		}
	}
}

func TestAttendanceRatioCalculation(t *testing.T) {
	totalHeld := 40
	attended := 32

	pct := (float64(attended) / float64(totalHeld)) * 100.0
	expectedPct := 80.0

	if pct != expectedPct {
		t.Errorf("Expected %.1f%%, got %.1f%%", expectedPct, pct)
	}

	// 75% threshold eligibility check
	isEligible := pct >= 75.0
	if !isEligible {
		t.Errorf("Expected student with 80%% attendance to be eligible")
	}

	// Shortage case
	shortageAttended := 26
	shortagePct := (float64(shortageAttended) / float64(totalHeld)) * 100.0
	if shortagePct >= 75.0 {
		t.Errorf("Expected 26/40 (65%%) to fail eligibility check")
	}
}
