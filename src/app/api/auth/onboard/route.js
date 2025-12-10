import { NextResponse } from "next/server";
import { createServerClient } from "@/config/supabase";
import { HTTP_STATUS } from "@/config/errors";
import { isNameValid, normalizeNameInput } from "@/lib/nameValidation";

const VALID_ROLES = new Set(["student", "teacher"]);

function jsonError(message, status, meta) {
  const payload = { message, status };
  if (meta) payload.details = meta;
  const logger = status >= 500 ? console.error : console.warn;
  logger("Onboard API error:", payload);
  return NextResponse.json({ error: message }, { status });
}

function extractBearerToken(req) {
  const header = req.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.*)$/i);
  return match ? match[1]?.trim() : null;
}

async function getProfileForAuthId(supabase, authId) {
  if (!authId) {
    return {
      onboarded: false,
      authId: null,
      userId: null,
      role: null,
      studentId: null,
      teacherId: null,
      classId: null,
      schoolId: null,
      firstName: "",
      lastName: "",
      email: ""
    };
  }

  const { data: userRecord, error: userError } = await supabase
    .from("users")
    .select("id, role, first_name, last_name, email")
    .eq("auth_id", authId)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (!userRecord) {
    return {
      onboarded: false,
      authId,
      userId: null,
      role: null,
      studentId: null,
      teacherId: null,
      classId: null,
      schoolId: null,
      firstName: "",
      lastName: "",
      email: ""
    };
  }

  const studentRecord = await fetchStudentRecord(supabase, userRecord.id, authId);
  const teacherRecord = await fetchTeacherRecord(supabase, userRecord.id, authId);

  const hasStudent = Boolean(studentRecord?.id);
  const hasTeacher = Boolean(teacherRecord?.id);

  return {
    onboarded: hasStudent || hasTeacher,
    authId,
    userId: userRecord.id,
    role: userRecord.role,
    studentId: studentRecord?.id ?? null,
    teacherId: teacherRecord?.id ?? null,
    classId: studentRecord?.class_id ?? null,
    schoolId: studentRecord?.school_id ?? teacherRecord?.school_id ?? null,
    firstName: userRecord.first_name || "",
    lastName: userRecord.last_name || "",
    email: userRecord.email || ""
  };
}

async function fetchStudentRecord(supabase, primaryUserId, fallbackId) {
  return fetchRecordWithColumns(supabase, "students", ["id", "class_id", "school_id", "user_id"], primaryUserId, fallbackId);
}

async function fetchTeacherRecord(supabase, primaryUserId, fallbackId) {
  return fetchRecordWithColumns(supabase, "teachers", ["id", "school_id", "user_id"], primaryUserId, fallbackId);
}

