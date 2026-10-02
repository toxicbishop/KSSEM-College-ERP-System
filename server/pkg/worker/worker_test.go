package worker

import (
	"context"
	"sync/atomic"
	"testing"
	"time"
)

func TestWorkerPool(t *testing.T) {
	pool := InitGlobalPool(3, 10)

	var counter int64
	numJobs := 5

	for i := 0; i < numJobs; i++ {
		success := pool.Submit(func(ctx context.Context) error {
			atomic.AddInt64(&counter, 1)
			return nil
		})
		if !success {
			t.Fatalf("Failed to submit job %d", i)
		}
	}

	// Give workers a moment to process the jobs
	time.Sleep(100 * time.Millisecond)

	finalCount := atomic.LoadInt64(&counter)
	if finalCount != int64(numJobs) {
		t.Errorf("Expected %d completed jobs, got %d", numJobs, finalCount)
	}
}
