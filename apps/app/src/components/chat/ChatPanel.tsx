import { createEffect, createSignal, For, Show } from "solid-js";
import { useDb, useQuery, useFileUpload } from "@spooky-sync/client-solid";
import { schema } from "../../schema.gen";
import { useAuth } from "../../auth";
import { importEntries, type ImportSummary } from "../../lib/import-entries";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel(props: ChatPanelProps) {
  const db = useDb<typeof schema>();
  const auth = useAuth();
  // @ts-expect-error — bucket name is valid but generic inference doesn't resolve
  const fileUpload = useFileUpload("chat_documents");
  let messagesEndRef: HTMLDivElement | undefined;

  const [activeSessionId, setActiveSessionId] = createSignal<string | null>(
    null,
  );
  const [showSessionList, setShowSessionList] = createSignal(false);
  const [sessionCreating, setSessionCreating] = createSignal(false);

  // Query chat sessions for the current user
  const sessionsQuery = useQuery(
    () => db.query("chat_session").where({ owner: auth.userId()! }).build(),
    { enabled: () => auth.userId() !== null },
  );

  const sessions = () => {
    const data = sessionsQuery.data() || [];
    return [...data].sort((a, b) => {
      const aTime = a.created_at || "";
      const bTime = b.created_at || "";
      return aTime > bTime ? -1 : aTime < bTime ? 1 : 0;
    });
  };

  // Auto-select most recent session only on initial load or when active session is deleted
  const [userSelected, setUserSelected] = createSignal(false);

  createEffect(() => {
    if (sessionsQuery.isLoading() || userSelected()) return;
    const allSessions = sessions();
    if (allSessions.length > 0 && !activeSessionId()) {
      setActiveSessionId(allSessions[0].id);
    }
  });

  const createNewSession = async () => {
    const userId = auth.userId();
    if (!userId || sessionCreating()) return;
    setSessionCreating(true);
    try {
      const sessionId = `chat_session:${crypto.randomUUID().replace(/-/g, "")}`;
      await db.create(
        sessionId as any,
        {
          owner: userId,
          title: "",
        } as any,
      );
      setUserSelected(true);
      setActiveSessionId(sessionId);
      setShowSessionList(false);
    } catch (err) {
      console.error("Failed to create chat session:", err);
    } finally {
      setSessionCreating(false);
    }
  };

  // Single query: messages with jobs and files joined
  const messagesQuery = useQuery(
    () =>
      db
        .query("chat_message")
        .where({ chat_session: activeSessionId()! })
        .related("jobs_agents" as any)
        .related("chat_files" as any)
        .build(),
    { enabled: () => activeSessionId() !== null },
  );

  const messages = () => {
    const data = (messagesQuery.data() as any[]) || [];
    return [...data].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
  };

  const isWriting = () =>
    messages().some((m: any) => {
      if (!m.writing) return false;
      const jobs = m.jobs_agents || [];
      if (jobs.length === 0) return m.writing;
      return jobs.some(
        (j: any) => j.status === "pending" || j.status === "processing",
      );
    });

  // Handle failed jobs: update message content when all jobs fail
  const processedFailures = new Set<string>();

  createEffect(() => {
    for (const msg of messages()) {
      const jobs = msg.jobs_agents || [];
      if (
        msg.role !== "assistant" ||
        !msg.writing ||
        jobs.length === 0 ||
        processedFailures.has(msg.id)
      )
        continue;

      const allFailed =
        jobs.length > 0 && jobs.every((j: any) => j.status === "failed");
      if (allFailed) {
        processedFailures.add(msg.id);
        const lastJob = jobs[jobs.length - 1];
        const errors = lastJob.errors as any[] | undefined;
        const lastError = errors?.length ? errors[errors.length - 1] : null;
        db.update(
          "chat_message" as any,
          msg.id as any,
          {
            content:
              lastError?.message ||
              "Sorry, something went wrong. Please try again.",
            writing: false,
          } as any,
        );
      }
    }
  });

  // Process import_result on new assistant messages written by the agent service
  // Uses import_summary (persisted in DB) as the durable guard, plus an in-memory
  // set to prevent concurrent processing within the same page session.
  const importingNow = new Set<string>();

  createEffect(() => {
    const allMessages = messages();
    const userId = auth.userId();
    if (!userId) return;

    for (const msg of allMessages) {
      if (
        msg.role === "assistant" &&
        msg.import_result &&
        !msg.import_summary &&
        !importingNow.has(msg.id)
      ) {
        importingNow.add(msg.id);
        importEntries(db, userId, msg.import_result)
          .then((summary: ImportSummary) => {
            db.update(
              "chat_message" as any,
              msg.id as any,
              {
                import_result: null,
                import_summary: summary,
              } as any,
            );
          })
          .catch(() => {
            db.update(
              "chat_message" as any,
              msg.id as any,
              {
                import_result: null,
              } as any,
            );
          })
          .finally(() => {
            importingNow.delete(msg.id);
          });
      }
    }
  });

  createEffect(() => {
    messages();
    setTimeout(() => {
      messagesEndRef?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  });

  const handleConfirmUpdates = async (messageId: string) => {
    const msg = messages().find((m: any) => m.id === messageId);
    if (!msg?.pending_user_updates) return;
    const userId = auth.userId();
    if (!userId) return;

    await db.update("user" as any, userId as any, msg.pending_user_updates as any);
    await db.update("chat_message" as any, messageId as any, {
      pending_user_updates: null,
      import_summary: { ...(msg.import_summary || {}), user_updated: true },
    } as any);
  };

  const handleSkipUpdates = async (messageId: string) => {
    await db.update("chat_message" as any, messageId as any, {
      pending_user_updates: null,
    } as any);
  };

  const handleSend = async (content: string, files: File[] = []) => {
    const userId = auth.userId();
    if (!userId) return;

    // Create a session on first message if none exists
    let sessionId = activeSessionId();
    if (!sessionId) {
      const newId = `chat_session:${crypto.randomUUID().replace(/-/g, "")}`;
      const title =
        content.length > 40 ? content.slice(0, 40) + "..." : content;
      await db.create(newId as any, { owner: userId, title } as any);
      setActiveSessionId(newId);
      sessionId = newId;
    } else {
      const currentSession = sessions().find((s: any) => s.id === sessionId);
      if (currentSession && !currentSession.title) {
        const title =
          content.length > 40 ? content.slice(0, 40) + "..." : content;
        await db.update(
          "chat_session" as any,
          sessionId as any,
          { title } as any,
        );
      }
    }

    // Upload files to bucket
    const fileRefs: Array<{ path: string; name: string }> = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${Date.now()}_${safeName}`;
      try {
        await fileUpload.upload(path, file);
        fileRefs.push({ path, name: file.name });
      } catch (err) {
        console.error("Failed to upload file:", file.name, err);
      }
    }

    const userMsgId = `chat_message:${crypto.randomUUID().replace(/-/g, "")}`;
    await db.create(
      userMsgId as any,
      {
        owner: userId,
        role: "user",
        content,
        writing: false,
        chat_session: sessionId,
      } as any,
    );

    // Create chat_file records for each uploaded file
    for (const ref of fileRefs) {
      await db.create("chat_file", {
        chat_message: userMsgId,
        name: ref.name,
        path: ref.path,
      });
    }

    const assistantMsgId = `chat_message:${crypto.randomUUID().replace(/-/g, "")}`;
    await db.create(assistantMsgId, {
      owner: userId,
      role: "assistant",
      content: "",
      writing: true,
      chat_session: sessionId,
    });

    try {
      await db.run(
        "agent",
        "/chat",
        {
          message: content,
          owner_id: userId,
          session: sessionId,
          message_id: assistantMsgId,
          ...(fileRefs.length > 0 ? { files: JSON.stringify(fileRefs) } : {}),
        },
        {
          assignedTo: assistantMsgId,
        },
      );
    } catch (err: any) {
      await db.update(
        "chat_message" as any,
        assistantMsgId as any,
        {
          content: err.message || "Failed to send message. Please try again.",
          writing: false,
        } as any,
      );
    }
  };

  const handleRetry = async (failedAssistantMsgId: string) => {
    const userId = auth.userId();
    if (!userId) return;

    const allMessages = messages();
    const failedIndex = allMessages.findIndex(
      (m: any) => m.id === failedAssistantMsgId,
    );
    if (failedIndex < 0) return;

    // Find the preceding user message
    let userMsg: any = null;
    for (let i = failedIndex - 1; i >= 0; i--) {
      if (allMessages[i].role === "user") {
        userMsg = allMessages[i];
        break;
      }
    }
    if (!userMsg) return;

    const sessionId = activeSessionId();
    if (!sessionId) return;

    // Get file refs from the user message's joined chat_files
    const fileRefs = (userMsg.chat_files || []).map((f: any) => ({
      path: f.path,
      name: f.name,
    }));

    // Reset the assistant message to writing state
    await db.update(
      "chat_message" as any,
      failedAssistantMsgId as any,
      {
        content: "",
        writing: true,
      } as any,
    );

    // Re-invoke the agent
    try {
      await db.run(
        "agent" as any,
        "/chat" as any,
        {
          message: userMsg.content,
          owner_id: userId,
          session: sessionId,
          message_id: failedAssistantMsgId,
          ...(fileRefs.length > 0 ? { files: JSON.stringify(fileRefs) } : {}),
        } as any,
        {
          assignedTo: failedAssistantMsgId,
        },
      );
    } catch (err: any) {
      await db.update(
        "chat_message" as any,
        failedAssistantMsgId as any,
        {
          content: err.message || "Failed to send message. Please try again.",
          writing: false,
        } as any,
      );
    }
  };

  const deleteSession = async (sessionId: string) => {
    const msgs = (messagesQuery.data() as any[]) || [];
    const sessionMsgs = msgs.filter(
      (m: any) => m.chat_session === sessionId,
    );
    for (const msg of sessionMsgs) {
      const files = msg.chat_files || [];
      for (const f of files) {
        await db.delete("chat_file" as any, f.id as any);
      }
      await db.delete("chat_message" as any, msg.id as any);
    }
    await db.delete("chat_session" as any, sessionId as any);

    if (activeSessionId() === sessionId) {
      const remaining = sessions().filter((s: any) => s.id !== sessionId);
      if (remaining.length > 0) {
        setUserSelected(true);
        setActiveSessionId(remaining[0].id);
      } else {
        setUserSelected(false);
        setActiveSessionId(null);
      }
    }
  };

  const activeSessionTitle = () => {
    const session = sessions().find((s: any) => s.id === activeSessionId());
    return session?.title || "New Chat";
  };

  return (
    <div class="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-50 flex flex-col w-full md:w-[400px] h-full md:h-[600px] md:max-h-[calc(100vh-48px)] animate-chat-in">
      <div class="flex flex-col h-full bg-white dark:bg-zinc-900 md:rounded-2xl md:border border-zinc-200 dark:border-white/10 md:shadow-[0_16px_60px_-12px_rgba(0,0,0,0.25),0_8px_20px_-8px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header */}
        <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/[0.06]">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            {/* Session selector */}
            <div class="relative min-w-0 flex-1">
              <button
                onClick={() => setShowSessionList(!showSessionList())}
                class="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors truncate"
              >
                <span class="truncate">{activeSessionTitle()}</span>
                <svg
                  class="w-3 h-3 shrink-0 text-zinc-400"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3 5l3 3 3-3"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <Show when={showSessionList()}>
                <div class="absolute top-8 left-0 w-60 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] z-50 max-h-64 overflow-y-auto py-1">
                  <For each={sessions()}>
                    {(session: any) => (
                      <div
                        class={`flex items-center gap-1 px-3 py-2 transition-colors group ${
                          session.id === activeSessionId()
                            ? "bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-white"
                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <button
                          onClick={() => {
                            setUserSelected(true);
                            setActiveSessionId(session.id);
                            setShowSessionList(false);
                          }}
                          class="flex-1 text-left min-w-0"
                        >
                          <div class="text-[13px] truncate font-medium">
                            {session.title || "New Chat"}
                          </div>
                          <div class="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {session.created_at
                              ? new Date(session.created_at).toLocaleDateString()
                              : ""}
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          class="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Delete chat"
                        >
                          <svg class="w-3 h-3" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M4 4l8 8M12 4l-8 8"
                              stroke="currentColor"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* New chat */}
            <button
              onClick={createNewSession}
              class="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all shrink-0"
              title="New Chat"
            >
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Close */}
          <button
            onClick={props.onClose}
            class="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all ml-1 shrink-0"
          >
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Click-away */}
        <Show when={showSessionList()}>
          <div
            class="fixed inset-0 z-40"
            onClick={() => setShowSessionList(false)}
          />
        </Show>

        {/* Messages */}
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <Show when={messages().length === 0}>
            <div class="flex flex-col items-center justify-center h-full text-center">
              <div class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center mb-3">
                <svg
                  class="w-5 h-5 text-zinc-400"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M2 3.5C2 2.67 2.67 2 3.5 2h9c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H6l-2.5 2.5V12H3.5C2.67 12 2 11.33 2 10.5v-7z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <p class="text-[13px] font-medium text-zinc-900 dark:text-white">
                VitaAI
              </p>
              <p class="text-[12px] text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
                Ask me anything about your CV. I can help you write, edit, and
                improve your content.
              </p>
            </div>
          </Show>
          <For each={messages()}>
            {(msg: any) => (
              <ChatBubble
                message={msg}
                onRetry={handleRetry}
                onConfirmUpdates={handleConfirmUpdates}
                onSkipUpdates={handleSkipUpdates}
              />
            )}
          </For>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput disabled={isWriting()} onSend={handleSend} />
      </div>
    </div>
  );
}
