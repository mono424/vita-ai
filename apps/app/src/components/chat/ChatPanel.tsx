import { createEffect, For } from 'solid-js';
import { useDb, useQuery } from '@spooky-sync/client-solid';
import { schema } from '../../schema.gen';
import { useAuth } from '../../auth';
import { importEntries, type ImportSummary } from '../../lib/import-entries';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel(props: ChatPanelProps) {
  const db = useDb<typeof schema>();
  const auth = useAuth();
  let messagesEndRef: HTMLDivElement | undefined;

  // Query chat messages for the current user
  const messagesQuery = useQuery(
    () => db.query('chat_message' as any).where({ owner: auth.userId()! } as any).build() as any,
    { enabled: () => auth.userId() !== null }
  );

  const messages = () => {
    const data = (messagesQuery.data() as any[]) || [];
    return [...data].sort((a, b) => {
      const aTime = a.created_at || '';
      const bTime = b.created_at || '';
      return aTime < bTime ? -1 : aTime > bTime ? 1 : 0;
    });
  };

  const isWriting = () => messages().some((m: any) => m.writing);

  // Query agent jobs for chat
  const jobQuery = useQuery(
    () => db.query('jobs_agent' as any).where({ assigned_to: auth.userId()! } as any).build() as any,
    { enabled: () => auth.userId() !== null }
  );

  const jobs = () => (jobQuery.data() as any[]) || [];

  // Track which job IDs we've already processed
  const processedJobs = new Set<string>();

  // Watch for job completion and update assistant messages
  createEffect(() => {
    const allJobs = jobs();
    const allMessages = messages();

    for (const job of allJobs) {
      if (processedJobs.has(job.id)) continue;
      if (job.status !== 'success' && job.status !== 'failed') continue;
      // Only handle chat jobs
      if (job.path !== '/chat') continue;

      processedJobs.add(job.id);

      // Find the assistant message linked to this job
      const assistantMsg = allMessages.find(
        (m: any) => m.job_id === job.id && m.role === 'assistant' && m.writing
      );
      if (!assistantMsg) continue;

      if (job.status === 'success') {
        const result = job.payload?.result || job.result;
        const chatResponse = result as { message?: string; action?: string; import_result?: any } | undefined;

        if (chatResponse?.import_result) {
          importEntries(db, auth.userId()!, chatResponse.import_result)
            .then((summary: ImportSummary) => {
              db.update('chat_message' as any, assistantMsg.id as any, {
                content: chatResponse.message || 'Done!',
                writing: false,
                import_summary: summary,
              } as any);
            })
            .catch(() => {
              db.update('chat_message' as any, assistantMsg.id as any, {
                content: chatResponse?.message || 'Import completed, but had trouble saving some entries.',
                writing: false,
              } as any);
            });
        } else {
          db.update('chat_message' as any, assistantMsg.id as any, {
            content: chatResponse?.message || 'Done!',
            writing: false,
          } as any);
        }
      } else if (job.status === 'failed') {
        const errors = job.errors as any[] | undefined;
        const lastError = errors?.length ? errors[errors.length - 1] : null;
        db.update('chat_message' as any, assistantMsg.id as any, {
          content: lastError?.message || 'Sorry, something went wrong. Please try again.',
          writing: false,
        } as any);
      }
    }
  });

  // Auto-scroll to bottom when messages change
  createEffect(() => {
    messages();
    setTimeout(() => {
      messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  });

  const handleSend = async (content: string) => {
    const userId = auth.userId();
    if (!userId) return;

    // Create user message
    const userMsgId = `chat_message:${crypto.randomUUID().replace(/-/g, '')}`;
    await db.create(userMsgId as any, {
      owner: userId,
      role: 'user',
      content,
      writing: false,
    } as any);

    // Create placeholder assistant message (job_id will be linked after db.run)
    const assistantMsgId = `chat_message:${crypto.randomUUID().replace(/-/g, '')}`;
    await db.create(assistantMsgId as any, {
      owner: userId,
      role: 'assistant',
      content: '',
      writing: true,
      job_id: '',
    } as any);

    // Trigger the agent via outbox
    try {
      await db.run('agent' as any, '/chat' as any, {
        message: content,
        owner_id: userId,
      } as any, {
        assignedTo: userId,
      });

      // Link the assistant message to the latest chat job
      // db.run creates the job record; find it and link
      setTimeout(async () => {
        const currentJobs = jobs().filter((j: any) => j.path === '/chat');
        if (currentJobs.length > 0) {
          const latest = currentJobs[currentJobs.length - 1];
          await db.update('chat_message' as any, assistantMsgId as any, {
            job_id: latest.id,
          } as any);
        }
      }, 100);
    } catch (err: any) {
      await db.update('chat_message' as any, assistantMsgId as any, {
        content: err.message || 'Failed to send message. Please try again.',
        writing: false,
      } as any);
    }
  };

  return (
    <div class="w-96 border-l border-white/[0.06] flex flex-col bg-zinc-950 h-full">
      {/* Header */}
      <div class="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <h3 class="text-sm font-medium text-white">AI Assistant</h3>
        <button
          onClick={props.onClose}
          class="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          Close
        </button>
      </div>

      {/* Messages */}
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <For each={messages()}>
          {(msg: any) => (
            <ChatBubble
              role={msg.role}
              content={msg.content || ''}
              writing={msg.writing || false}
              import_summary={msg.import_summary}
            />
          )}
        </For>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput disabled={isWriting()} onSend={handleSend} />
    </div>
  );
}
