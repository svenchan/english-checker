import { HTTP_STATUS } from "../../../../config/errors.js";
import { getHoldingClassIdFromEnv } from "../../../../config/appConfig.js";

export const ERROR_MESSAGES = {
  MISSING_TOKEN: "joinToken is required.",
  NOT_AUTHENTICATED: "Not authenticated. Please log in first.",
  NOT_STUDENT: "User is not a student.",
  CLASS_NOT_FOUND: "Class not found. The join link may be invalid or expired.",
  ALREADY_IN_CLASS: "Student is already enrolled in a class. Contact your teacher to change classes.",
  DB_ERROR: "Failed to join class. Please try again later."
};

function successResponse(classRecord) {
  return {
    status: HTTP_STATUS.OK,
    body: {
      success: true,
      classId: classRecord.id,
      className: classRecord.name
    }
  };
}

function errorResponse(status, message, logError) {
  return {
    status,
    body: { error: message },
    ...(logError ? { logError } : {})
  };
}

export async function handleJoinClass({
  supabaseClient,
  joinToken,
  accessToken,
  now = () => new Date().toISOString(),
  holdingClassId = getHoldingClassIdFromEnv()
}) {
  const sanitizedToken = typeof joinToken === "string" ? joinToken.trim() : "";

  if (!sanitizedToken) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.MISSING_TOKEN);
  }

  if (!accessToken) {
    return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.NOT_AUTHENTICATED);
  }

  const { data: userData, error: authError } = await supabaseClient.auth.getUser(accessToken);

  if (authError || !userData?.user) {
    return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.NOT_AUTHENTICATED, authError);
  }

  const authId = userData.user.id;

  const { data: studentRecord, error: studentError } = await supabaseClient
    .from("students")
    .select("id, class_id, school_id")
    .eq("user_id", authId)
    .maybeSingle();

  if (studentError) {
    return errorResponse(HTTP_STATUS.SERVER_ERROR, ERROR_MESSAGES.DB_ERROR, studentError);
  }

  if (!studentRecord) {
    return errorResponse(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.NOT_STUDENT);
  }

  const isInHoldingClass = holdingClassId && studentRecord.class_id === holdingClassId;

  if (studentRecord.class_id && !isInHoldingClass) {
    return errorResponse(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.ALREADY_IN_CLASS);
  }

  const { data: classRecord, error: classError } = await supabaseClient
    .from("classes")
    .select("id, name, school_id")
    .eq("join_token", sanitizedToken)
    .maybeSingle();

  if (classError) {
    return errorResponse(HTTP_STATUS.SERVER_ERROR, ERROR_MESSAGES.DB_ERROR, classError);
  }

  if (!classRecord) {
    return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.CLASS_NOT_FOUND);
  }

  const timestamp = typeof now === "function" ? now() : new Date().toISOString();

  const { error: updateError } = await supabaseClient
    .from("students")
    .update({ class_id: classRecord.id, school_id: classRecord.school_id, joined_at: timestamp })
    .eq("id", studentRecord.id);

  if (updateError) {
    return errorResponse(HTTP_STATUS.SERVER_ERROR, ERROR_MESSAGES.DB_ERROR, updateError);
  }

  return successResponse(classRecord);
}
