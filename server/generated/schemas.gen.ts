// Auto-generated from spec/openapi.yaml. Do not edit.

export const schemas = [
  {
      "$id": "BookingRequest",
      "type": "object",
      "required": [
        "eventTypeId",
        "startDateTime",
        "guestName",
        "topic"
      ],
      "properties": {
        "eventTypeId": {
          "type": "string"
        },
        "startDateTime": {
          "type": "string"
        },
        "guestName": {
          "type": "string"
        },
        "topic": {
          "type": "string"
        },
        "guestEmail": {
          "type": "string"
        }
      }
    },
  {
      "$id": "ConflictError",
      "type": "object",
      "required": [
        "message"
      ],
      "properties": {
        "message": {
          "type": "string"
        }
      }
    },
  {
      "$id": "DayHours",
      "type": "object",
      "required": [
        "start",
        "end"
      ],
      "properties": {
        "start": {
          "type": "string"
        },
        "end": {
          "type": "string"
        }
      }
    },
  {
      "$id": "EventType",
      "type": "object",
      "required": [
        "id",
        "name",
        "description",
        "durationMinutes",
        "format"
      ],
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "durationMinutes": {
          "type": "integer",
          "format": "int32"
        },
        "format": {
          "$ref": "MeetingFormat"
        }
      }
    },
  {
      "$id": "EventTypeCreate",
      "type": "object",
      "required": [
        "name",
        "description",
        "durationMinutes",
        "format"
      ],
      "properties": {
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "durationMinutes": {
          "type": "integer",
          "format": "int32"
        },
        "format": {
          "$ref": "MeetingFormat"
        }
      }
    },
  {
      "$id": "EventTypeUpdate",
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "durationMinutes": {
          "type": "integer",
          "format": "int32"
        },
        "format": {
          "$ref": "MeetingFormat"
        }
      }
    },
  {
      "$id": "Meeting",
      "type": "object",
      "required": [
        "id",
        "eventTypeId",
        "eventTypeName",
        "eventTypeDescription",
        "eventTypeDurationMinutes",
        "eventTypeFormat",
        "startDateTime",
        "guestName",
        "topic"
      ],
      "properties": {
        "id": {
          "type": "string"
        },
        "eventTypeId": {
          "type": "string"
        },
        "eventTypeName": {
          "type": "string"
        },
        "eventTypeDescription": {
          "type": "string"
        },
        "eventTypeDurationMinutes": {
          "type": "integer",
          "format": "int32"
        },
        "eventTypeFormat": {
          "$ref": "MeetingFormat"
        },
        "startDateTime": {
          "type": "string"
        },
        "guestName": {
          "type": "string"
        },
        "topic": {
          "type": "string"
        },
        "guestEmail": {
          "type": "string"
        }
      }
    },
  {
      "$id": "MeetingFormat",
      "type": "string",
      "enum": [
        "online",
        "offline"
      ]
    },
  {
      "$id": "NotFoundError",
      "type": "object",
      "required": [
        "message"
      ],
      "properties": {
        "message": {
          "type": "string"
        }
      }
    },
  {
      "$id": "Slot",
      "type": "object",
      "required": [
        "startDateTime",
        "status"
      ],
      "properties": {
        "startDateTime": {
          "type": "string"
        },
        "status": {
          "$ref": "SlotStatus"
        }
      }
    },
  {
      "$id": "SlotStatus",
      "type": "string",
      "enum": [
        "free",
        "busy",
        "unavailable"
      ]
    },
  {
      "$id": "ValidationError",
      "type": "object",
      "required": [
        "message"
      ],
      "properties": {
        "message": {
          "type": "string"
        }
      }
    },
  {
      "$id": "WorkingHours",
      "type": "object",
      "required": [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      ],
      "properties": {
        "monday": {
          "anyOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$ref": "DayHours"
                }
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "tuesday": {
          "anyOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$ref": "DayHours"
                }
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "wednesday": {
          "anyOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$ref": "DayHours"
                }
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "thursday": {
          "anyOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$ref": "DayHours"
                }
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "friday": {
          "anyOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$ref": "DayHours"
                }
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "saturday": {
          "anyOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$ref": "DayHours"
                }
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "sunday": {
          "anyOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$ref": "DayHours"
                }
              ]
            },
            {
              "type": "null"
            }
          ]
        }
      }
    },
]
