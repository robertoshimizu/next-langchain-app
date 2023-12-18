import { StreamingTextResponse, LangChainStream, Message } from 'ai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIMessage, HumanMessage } from 'langchain/schema';
import { OpenAIAssistantRunnable, ThreadMessage, RequiredActionFunctionToolCall, OpenAIAssistantFinish, OpenAIAssistantAction } from "langchain/experimental/openai_assistant";
import { AgentExecutor } from "langchain/agents";
import { StructuredTool } from "langchain/tools";


export const runtime = 'edge';
interface Text {
  value: string;
  annotations: any[];
}

interface Content {
  type: string;
  text: Text;
}

// interface Message {
//   id: string;
//   object: string;
//   created_at: number;
//   thread_id: string;
//   role: string;
//   content: Content[];
//   file_ids: any[];
//   assistant_id: string;
//   run_id: string;
//   metadata: Record<string, unknown>;
// }

// interface Thread {
//   messages: Message[];
// }



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

interface FunctionCall {
  name: string;
  arguments: string;  // Assuming arguments are passed as a JSON string
}


function isRequiredActionFunctionToolCallArray(obj: any): obj is RequiredActionFunctionToolCall[] {
  return Array.isArray(obj) && obj.every(item =>
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'type' in item && item.type === 'function' &&
    'function' in item && typeof item.function === 'object' &&
    'name' in item.function && typeof item.function.name === 'string' &&
    'arguments' in item.function && typeof item.function.arguments === 'string'
  );
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

function getCurrentWeather(location: string, _unit = "fahrenheit") {
  if (location.toLowerCase().includes("tokyo")) {
    return JSON.stringify({ location, temperature: "10", unit: "celsius" });
  } else if (location.toLowerCase().includes("san francisco")) {
    return JSON.stringify({ location, temperature: "72", unit: "fahrenheit" });
  } else {
    return JSON.stringify({ location, temperature: "22", unit: "celsius" });
  }
}

interface WeatherInput {
  location: string;
  unit: 'celsius' | 'fahrenheit';
}
import { z } from 'zod';
class WeatherTool extends StructuredTool {
  // Define the schema using Zod
  schema = z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    unit: z.enum(["celsius", "fahrenheit"]).optional(),
  });

  // Explicitly typing class properties
  name: string = "get_current_weather";
  description: string = "Get the current weather in a given location";

  // TypeScript constructor
  constructor() {
    super(); // If the parent class requires arguments, pass them accordingly
  }

  // Method with explicit parameter and return type
  async _call(input: WeatherInput): Promise<any> { // Replace 'any' with the actual return type
    const { location, unit } = input;
    const result = getCurrentWeather(location, unit); // Assuming getCurrentWeather is defined elsewhere
    return result;
  }
}



const tools = [new WeatherTool()];




export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log(messages);

  const payload = adaptObjectsNoMemory(messages)
  console.log(payload);

  const { stream, handlers } = LangChainStream();

  // const assistant = await OpenAIAssistantRunnable.createAssistant({
  // model: "gpt-4-1106-preview",
  // name: "WeatherAssistant",
  // instructions: "This is a weather assistant",
  // tools: tools,
  // });

  const assistant = new OpenAIAssistantRunnable({
  assistantId: "asst_MSDLTVhmmEuBtSrmrpDhfJrb",
  // asAgent: true
});
  const assistantResponse = await assistant.invoke(payload);
  console.log("Assistant response:", assistantResponse);



  
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
    // @ts-ignore
    const content:Content = message.content[0];
    console.log("File IDs:", message.file_ids);
    console.log("Assistant ID:", message.assistant_id);
    console.log("Run ID:", message.run_id);
    console.log("Metadata:", message.metadata);
    console.log("*********************************************");
    // Additional processing here

    const textStream = createTextStreamFromWhole(content.text.value);
    return new StreamingTextResponse(textStream);
  }
  
} else if (isRequiredActionFunctionToolCallArray(assistantResponse)) {
  // Handle RequiredActionFunctionToolCall[]
  console.log("Handling RequiredActionFunctionToolCall[]");
  if (assistantResponse.length > 0) {
    const call = assistantResponse[0];
    console.log("Call ID:", call.id);
    console.log("Function:", call.function.name);
    console.log("Arguments:", call.function.arguments);
    // Additional processing here
    const textStream = createTextStreamFromWhole("Required Function to be called: " + call.function.name);
    return new StreamingTextResponse(textStream);
  };

  
}

  
}
