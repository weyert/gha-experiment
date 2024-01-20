export type WebhookEventType = {
  EventType: string;
  JsonSchema: string;
};

export const MOCK_EVENT_TYPES: WebhookEventType[] = [
  {
    EventType: "PersonCreated",
    JsonSchema: JSON.stringify(
      {
        title: "PersonCreated",
        type: "object",
        properties: [
          {
            name: "ExternalIdentifier",
            description: "The reference for this person in an external system.",
          },
        ],
      },
      null,
      2
    ),
  },
];
