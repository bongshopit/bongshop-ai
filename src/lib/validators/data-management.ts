import { z } from "zod";

export const CONFIRM_DELETE_PHRASE = "XÓA TẤT CẢ";

export const deleteAllDataSchema = z.object({
  confirmPhrase: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val === CONFIRM_DELETE_PHRASE, {
      message: `Vui lòng nhập chính xác "${CONFIRM_DELETE_PHRASE}" để xác nhận`,
    }),
});
