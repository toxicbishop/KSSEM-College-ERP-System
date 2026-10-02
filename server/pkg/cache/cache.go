package cache

import (
	"sync"
	"time"
)

type item struct {
	value      interface{}
	expiration int64
}

// MemoryCache provides a fast, thread-safe in-memory key-value cache with TTL.
type MemoryCache struct {
	mu    sync.RWMutex
	items map[string]item
}

var defaultCache *MemoryCache
var once sync.Once

// Default returns the singleton memory cache instance.
func Default() *MemoryCache {
	once.Do(func() {
		defaultCache = New(5 * time.Minute)
	})
	return defaultCache
}

// New creates a new in-memory cache with periodic cleanup of expired items.
func New(cleanupInterval time.Duration) *MemoryCache {
	c := &MemoryCache{
		items: make(map[string]item),
	}

	go c.startCleanup(cleanupInterval)
	return c
}

// Set adds an item to the cache with a specified Time-To-Live.
func (c *MemoryCache) Set(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	var exp int64
	if ttl > 0 {
		exp = time.Now().Add(ttl).UnixNano()
	}

	c.items[key] = item{
		value:      value,
		expiration: exp,
	}
}

// Get retrieves an item from the cache. Returns (nil, false) if not found or expired.
func (c *MemoryCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	it, found := c.items[key]
	if !found {
		return nil, false
	}

	// Check if item has expired
	if it.expiration > 0 && time.Now().UnixNano() > it.expiration {
		return nil, false
	}

	return it.value, true
}

// Delete removes an item from the cache.
func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// Flush clears all items from the cache.
func (c *MemoryCache) Flush() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]item)
}

func (c *MemoryCache) startCleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		c.mu.Lock()
		now := time.Now().UnixNano()
		for k, v := range c.items {
			if v.expiration > 0 && now > v.expiration {
				delete(c.items, k)
			}
		}
		c.mu.Unlock()
	}
}
