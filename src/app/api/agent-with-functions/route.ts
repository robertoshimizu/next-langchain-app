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

    // const iterableStream = await agentExecutor.stream({
    //   input: "what is LangChain?",
    // });

    // for await (const chunk of iterableStream) {
    //   console.log(JSON.stringify(chunk, null, 2));
    //   console.log("------");
    // }

    const logStream = await agentExecutor.streamLog({
      input: "what is the weather in SF",
    });

    for await (const chunk of logStream) {
      console.log(JSON.stringify(chunk, null, 2));
    }

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
    //return new StreamingTextResponse(stream);
    return NextResponse.json({ value: 'sucess' }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}