async function fetchRecordWithColumns(supabase, table, columns, primaryUserId, fallbackId) {
  if (!primaryUserId && !fallbackId) {
    return null;
  }

  const idsToTry = [primaryUserId, fallbackId].filter(Boolean);
  for (const id of idsToTry) {
    const { data, error } = await supabase
      .from(table)
      .select(columns.join(", "))
      .eq("user_id", id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (data) {
      return data;
    }
  }

  return null;
}

async function getAuthenticatedUser(req, supabase) {
  const accessToken = extractBearerToken(req);

  if (!accessToken) {
    return { error: jsonError("Not authenticated. Please log in first.", HTTP_STATUS.UNAUTHORIZED) };
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !userData?.user) {
    return {
      error: jsonError(
        "Not authenticated. Please log in first.",
        HTTP_STATUS.UNAUTHORIZED,
        authError || "No user found"
      )
    };
  }

  return { accessToken, authUser: userData.user };
}

export async function GET(req) {
  try {
    const supabase = createServerClient();
    const { error, authUser } = await getAuthenticatedUser(req, supabase);

    if (error) {
      return error;
    }

    const profile = await getProfileForAuthId(supabase, authUser.id);

    return NextResponse.json({
      success: true,
      profile,
      needsOnboarding: !profile.onboarded
    });
  } catch (err) {
    console.error("Failed to load onboarding profile:", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", details: err.message },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : "";
    const firstNameRaw = body.firstName;
    const lastNameRaw = body.lastName;
    const schoolCodeRaw = typeof body.schoolCode === "string" ? body.schoolCode.trim() : "";

    if (!email) {
      return jsonError("Email is required.", HTTP_STATUS.BAD_REQUEST);
    }

    if (!role || !VALID_ROLES.has(role)) {
      return jsonError("Role must be either 'student' or 'teacher'.", HTTP_STATUS.BAD_REQUEST);
    }

    const firstName = normalizeNameInput(firstNameRaw);
    const lastName = normalizeNameInput(lastNameRaw);

    if (!firstName) {
      return jsonError("firstName is required and cannot be empty.", HTTP_STATUS.BAD_REQUEST);
    }

    if (!lastName) {
      return jsonError("lastName is required and cannot be empty.", HTTP_STATUS.BAD_REQUEST);
    }

    if (!isNameValid(firstNameRaw)) {
      return jsonError(
        "firstName may only contain letters, spaces, hyphens, or apostrophes and must be 1-50 characters.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (!isNameValid(lastNameRaw)) {
      return jsonError(
        "lastName may only contain letters, spaces, hyphens, or apostrophes and must be 1-50 characters.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const expectedSchoolCode = process.env.NEXT_PUBLIC_SCHOOL_CODE?.trim();
    const schoolCode = schoolCodeRaw.toUpperCase();

    if (role === "teacher") {
      if (!schoolCode) {
        return jsonError("schoolCode is required for teachers.", HTTP_STATUS.BAD_REQUEST);
      }

      if (!expectedSchoolCode) {
        return jsonError("School code is not configured.", HTTP_STATUS.SERVER_ERROR);
      }

      if (schoolCode !== expectedSchoolCode.toUpperCase()) {
        return jsonError("Invalid school code", HTTP_STATUS.FORBIDDEN);
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonError("Supabase is not configured.", HTTP_STATUS.SERVER_ERROR);
    }

    const supabase = createServerClient();
    const { error, authUser } = await getAuthenticatedUser(req, supabase);

    if (error) {
      return error;
    }

    const authId = authUser.id;
    const schoolId = process.env.NEXT_PUBLIC_SCHOOL_ID;

    if (!schoolId) {
      return jsonError("School ID is not configured.", HTTP_STATUS.SERVER_ERROR);
    }

    const existingProfile = await getProfileForAuthId(supabase, authId);

    if (existingProfile.onboarded) {
      return NextResponse.json({
        success: true,
        alreadyOnboarded: true,
        message: "User already onboarded.",
        profile: existingProfile,
        needsOnboarding: false
      });
    }

    const { data: newUser, error: insertUserError } = await supabase
      .from("users")
      .insert({
        auth_id: authId,
        email,
        role,
        first_name: firstName,
        last_name: lastName
      })
      .select("id")
      .single();

    if (insertUserError || !newUser?.id) {
      return jsonError("Failed to create user.", HTTP_STATUS.SERVER_ERROR, insertUserError);
    }

    const userId = newUser.id;
    let studentId = null;
    let teacherId = null;

    if (role === "student") {
      const { data: studentRow, error: studentInsertError } = await supabase
        .from("students")
        .insert({
          user_id: userId,
          class_id: null,
          school_id: schoolId,
          student_number: null
        })
        .select("id, school_id, class_id")
        .single();

      if (studentInsertError) {
        const { error: cleanupError } = await supabase.from("users").delete().eq("id", userId);
        if (cleanupError) {
          console.error("Failed to roll back user after student insert error:", cleanupError);
        }
        return jsonError("Failed to create student record.", HTTP_STATUS.SERVER_ERROR, studentInsertError);
      }

      studentId = studentRow?.id ?? null;
    } else {
      const { data: teacherRow, error: teacherInsertError } = await supabase
        .from("teachers")
        .insert({
          user_id: userId,
          school_id: schoolId
        })
        .select("id, school_id")
        .single();

      if (teacherInsertError) {
        const { error: cleanupError } = await supabase.from("users").delete().eq("id", userId);
        if (cleanupError) {
          console.error("Failed to roll back user after teacher insert error:", cleanupError);
        }
        return jsonError("Failed to create teacher record.", HTTP_STATUS.SERVER_ERROR, teacherInsertError);
      }

      teacherId = teacherRow?.id ?? null;
    }

    const profile = await getProfileForAuthId(supabase, authId);

    return NextResponse.json({
      success: true,
      role,
      userId,
      studentId,
      teacherId,
      profile,
      needsOnboarding: !profile.onboarded,
      message: "Onboarding completed successfully."
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", details: error.message },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
}
