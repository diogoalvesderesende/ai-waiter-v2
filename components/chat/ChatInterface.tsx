"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import ChatHeader from "./ChatHeader";
import PopularItems from "./PopularItems";
import CartReceipt from "./CartReceipt";
import SuggestionChips from "./SuggestionChips";

interface PopularItem {
  name: string;
  category: string;
  price: number;
}

interface CartItem {
  itemName: string;
  quantity: number;
  price: number;
}

const SUGGESTIONS = [
  "Vegetarian options?",
  "What's in the siu mai?",
  "I have an allergy",
];

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const WELCOME_MESSAGES: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Hi! I'm your Dim Sum Assistant. Craving something specific or need help with allergies?",
      },
    ],
  },
];

export default function ChatInterface() {
  const router = useRouter();
  const [namespace, setNamespace] = useState<string>("");
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const processedToolCalls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ns = sessionStorage.getItem("namespace");
    const items = sessionStorage.getItem("popularItems");

    if (!ns) {
      router.push("/");
      return;
    }

    setNamespace(ns);
    if (items) {
      try {
        setPopularItems(JSON.parse(items));
      } catch {
        /* ignore */
      }
    }
  }, [router]);

  const namespaceRef = useRef(namespace);
  useEffect(() => {
    namespaceRef.current = namespace;
  }, [namespace]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          namespace: namespaceRef.current,
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, sendMessage, status } = useChat({
    id: "dim-sum-chat",
    transport,
    messages: WELCOME_MESSAGES,
  });

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemName === item.itemName);
      if (existing) {
        return prev.map((c) =>
          c.itemName === item.itemName
            ? { ...c, quantity: c.quantity + item.quantity }
            : c
        );
      }
      return [...prev, item];
    });
  }, []);

  useEffect(() => {
    for (const msg of messages) {
      for (const part of msg.parts) {
        if ("toolCallId" in part && "input" in part && "output" in part) {
          const p = part as unknown as {
            toolCallId: string;
            input: CartItem;
            output: unknown;
            state: string;
          };
          if (
            p.state === "output" &&
            !processedToolCalls.current.has(p.toolCallId)
          ) {
            processedToolCalls.current.add(p.toolCallId);
            addToCart(p.input);
          }
        }
      }
    }
  }, [messages, addToCart]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || !namespace) return;
    setInput("");
    sendMessage({ text: msg });
  };

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-dvh flex-col bg-gray-50">
      <ChatHeader
        cartItemCount={cart.reduce((s, c) => s + c.quantity, 0)}
        onToggleCart={() => setShowCart(!showCart)}
      />

      {showCart && cart.length > 0 && (
        <div className="border-b border-gray-100 bg-white px-4 py-3 animate-slide-up">
          <CartReceipt items={cart} />
        </div>
      )}

      <PopularItems
        items={popularItems}
        onSelect={(item) => handleSend(`Tell me about ${item.name}`)}
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-hide"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const text = getMessageText(msg);

          const toolParts = msg.parts.filter(
            (p) => "toolCallId" in p && "input" in p
          ) as unknown as Array<{
            toolCallId: string;
            input: CartItem;
            state: string;
          }>;

          return (
            <div key={msg.id} className="space-y-2">
              {text && (
                <div
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">
                      W
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed animate-fade-in ${
                      isUser
                        ? "bg-brand-500 text-white rounded-br-sm"
                        : "bg-brand-50 text-gray-800 border border-brand-100 rounded-bl-sm"
                    }`}
                  >
                    {isUser ? (
                      text
                    ) : (
                      <Markdown
                        components={{
                          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                        }}
                      >
                        {text}
                      </Markdown>
                    )}
                  </div>
                </div>
              )}

              {toolParts.map((tp) => (
                <div key={tp.toolCallId} className="ml-9 flex justify-start">
                  <CartReceipt items={[tp.input]} />
                </div>
              ))}
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">
              W
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-brand-50 border border-brand-100 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <SuggestionChips suggestions={SUGGESTIONS} onSelect={handleSend} />

      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products, items..."
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          />
          <button
            type="submit"
            disabled={!namespace || !input.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-md shadow-brand-500/25 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
