import { MAX_CIPHERTEXT_LENGTH } from "../engine/bombe.ts";

// Allow room for spaces and punctuation before normalization.
export const RAW_MESSAGE_INPUT_LIMIT = MAX_CIPHERTEXT_LENGTH * 2;
