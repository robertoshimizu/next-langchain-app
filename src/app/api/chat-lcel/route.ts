import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { Run } from "@langchain/core/tracers/base";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `

Current conversation:
{chat_history}

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
    const model = new ChatOpenAI({
      temperature: 0.0,
      modelName: "gpt-3.5-turbo-1106",
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
    const chain = prompt.pipe(model).pipe(outputParser);

    const trackTime = () => {
        let start: { startTime: number; question: string };
        let end: { endTime: number; answer: string };

        const handleStart = (run: Run) => {
          
          start = {
            startTime: run.start_time,
            question: run.inputs.input,
          };
        };

        const handleEnd = (run: Run) => {
          console.log('output', run.child_runs[run.child_runs.length - 1].inputs.content)
          if (run.end_time && run.outputs) {
            end = {
              endTime: run.end_time,
              answer: run.outputs.content,
            };
          }

          // console.log("start", start);
          // console.log("end", end);
          // console.log(`total time: ${end.endTime - start.startTime}ms`);
        };

        return { handleStart, handleEnd };
      };

    const { handleStart, handleEnd } = trackTime();

    const stream = await chain
    .withListeners({
        onStart: (run: Run) => {
          handleStart(run);
        },
        onEnd: (run: Run) => {
          handleEnd(run);
        },
      })
    .stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}