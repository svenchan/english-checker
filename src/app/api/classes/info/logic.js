import { HTTP_STATUS } from "../../../../config/errors.js";

const NOT_FOUND_MESSAGE = "Class not found. The join link may be invalid or expired.";
const MISSING_TOKEN_MESSAGE = "joinToken query parameter is required.";
const DB_ERROR_MESSAGE = "Failed to fetch class info.";

export const ERROR_MESSAGES = {
  NOT_FOUND: NOT_FOUND_MESSAGE,
  MISSING_TOKEN: MISSING_TOKEN_MESSAGE,
  DB_ERROR: DB_ERROR_MESSAGE
};

export async function getClassInfoResponse(joinToken, supabaseClient) {
  if (!joinToken) {
    return {
      status: HTTP_STATUS.BAD_REQUEST,
      body: { error: MISSING_TOKEN_MESSAGE }
    };
  }

  try {
    const { data, error } = await supabaseClient
      .from("classes")
      .select("id, name")
      .eq("join_token", joinToken)
      .maybeSingle();

    if (error) {
      return {
        status: HTTP_STATUS.SERVER_ERROR,
        body: { error: DB_ERROR_MESSAGE },
        logError: error
      };
    }

    if (!data) {
      return {
        status: HTTP_STATUS.NOT_FOUND,
        body: { error: NOT_FOUND_MESSAGE }
      };
    }

    return {
      status: HTTP_STATUS.OK,
      body: { classId: data.id, className: data.name }
    };
  } catch (error) {
    return {
      status: HTTP_STATUS.SERVER_ERROR,
      body: { error: DB_ERROR_MESSAGE },
      logError: error
    };
  }
}
