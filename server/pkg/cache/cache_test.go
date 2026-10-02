package cache

import (
	"testing"
	"time"
)

func TestMemoryCacheSetGet(t *testing.T) {
	c := New(1 * time.Minute)

	c.Set("course:21CS61", "Software Engineering", 5*time.Minute)

	val, found := c.Get("course:21CS61")
	if !found {
		t.Fatalf("Expected key to be found")
	}

	if val.(string) != "Software Engineering" {
		t.Errorf("Expected 'Software Engineering', got %v", val)
	}

	// Non-existent key
	_, foundMissing := c.Get("nonexistent")
	if foundMissing {
		t.Errorf("Expected nonexistent key to return false")
	}
}

func TestMemoryCacheExpiration(t *testing.T) {
	c := New(50 * time.Millisecond)

	// Set with very short TTL
	c.Set("short_lived", "expires soon", 50*time.Millisecond)

	// Immediately should be present
	_, found := c.Get("short_lived")
	if !found {
		t.Fatalf("Expected key to be present before expiration")
	}

	// Wait for TTL to pass
	time.Sleep(70 * time.Millisecond)

	_, foundAfter := c.Get("short_lived")
	if foundAfter {
		t.Errorf("Expected key to be expired and not found")
	}
}

func TestMemoryCacheDeleteAndFlush(t *testing.T) {
	c := New(1 * time.Minute)

	c.Set("k1", "v1", 0)
	c.Set("k2", "v2", 0)

	c.Delete("k1")
	if _, found := c.Get("k1"); found {
		t.Errorf("Expected k1 to be deleted")
	}

	c.Flush()
	if _, found := c.Get("k2"); found {
		t.Errorf("Expected k2 to be cleared by Flush")
	}
}
