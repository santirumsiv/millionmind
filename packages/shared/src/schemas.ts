import { z } from "zod";
import { ALGORITHM_IDS } from "./algorithms";
import { TIER_IDS } from "./tiers";

export const algorithmIdSchema = z.enum(ALGORITHM_IDS);
export const tierIdSchema = z.enum(TIER_IDS);

export const whiteBallSchema = z.number().int().min(1).max(69);
export const powerballSchema = z.number().int().min(1).max(26);

export const drawingInputSchema = z.object({
  draw_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  n1: whiteBallSchema,
  n2: whiteBallSchema,
  n3: whiteBallSchema,
  n4: whiteBallSchema,
  n5: whiteBallSchema,
  powerball: powerballSchema,
  multiplier: z.number().int().min(1).max(10).default(1),
});

export const generationRequestSchema = z.object({
  algorithm: algorithmIdSchema,
});

export const generationResultSchema = z.object({
  white_balls: z.tuple([
    whiteBallSchema,
    whiteBallSchema,
    whiteBallSchema,
    whiteBallSchema,
    whiteBallSchema,
  ]),
  powerball: powerballSchema,
  algorithm: algorithmIdSchema,
  generated_at: z.string(),
  remaining_this_week: z.union([z.number().nonnegative(), z.literal("unlimited")]),
  disclaimer: z.string(),
});

export type GenerationRequestInput = z.infer<typeof generationRequestSchema>;
export type GenerationResultOutput = z.infer<typeof generationResultSchema>;
