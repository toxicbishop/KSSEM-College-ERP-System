package worker

import (
	"context"
	"sync"
	"time"

	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
)

type Job func(ctx context.Context) error

type Pool struct {
	jobQueue chan Job
	wg       sync.WaitGroup
	ctx      context.Context
	cancel   context.CancelFunc
	mu       sync.Mutex
	isClosed bool
}

var globalPool *Pool
var once sync.Once

// InitGlobalPool initializes the default application background worker pool.
func InitGlobalPool(workerCount int, queueSize int) *Pool {
	once.Do(func() {
		ctx, cancel := context.WithCancel(context.Background())
		p := &Pool{
			jobQueue: make(chan Job, queueSize),
			ctx:      ctx,
			cancel:   cancel,
		}

		for i := 0; i < workerCount; i++ {
			p.wg.Add(1)
			go p.worker(i)
		}

		globalPool = p
	})
	return globalPool
}

// GetGlobalPool returns the singleton background worker pool.
func GetGlobalPool() *Pool {
	if globalPool == nil {
		return InitGlobalPool(5, 100)
	}
	return globalPool
}

func (p *Pool) worker(id int) {
	defer p.wg.Done()

	for {
		select {
		case <-p.ctx.Done():
			// Drain remaining jobs before exiting
			for job := range p.jobQueue {
				p.executeJob(job)
			}
			return
		case job, ok := <-p.jobQueue:
			if !ok {
				return
			}
			p.executeJob(job)
		}
	}
}

func (p *Pool) executeJob(job Job) {
	defer func() {
		if r := recover(); r != nil {
			logger.Error(context.Background(), "Background worker recovered from panic", "panic", r)
		}
	}()

	// Execute with a generous 1-minute timeout
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
	defer cancel()

	if err := job(ctx); err != nil {
		logger.Error(ctx, "Background job error", "error", err)
	}
}

// Submit queues a job to be processed asynchronously by the worker pool.
// Returns false if the queue is full or pool is shut down.
func (p *Pool) Submit(job Job) bool {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.isClosed {
		return false
	}

	select {
	case p.jobQueue <- job:
		return true
	default:
		// Queue full - run in a fallback goroutine so critical operations are not lost
		go p.executeJob(job)
		return true
	}
}

// SubmitJob submits a job to the global pool.
func SubmitJob(job Job) bool {
	return GetGlobalPool().Submit(job)
}

// Shutdown gracefully shuts down the worker pool, waiting for in-flight tasks.
func (p *Pool) Shutdown(timeout time.Duration) {
	p.mu.Lock()
	if p.isClosed {
		p.mu.Unlock()
		return
	}
	p.isClosed = true
	close(p.jobQueue)
	p.mu.Unlock()

	p.cancel()

	done := make(chan struct{})
	go func() {
		p.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(timeout):
		logger.Warn(context.Background(), "Worker pool shutdown timed out")
	}
}
