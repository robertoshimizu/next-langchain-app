import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { ChatOpenAI } from "@langchain/openai";
import type { ChatPromptTemplate } from "@langchain/core/prompts";


import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { Run } from "@langchain/core/tracers/base";
import { IterableReadableStream } from "@langchain/core/dist/utils/stream";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};


function chunkify(content: string | any[], chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}

function createSimulatedOutputStream(iterableStream: any, chunkSize = 1024, delay = 100) {
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of iterableStream) {
        // Assuming each `chunk` has an `output` property that is a string
        if (chunk.output) {
          const outputChunks = chunkify(chunk.output, chunkSize);
          for (const outputChunk of outputChunks) {
            await new Promise(resolve => setTimeout(resolve, delay));
            controller.enqueue(outputChunk);
          }
        }
      }
      controller.close();
    },
  });
}

function iterableReadableStreamToReadableStream(iterableReadableStream:IterableReadableStream<any>) {
    return new ReadableStream<any>({
        async pull(controller) {
            for await (const chunk of iterableReadableStream) {
                controller.enqueue(chunk);
                // Check if the consumer is still ready for more chunks
                // @ts-ignore
                if (controller.desiredSize <= 0) {
                    break;
                }
            }
            controller.close();
        }
    });
}


function createOutputOnlyStream(iterableStream:any) {
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of iterableStream) {
        // Assuming `chunk` is an object and has an `output` property
        if (chunk.output) {
          // Convert the output to a Uint8Array (binary form) or keep as string
          // Here, we're keeping it simple by assuming the output is a string
          // and we're directly enqueueing it. In a real scenario, you might
          // want to convert it to a binary format if needed.
          controller.enqueue(chunk.output);
        }
      }
      // Close the stream once all chunks have been processed
      controller.close();
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    //console.log("Messages", messages);
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    //console.log("Previous messages", formattedPreviousMessages);
    const currentMessageContent = messages[messages.length - 1].content;
    //console.log("Current message", currentMessageContent);
    
    // Get the prompt to use - you can modify this!
    // If you want to see the prompt in full, you can at:
    // https://smith.langchain.com/hub/hwchase17/openai-functions-agent
    const prompt = await pull<ChatPromptTemplate>(
      "hwchase17/openai-functions-agent"
    );

    // Define the tools the agent will have access to.
    const tools = [new TavilySearchResults({ maxResults: 1 })];

    const llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo-1106",
      temperature: 0,
    });

    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });

    const iterableStream = await agentExecutor.stream({
      input: currentMessageContent,
    });

    //const outputOnlyStream = createOutputOnlyStream(iterableStream);
    const outputOnlyStream = createSimulatedOutputStream(iterableStream, 1024, 500);

    // const logStream = await agentExecutor.streamLog({
    //   input: "what is the weather in SF",
    // });

    // for await (const chunk of logStream) {
    //   console.log(JSON.stringify(chunk, null, 2));
    // }

    // for await (const chunk of logStream) {
    //   if (chunk.ops?.length > 0 && chunk.ops[0].op === "add") {
    //     const addOp = chunk.ops[0];
    //     if (
    //       addOp.path.startsWith("/logs/ChatOpenAI") &&
    //       typeof addOp.value === "string" &&
    //       addOp.value.length
    //     ) {
    //       console.log(addOp.value);
    //     }
    //   }
    // }
    return new StreamingTextResponse(outputOnlyStream);
    //return NextResponse.json({ value: 'sucess' }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}