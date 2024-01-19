import { StreamingTextResponse, LangChainStream} from 'ai';
import { OpenAIAssistantRunnable } from 'langchain/experimental/openai_assistant';
import { ThreadMessage } from 'openai/resources/beta/threads/messages/messages';



export const runtime = 'edge';
interface Text {
  value: string;
  annotations: any[];
}

interface Content {
  type: string;
  text: Text;
}

interface Message {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  role: string;
  content: Content[];
  file_ids: any[];
  assistant_id: string;
  run_id: string;
  metadata: Record<string, unknown>;
}

interface Thread {
  messages: Message[];
}

type InputObject = {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
};

function adaptObjectsNoMemory(inputArray: InputObject[]): Record<string, any> {
  let mostRecentHumanMessage = null;
  for (let i = inputArray.length - 1; i >= 0; i--) {
    if (inputArray[i].role === 'user') {
      mostRecentHumanMessage = { content: inputArray[i].content };
      break;
    }
  }

  if (!mostRecentHumanMessage) {
    throw new Error('No human (user) type message found in the input array');
  }

  return mostRecentHumanMessage;
}

function isThreadMessageArray(obj: any): obj is ThreadMessage[] {
  return Array.isArray(obj) && obj.every(item => 
    typeof item === 'object' && 
    item !== null &&
    'id' in item && 
    'object' in item && 
    item.object === 'thread.message' &&
    'content' in item
  );
}

function splitIntoChunks(text: string, chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

function createTextStreamFromWhole(text: string) {
  const chunks = [text]; // The entire text as a single chunk
  let currentIndex = 0;

  return new ReadableStream({
    start(controller) {
      // Enqueue the entire text
      controller.enqueue(chunks[currentIndex++]);
    },
    pull(controller) {
      // Close the stream as there are no more chunks
      controller.close();
    },
    cancel() {
      console.log('Stream reading was cancelled.');
    }
  });
}

function createTextStream(text: string, chunkSize = 10) {
  const chunks = splitIntoChunks(text, chunkSize);
  let currentIndex = 0;

  return new ReadableStream({
    start(controller) {
      // This function is called when the stream is constructed.
      // You can enqueue the first chunk here if you want.
      controller.enqueue(chunks[currentIndex++]);
    },
    pull(controller) {
      // This function is called when the reader wants more data.
      if (currentIndex < chunks.length) {
        controller.enqueue(chunks[currentIndex++]);
      } else {
        controller.close(); // Close the stream when no more data.
      }
    },
    cancel() {
      // This function is called if the reader cancels reading the stream.
      console.log('Stream reading was cancelled.');
    }
  });
}



export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log(messages);

  const payload = adaptObjectsNoMemory(messages)
  console.log(payload);

  const { stream, handlers } = LangChainStream();

  // const assistant = await OpenAIAssistantRunnable.createAssistant({
  // model: "gpt-4-1106-preview",
  // });

  const assistant = new OpenAIAssistantRunnable({
  assistantId: "asst_AYy3fwtU1nkxma9sYJbtR9nc",
  // asAgent: true
});
  const assistantResponse = await assistant.invoke(payload);
  let content:any;
  // Handling different outcomes
  if (isThreadMessageArray(assistantResponse)) {
    // Handle ThreadMessage[]
    console.log("Handling ThreadMessage[]");
    console.log("---------------------------------------------");
    if (assistantResponse.length > 0) {
      const message = assistantResponse[0]; 
    
      console.log("Message ID:", message.id);
      console.log("Object: ", message.object);
      console.log("Thread_id:", message.thread_id);
      console.log("Role:", message.role);
      console.log("Content:", message.content);
      content = message.content[0]
      console.log("File IDs:", message.file_ids);
      console.log("Assistant ID:", message.assistant_id);
      console.log("Run ID:", message.run_id);
      console.log("Metadata:", message.metadata);
      console.log("*********************************************");
      // Additional processing here
    }
    
  }

// Example usage
const textStream = createTextStreamFromWhole(content.text.value);


  // const llm = new ChatOpenAI({
  //   streaming: true,
  // });

  // llm
  //   .call(
  //     (messages as Message[]).map(m =>
  //       m.role == 'user'
  //         ? new HumanMessage(m.content)
  //         : new AIMessage(m.content),
  //     ),
  //     {},
  //     [handlers],
  //   )
  //   .catch(console.error);

  return new StreamingTextResponse(textStream);
}
