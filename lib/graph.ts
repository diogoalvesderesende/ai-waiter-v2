import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { getIndex } from "./pinecone";
import { embedQuery } from "./embeddings";

/* ------------------------------------------------------------------ */
/*  State Definition                                                   */
/* ------------------------------------------------------------------ */

const AgentState = Annotation.Root({
  userMessage: Annotation<string>,
  namespace: Annotation<string>,
  isOnTopic: Annotation<boolean>,
  context: Annotation<string>,
  category: Annotation<string>,
});

export type AgentStateType = typeof AgentState.State;

/* ------------------------------------------------------------------ */
/*  Shared LLM                                                         */
/* ------------------------------------------------------------------ */

const llm = new ChatOpenAI({
  modelName: "gpt-5.2",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/* ------------------------------------------------------------------ */
/*  Node 1 — check_question                                            */
/* ------------------------------------------------------------------ */

async function checkQuestion(
  state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State>> {
  const response = await llm.invoke([
    {
      role: "system",
      content: `You are a classifier. Determine if the user's message is about a restaurant menu, food items, ordering, dietary restrictions, prices, or recommendations.
Respond with ONLY "True" if it is related, or "False" if it is off-topic.
Messages about greetings, saying hi, or asking what you can do should be classified as "True".`,
    },
    { role: "user", content: state.userMessage },
  ]);

  const text =
    typeof response.content === "string"
      ? response.content
      : String(response.content);

  const categoryResponse = await llm.invoke([
    {
      role: "system",
      content: `Extract the food category the user is asking about from their message.
If they mention a specific type (e.g., "dumplings", "seafood", "vegetarian", "dessert"), return that category in lowercase.
If no specific category is mentioned, return "all".
Return ONLY the category word, nothing else.`,
    },
    { role: "user", content: state.userMessage },
  ]);

  const category =
    typeof categoryResponse.content === "string"
      ? categoryResponse.content.trim().toLowerCase()
      : "all";

  return {
    isOnTopic: text.trim().toLowerCase().includes("true"),
    category,
  };
}

/* ------------------------------------------------------------------ */
/*  Node 2 — off_topic                                                 */
/* ------------------------------------------------------------------ */

async function offTopic(
  _state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State>> {
  return {
    context:
      "OFF_TOPIC: I appreciate the question, but I can only help with our restaurant menu! Ask me about dishes, prices, dietary info, or place an order.",
  };
}

/* ------------------------------------------------------------------ */
/*  Node 3 — retrieve_docs                                             */
/* ------------------------------------------------------------------ */

async function retrieveDocs(
  state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State>> {
  const queryEmbedding = await embedQuery(state.userMessage);
  const index = getIndex();

  // Rely on semantic search only; category filter often misses (e.g. "vegetarian" vs stored "soups")
  const results = await index.namespace(state.namespace).query({
    vector: queryEmbedding,
    topK: 10,
    includeMetadata: true,
  });

  if (!results.matches || results.matches.length === 0) {
    return { context: "No menu items found matching your query." };
  }

  const context = results.matches
    .map((m) => {
      const md = m.metadata as Record<string, unknown>;
      const categoryLabel = (md.categoryEn ?? md.category) ?? "General";
      return `• ${md.name} — ${md.description} | Category: ${categoryLabel} | Price: $${md.price} | Dietary: ${md.dietary}`;
    })
    .join("\n");

  return { context };
}

/* ------------------------------------------------------------------ */
/*  Routing                                                            */
/* ------------------------------------------------------------------ */

function routeAfterCheck(
  state: typeof AgentState.State
): "retrieve_docs" | "off_topic" {
  return state.isOnTopic ? "retrieve_docs" : "off_topic";
}

/* ------------------------------------------------------------------ */
/*  Compile Graph                                                      */
/* ------------------------------------------------------------------ */

const workflow = new StateGraph(AgentState)
  .addNode("check_question", checkQuestion)
  .addNode("off_topic", offTopic)
  .addNode("retrieve_docs", retrieveDocs)
  .addEdge(START, "check_question")
  .addConditionalEdges("check_question", routeAfterCheck, {
    retrieve_docs: "retrieve_docs",
    off_topic: "off_topic",
  })
  .addEdge("off_topic", END)
  .addEdge("retrieve_docs", END);

export const graph = workflow.compile();

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function runAgent(
  userMessage: string,
  namespace: string
): Promise<{ isOnTopic: boolean; context: string }> {
  const result = await graph.invoke({
    userMessage,
    namespace,
    isOnTopic: false,
    context: "",
    category: "all",
  });

  return {
    isOnTopic: result.isOnTopic,
    context: result.context,
  };
}
