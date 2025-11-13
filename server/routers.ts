import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createImage, getUserImages, updateImageStatus } from "./db";
import { generateImage } from "./_core/imageGeneration";

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

  images: router({
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
  }),
});

export type AppRouter = typeof appRouter;
