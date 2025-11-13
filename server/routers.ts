import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createImage, getUserImages, updateImageStatus } from "./db";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    sendMessage: protectedProcedure
      .input(z.object({ 
        message: z.string().min(1).max(2000),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string()
        })).optional()
      }))
      .mutation(async ({ input }) => {
        const messages = [
          {
            role: "system" as const,
            content: "You are AlShami AI, a highly capable general-purpose AI assistant. You can help with a wide range of tasks including:\n\n- Answering questions on any topic (business, technology, science, current events, etc.)\n- Providing latest data and insights on industries (oil, crypto, finance, etc.)\n- Creating business models and strategic plans\n- Analyzing trends and making recommendations\n- Helping with image generation prompts when needed\n\nYou have access to up-to-date information and can provide detailed, well-researched answers. Be professional, insightful, and helpful. When discussing data or trends, be specific with numbers and sources when possible. For business models or strategic advice, provide structured, actionable frameworks."
          },
          ...(input.conversationHistory || []).map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          })),
          {
            role: "user" as const,
            content: input.message
          }
        ];

        const response = await invokeLLM({ messages });
        const content = response.choices[0]?.message?.content;
        const assistantMessage = typeof content === 'string' ? content : "I'm sorry, I couldn't process that request.";

        return {
          message: assistantMessage
        };
      })
  }),

  images: router({
    enhancePrompt: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an expert at creating detailed, vivid image generation prompts. Enhance the user's prompt by adding artistic details, lighting, composition, style, and atmosphere. Keep it concise but descriptive. Return only the enhanced prompt, nothing else."
              },
              {
                role: "user",
                content: `Enhance this image prompt: "${input.prompt}"`
              }
            ]
          });

          const content = response.choices[0]?.message?.content;
          const enhancedPrompt = typeof content === 'string' ? content.trim() : input.prompt;
          return { enhancedPrompt };
        } catch (error) {
          console.error("Error enhancing prompt:", error);
          throw new Error("Failed to enhance prompt");
        }
      }),

    generate: protectedProcedure
      .input(z.object({ prompt: z.string().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Create database record
          const result = await createImage({
            userId: ctx.user.id,
            prompt: input.prompt,
            imageUrl: "",
            fileKey: "",
            status: "generating",
          });

          const imageId = Number(result[0].insertId);

          try {
            // Generate image using built-in helper
            const { url: imageUrl } = await generateImage({
              prompt: input.prompt,
            });

            // Update database with the generated image URL
            await updateImageStatus(
              imageId,
              "completed",
              imageUrl,
              imageUrl // Using URL as fileKey for simplicity
            );

            return {
              imageId,
              imageUrl,
              status: "completed",
            };
          } catch (error) {
            // Update database with error status
            await updateImageStatus(
              imageId,
              "failed",
              undefined,
              undefined,
              error instanceof Error ? error.message : "Failed to generate image"
            );
            throw error;
          }
        } catch (error) {
          console.error("Image generation error:", error);
          throw new Error(error instanceof Error ? error.message : "Failed to generate image");
        }
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await getUserImages(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const images = await getUserImages(ctx.user.id);
        const image = images.find(img => img.id === input.id);
        if (!image) {
          throw new Error("Image not found");
        }
        return image;
      }),

    transformImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        prompt: z.string(),
        style: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Construct the transformation prompt
          let fullPrompt = input.prompt;
          if (input.style) {
            fullPrompt = `Transform this image into ${input.style} style. ${input.prompt}`;
          }

          // Create database record
          const result = await createImage({
            userId: ctx.user.id,
            prompt: fullPrompt,
            imageUrl: "",
            fileKey: "",
            status: "generating",
          });

          const imageId = Number(result[0].insertId);

          try {
            // Use the built-in generateImage helper with originalImages parameter
            const { url: imageUrl } = await generateImage({
              prompt: fullPrompt,
              originalImages: [{
                url: input.imageUrl,
                mimeType: "image/jpeg"
              }]
            });

            // Update database with the generated image URL
            await updateImageStatus(
              imageId,
              "completed",
              imageUrl,
              imageUrl
            );

            return {
              imageId,
              imageUrl,
              prompt: fullPrompt,
              status: "completed",
            };
          } catch (error) {
            // Update database with error status
            await updateImageStatus(
              imageId,
              "failed",
              undefined,
              undefined,
              error instanceof Error ? error.message : "Failed to transform image"
            );
            throw error;
          }
        } catch (error) {
          console.error("Image transformation error:", error);
          throw new Error(error instanceof Error ? error.message : "Failed to transform image");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
