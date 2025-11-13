import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createImage, getUserImages, updateImageStatus, getDb } from "./db";
import { images } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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

  imageGeneration: router({
    generate: protectedProcedure
      .input(z.object({ prompt: z.string().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Create initial database record
          const result = await createImage({
            userId: ctx.user.id,
            prompt: input.prompt,
            imageUrl: "",
            fileKey: "",
            status: "generating",
          });

          const imageId = Number(result[0].insertId);

          // Call Manus API to create image generation task
          const response = await fetch("https://api.manus.ai/v1/tasks", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "content-type": "application/json",
              "API_KEY": process.env.MANUS_API_KEY || "",
            },
            body: JSON.stringify({
              prompt: `Generate an image: ${input.prompt}`,
              mode: "speed",
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            await updateImageStatus(imageId, "failed", undefined, undefined, `API Error: ${errorText}`);
            throw new Error(`Manus API error: ${response.status} ${errorText}`);
          }

          const taskData = await response.json();

          // Return the task info and image ID for polling
          return {
            imageId,
            taskId: taskData.id,
            status: "generating",
          };
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
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db.select().from(images).where(eq(images.id, input.id)).limit(1);
        if (result.length === 0 || result[0].userId !== ctx.user.id) {
          throw new Error("Image not found");
        }
        return result[0];
      }),

    pollTask: protectedProcedure
      .input(z.object({ taskId: z.string(), imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Poll the Manus API for task status
          const response = await fetch(`https://api.manus.ai/v1/tasks/${input.taskId}`, {
            method: "GET",
            headers: {
              "accept": "application/json",
              "API_KEY": process.env.MANUS_API_KEY || "",
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to poll task: ${response.status}`);
          }

          const taskData = await response.json();
          
          // Check if task is completed and has attachments
          if (taskData.status === "completed" && taskData.attachments && taskData.attachments.length > 0) {
            // Find the first image attachment
            const imageAttachment = taskData.attachments.find((att: any) => 
              att.type === "image" || att.mimeType?.startsWith("image/")
            );
            
            if (imageAttachment && imageAttachment.url) {
              await updateImageStatus(
                input.imageId,
                "completed",
                imageAttachment.url,
                imageAttachment.url,
                undefined
              );
              return { status: "completed", imageUrl: imageAttachment.url };
            }
          } else if (taskData.status === "failed") {
            await updateImageStatus(
              input.imageId,
              "failed",
              undefined,
              undefined,
              taskData.error || "Task failed"
            );
            return { status: "failed", error: taskData.error };
          }

          return { status: taskData.status || "generating" };
        } catch (error) {
          console.error("Task polling error:", error);
          throw new Error(error instanceof Error ? error.message : "Failed to poll task");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
