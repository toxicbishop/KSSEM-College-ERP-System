package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
)

func (s *CommunicationServer) StartWorker(ctx context.Context) {
	if s.rdb == nil {
		logger.Warn(ctx, "Redis not initialized, worker will not start")
		return
	}

	logger.Info(ctx, "Starting Communication Redis Stream Worker")

	// Ensure the stream exists and create a consumer group
	err := s.rdb.XGroupCreateMkStream(ctx, "grades:events", "communication_group", "$").Err()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		logger.Error(ctx, "Failed to create consumer group", "error", err)
	}

	for {
		select {
		case <-ctx.Done():
			logger.Info(ctx, "Worker stopping")
			return
		default:
			// Read from the stream
			streams, err := s.rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
				Group:    "communication_group",
				Consumer: "communication_worker_1",
				Streams:  []string{"grades:events", ">"},
				Count:    10,
				Block:    5 * time.Second,
			}).Result()

			if err != nil {
				if err == redis.Nil {
					// Timeout, just continue
					continue
				}
				logger.Error(ctx, "Failed to read from stream", "error", err)
				time.Sleep(1 * time.Second)
				continue
			}

			for _, stream := range streams {
				for _, msg := range stream.Messages {
					s.processMessage(ctx, msg)
					// Acknowledge the message
					s.rdb.XAck(ctx, "grades:events", "communication_group", msg.ID)
				}
			}
		}
	}
}

func (s *CommunicationServer) processMessage(ctx context.Context, msg redis.XMessage) {
	logger.Info(ctx, "Received message from grades:events", "msg_id", msg.ID, "values", msg.Values)

	studentId, ok := msg.Values["studentId"].(string)
	if !ok {
		return
	}

	// Example message format: action: "GRADE_PUBLISHED", details: "..."
	action, _ := msg.Values["action"].(string)

	title := "New Notification"
	messageBody := fmt.Sprintf("Event: %s", action)

	if action == "GRADE_PUBLISHED" {
		gradeID, _ := msg.Values["gradeId"].(string)
		courseName, _ := msg.Values["courseName"].(string)
		grade, _ := msg.Values["grade"].(string)
		title = "New Grades Published"
		messageBody = fmt.Sprintf("Your grade for %s is %s (grade ID: %s).", courseName, grade, gradeID)
	}

	// Create a notification in Firestore
	if s.db != nil {
		_, _, err := s.db.Collection("users").Doc(studentId).Collection("notifications").Add(ctx, map[string]interface{}{
			"title":     title,
			"message":   messageBody,
			"type":      "system",
			"read":      false,
			"link":      fmt.Sprintf("/student/results?gradeId=%v", msg.Values["gradeId"]),
			"timestamp": time.Now(),
		})

		if err != nil {
			logger.Error(ctx, "Failed to create notification", "error", err)
		} else {
			logger.Info(ctx, "Created notification for student", "studentId", studentId)
		}
	}
}
