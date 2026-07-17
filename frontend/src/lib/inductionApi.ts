import axios from "axios";

export type EmployeeData = {
  fullName: string;
  employeeId: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  phone: string;
};

export type SaveInductionPayload = {
  language: string;
  employee: EmployeeData;
  quizScore: number;
  totalQuestions: number;
};

export type SaveInductionResponse = {
  id: string;
  referenceNumber: string;
  completedAt: string;
};

function getDefaultApiBaseUrl() {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    window.location.port === "3000"
  ) {
    return "http://localhost:5000/api";
  }

  return "/api";
}

const resolvedApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? getDefaultApiBaseUrl();

const api = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 10000,
});

export const apiBaseUrl = resolvedApiBaseUrl;

export async function saveInduction(
  payload: SaveInductionPayload
): Promise<SaveInductionResponse> {
  const response = await api.post<SaveInductionResponse>(
    "/inductions",
    payload
  );

  return response.data;
}

export function getCertificateUrl(referenceNumber: string) {
  return `${apiBaseUrl}/inductions/${referenceNumber}/certificate`;
}

export async function downloadCertificatePdf(referenceNumber: string) {
  const response = await api.get<Blob>(
    `/inductions/${referenceNumber}/certificate`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}
