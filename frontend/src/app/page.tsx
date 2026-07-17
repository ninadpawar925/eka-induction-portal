"use client";

import { useState } from "react";

import LanguageSelection from "../components/language/LanguageSelection";
import EmployeeForm from "../components/forms/EmployeeForm";
import VideoInduction from "../components/video/VideoInduction";
import QuizEngine from "../components/quiz/QuizEngine";
import CompletionScreen from "../components/completion/CompletionScreen";
import type { EmployeeData } from "../lib/inductionApi";

export default function Home() {

  const [language, setLanguage] = useState("");

  const [currentStep, setCurrentStep] =
    useState("language");

  const [quizScore, setQuizScore] =
    useState(0);

  const [employeeData, setEmployeeData] =
    useState<EmployeeData | null>(null);

  return (

    <main
      className="
      min-h-screen
      flex
      items-center
      justify-center
      px-4
      py-10
      "
    >

      {

        currentStep === "language"

        &&

        <LanguageSelection
          onSelect={(lang) => {

            setLanguage(lang);

            setCurrentStep("form");

          }}
        />

      }

      {

        currentStep === "form"

        &&

        <EmployeeForm
          language={language}
          onContinue={(data) => {

            console.log(
              "Employee Saved:",
              data
            );

            setEmployeeData(data);

            setCurrentStep("video");

          }}
        />

      }

      {

        currentStep === "video"

        &&

        <VideoInduction
          onVideoComplete={() => {

            setCurrentStep("quiz");

          }}
        />

      }

      {

        currentStep === "quiz"

        &&

        <QuizEngine
          onQuizComplete={(score) => {

            setQuizScore(score);

            setCurrentStep("complete");

          }}
        />

      }

      {

        currentStep === "complete"

        &&

        <CompletionScreen
          language={language}
          score={quizScore}
          employeeData={employeeData}
        />

      }

    </main>

  );

}
