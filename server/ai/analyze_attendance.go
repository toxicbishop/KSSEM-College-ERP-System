package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"google.golang.org/genai"
)

type AttendanceRecordInput struct {
	Date        string `json:"date"`
	StudentName string `json:"studentName"`
	Status      string `json:"status"`
}

type AttendanceAnalysisOutput struct {
	OverallSummary        string   `json:"overallSummary"`
	KeyObservations       []string `json:"keyObservations"`
	ActionableSuggestions []string `json:"actionableSuggestions"`
}

func AnalyzeAttendance(ctx context.Context, records []AttendanceRecordInput) (*AttendanceAnalysisOutput, error) {
	if len(records) == 0 {
		return &AttendanceAnalysisOutput{
			OverallSummary:        "No attendance records were provided for analysis.",
			KeyObservations:       []string{},
			ActionableSuggestions: []string{},
		}, nil
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: os.Getenv("GEMINI_API_KEY"),
	})
	if err != nil {
		return nil, err
	}

	prompt := "You are an expert academic data analyst. You are tasked with analyzing a set of attendance records for a classroom over a specific period. Your goal is to provide insightful and actionable feedback to the faculty member.\n\nBased on the records provided below, generate a concise analysis.\n\n- **Overall Summary**: Provide a brief, high-level summary of the attendance. Mention the overall percentage if possible and the general trend.\n- **Key Observations**: Identify specific, noteworthy patterns. Examples:\n    - \"Student X has been consistently absent on Mondays.\"\n    - \"Attendance was unusually low on [Date], which might correlate with an event or holiday.\"\n    - \"Student Y has perfect attendance.\"\n    - \"A group of students (A, B, C) are often absent together.\"\n- **Actionable Suggestions**: Provide a few concrete, supportive suggestions for the faculty member. Examples:\n    - \"Consider reaching out to students with attendance below 70% to offer support.\"\n    - \"A quick poll could help understand the reason for low attendance on specific days.\"\n    - \"Acknowledge students with excellent attendance to encourage them.\"\n\nKeep the tone professional, data-driven, and supportive. Do not invent data. Base your analysis strictly on the provided records.\n\nHere are the attendance records:\n"
	
	for _, rec := range records {
		prompt += fmt.Sprintf("- Date: %s, Student: %s, Status: %s\n", rec.Date, rec.StudentName, rec.Status)
	}

	schema := &genai.Schema{
		Type: genai.TypeObject,
		Properties: map[string]*genai.Schema{
			"overallSummary": {
				Type: genai.TypeString,
			},
			"keyObservations": {
				Type: genai.TypeArray,
				Items: &genai.Schema{
					Type: genai.TypeString,
				},
			},
			"actionableSuggestions": {
				Type: genai.TypeArray,
				Items: &genai.Schema{
					Type: genai.TypeString,
				},
			},
		},
		Required: []string{"overallSummary", "keyObservations", "actionableSuggestions"},
	}

	resp, err := client.Models.GenerateContent(ctx, "gemini-1.5-flash", genai.Text(prompt), &genai.GenerateContentConfig{
		ResponseMIMEType: "application/json",
		ResponseSchema:   schema,
	})
	
	if err != nil {
		return nil, err
	}
	
	if len(resp.Candidates) == 0 {
		return nil, fmt.Errorf("no candidates returned")
	}
	
	var output AttendanceAnalysisOutput
	err = json.Unmarshal([]byte(resp.Candidates[0].Content.Parts[0].Text), &output)
	if err != nil {
		return nil, err
	}
	
	return &output, nil
}
