import {
  streamText,
  tool,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { runAgent } from "@/lib/graph";

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();

  const namespace: string | undefined = body.namespace;
  const uiMessages: UIMessage[] | undefined = body.messages;

  if (!namespace) {
    return new Response(
      JSON.stringify({ error: "No menu session. Upload your menu first." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!uiMessages || !Array.isArray(uiMessages) || uiMessages.length === 0) {
    return new Response(
      JSON.stringify({ error: "No messages provided." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const modelMessages = await convertToModelMessages(uiMessages);

  const lastUserMsg = modelMessages
    .filter((m) => m.role === "user")
    .pop();

  const lastUserText =
    typeof lastUserMsg?.content === "string"
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg?.content)
        ? lastUserMsg.content
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join(" ")
        : "";

  if (!lastUserText) {
    return new Response(
      JSON.stringify({ error: "Could not extract user message." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { isOnTopic, context } = await runAgent(lastUserText, namespace);

  if (!isOnTopic || context.startsWith("OFF_TOPIC:")) {
    const offTopicMsg = context.startsWith("OFF_TOPIC:")
      ? context.replace("OFF_TOPIC: ", "")
      : "I can only help with our restaurant menu! Ask me about dishes, prices, or dietary info.";

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: `You must respond with exactly this message and nothing else: "${offTopicMsg}"`,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  }

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are a friendly, enthusiastic dim sum restaurant assistant called "Dim Sum Montijo AI Waiter".

CONTEXT — here are the relevant menu items:
${context}

RULES:
1. Answer based ONLY on the menu context above. Never invent items.
2. Be casual, warm, and enthusiastic — like a real waiter who loves the food.
3. Keep answers to 1-2 sentences MAX unless listing items.
4. When listing items, use a clean format with names and prices.
5. If the user wants to ORDER or ADD something to their cart, you MUST call the add_to_cart tool with the exact item name, quantity, and price from the menu context. Then confirm the addition in a friendly way.
6. For dietary questions, check the "Dietary" field in the context and be precise.
7. Always mention prices when recommending items.`,
    messages: modelMessages,
    tools: {
      add_to_cart: tool({
        description:
          "Add a menu item to the customer's order/cart. Use this when the user wants to order, add, or get an item.",
        inputSchema: z.object({
          itemName: z.string().describe("The exact name of the menu item"),
          quantity: z
            .number()
            .describe("How many of this item (default 1)")
            .default(1),
          price: z
            .number()
            .describe("The price per unit from the menu context"),
        }),
        outputSchema: z.object({
          itemName: z.string(),
          quantity: z.number(),
          price: z.number(),
          total: z.number(),
          success: z.boolean(),
        }),
        execute: async ({ itemName, quantity, price }) => {
          return {
            itemName,
            quantity,
            price,
            total: quantity * price,
            success: true,
          };
        },
      }),
    },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}
