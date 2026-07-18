"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  saveInduction,
  type EmployeeData,
  type SaveInductionResponse,
} from "../../lib/inductionApi";
import { TOTAL_QUIZ_QUESTIONS } from "../quiz/QuizEngine";

type Props = {
  language: string;
  score: number;
  employeeData: EmployeeData | null;
};

export default function CompletionScreen({
  language,
  score,
  employeeData,
}: Props) {

  const [
    savedInduction,
    setSavedInduction
  ] = useState<SaveInductionResponse | null>(null);

  const [
    saveError,
    setSaveError
  ] = useState("");

  const savePromiseRef = useRef<Promise<SaveInductionResponse> | null>(null);

  useEffect(() => {

    if (!employeeData) {

      return;

    }

    const employee = employeeData;

    let isCurrent = true;

    if (!savePromiseRef.current) {
      setSaveError("");
      savePromiseRef.current = saveInduction({
        language,
        employee,
        quizScore: score,
        totalQuestions: TOTAL_QUIZ_QUESTIONS,
      });
    }

    savePromiseRef.current
      .then((saved) => {
        if (isCurrent) {
          setSavedInduction(saved);
        }
      })
      .catch(() => {
        savePromiseRef.current = null;
        if (isCurrent) {
          setSaveError(
            "Completion saved on screen, but the backend is not reachable yet."
          );
        }
      });

    return () => {

      isCurrent = false;

    };

  }, [employeeData, language, score]);

  const completionTime = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(savedInduction ? new Date(savedInduction.completedAt) : new Date());

  return (

    <div
      className="
      w-full
      max-w-4xl
      glass-card
      rounded-3xl
      p-10
      shadow-2xl
      text-center
      text-white
      "
    >

      <div
        className="
        w-32
        h-32
        rounded-full
        bg-[#ffc000]
        flex
        items-center
        justify-center
        mx-auto
        mb-8
        "
      >

        <span
          className="
          text-6xl
          font-bold
          text-black
          "
        >
          ✓
        </span>

      </div>

      <Image
        src="/logo-header.png"
        alt="Eka Infra"
        width={260}
        height={104}
        className="
        w-60
        mx-auto
        mb-8
        "
      />

      <h1
        className="
        text-4xl
        font-bold
        text-[#ffc000]
        mb-8
        "
      >
        Induction Completed
      </h1>

      <div
        className="
        bg-black/30
        rounded-2xl
        p-6
        mb-8
        text-left
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          text-[#ffc000]
          mb-4
          "
        >
          Employee Details
        </h2>

        <p><strong>Full Name:</strong> {employeeData?.fullName}</p>

        <p><strong>Employee ID:</strong> {employeeData?.employeeId}</p>

        <p><strong>Designation:</strong> {employeeData?.designation}</p>

        <p><strong>Department:</strong> {employeeData?.department}</p>

        <p><strong>Date of Joining:</strong> {employeeData?.dateOfJoining}</p>

        <p><strong>Mobile Number:</strong> {employeeData?.phone}</p>

      </div>

      <div
        className="
        bg-black/30
        rounded-2xl
        p-6
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          text-[#ffc000]
          mb-4
          "
        >
          Assessment Result
        </h2>

        <p className="text-xl">
          Quiz Score: <strong>{score}/3</strong>
        </p>

      </div>

      <div
        className="
        bg-black
        border
        border-yellow-500/20
        rounded-2xl
        p-6
        "
      >

        <p className="text-gray-400 mb-2">
          Reference Number
        </p>

        <h2
          className="
          text-5xl
          font-bold
          text-[#ffc000]
          mb-4
          "
        >
          {savedInduction?.referenceNumber ?? "Saving..."}
        </h2>

        <p className="text-gray-300">
          Completed At: {completionTime}
        </p>

        {saveError && (
          <p className="text-sm text-red-300 mt-4">
            {saveError}
          </p>
        )}

      </div>

      <p className="text-sm text-gray-300 mt-8">
        Please save this reference number.
      </p>

    </div>

  );

}
