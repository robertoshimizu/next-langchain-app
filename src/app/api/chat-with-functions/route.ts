import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse, AIStream, type AIStreamCallbacksAndOptions, LangChainStream  } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import { LLMChain } from "langchain/chains";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `

User: {input}
AI:`;

/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    //console.log("Messages", messages);
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    //console.log("Previous messages", formattedPreviousMessages);
    const currentMessageContent = messages[messages.length - 1].content;
    //console.log("Current message", currentMessageContent);
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    //const prompt = currentMessageContent

    /**
     * You can also try e.g.:
     *
     * import { ChatAnthropic } from "langchain/chat_models/anthropic";
     * const model = new ChatAnthropic({});
     *
     * See a full list of supported models at:
     * https://js.langchain.com/docs/modules/model_io/models/
     */

    const handler = new ConsoleCallbackHandler();
    const llm = new ChatOpenAI({
      temperature: 0.0,
      modelName: "gpt-3.5-turbo-1106",
      verbose: false,
      tags: ["example", "callbacks", "constructor"],
      streaming: true,
    });

    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and byte-encoding.
     */
    const outputParser = new HttpResponseOutputParser();

    /**
     * Can also initialize as:
     *
     * import { RunnableSequence } from "langchain/schema/runnable";
     * const chain = RunnableSequence.from([prompt, model, outputParser]);
     */
    //const chain = prompt.pipe(model).pipe(outputParser);

    // handlers: {
    //     handleLLMNewToken: (token: string) => Promise<void>;
    //     handleLLMStart: (_llm: any, _prompts: string[], runId: string) => Promise<void>;
    //     handleLLMEnd: (_output: any, runId: string) => Promise<void>;
    //     handleLLMError: (e: Error, runId: string) => Promise<void>;
    //     handleChainStart: (_chain: any, _inputs: any, runId: string) => Promise<void>;
    //     handleChainEnd: (_outputs: any, runId: string) => Promise<void>;
    //     handleChainError: (e: Error, runId: string) => Promise<void>;
    //     handleToolStart: (_tool: any, _input: string, runId: string) => Promise<void>;
    //     handleToolEnd: (_output: string, runId: string) => Promise<void>;
    //     handleToolError: (e: Error, runId: string) => Promise<void>;
    // };

    const { stream, handlers } = LangChainStream();
    const chain = new LLMChain({ prompt, llm});

    const output = await chain.call(
          {
            input: currentMessageContent
          },
          {
            callbacks: [
              {
                handleLLMStart(llm, _prompts: string[]) {
                  console.log("handleLLMStart: ", { llm });
                },
                handleChainStart(chain) {
                  console.log("handleChainStart: ", { chain });
                },
                handleLLMNewToken(token: string) {
                  console.log({ token });
                },
                handleLLMEnd() {
                  console.log("Finished chain.");
                },
              },
            ],
          })

    
    /*
    Entering new llm_chain chain...
    Finished chain.
    */

    console.log('Output: ', output);


    // The non-enumerable key `__run` contains the runId.
    console.log('Output RunId: ', output.__run);

    // const response = await chain.stream({
    //   chat_history: formattedPreviousMessages.join("\n"),
    //   input: currentMessageContent,
    // });

    return new StreamingTextResponse(stream);
    
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}