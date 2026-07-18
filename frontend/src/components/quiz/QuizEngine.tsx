"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  onQuizComplete: (score: number) => void;
};

const questions = [

  {
    question: "What should be worn inside industrial site?",
    options: [
      "Helmet & PPE",
      "Slippers",
      "Casual Wear",
      "None"
    ],
    answer: "Helmet & PPE"
  },

  {
    question: "Can safety instructions be ignored?",
    options: [
      "Yes",
      "Sometimes",
      "No",
      "Only by supervisors"
    ],
    answer: "No"
  },

  {
    question: "What should you do if hazard is identified?",
    options: [
      "Ignore",
      "Report immediately",
      "Continue working",
      "Take photo only"
    ],
    answer: "Report immediately"
  }

];

export const TOTAL_QUIZ_QUESTIONS = questions.length;

export default function QuizEngine({
  onQuizComplete
}: Props) {

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [score, setScore] = useState(0);

  const [selected, setSelected] = useState("");

  const [hasAnswered, setHasAnswered] = useState(false);

  const question = questions[currentQuestion];

  const handleNext = () => {

    let updatedScore = score;

    if (selected === question.answer) {
      updatedScore++;
      setScore(updatedScore);
    }

    if (currentQuestion < questions.length - 1) {

      setCurrentQuestion(currentQuestion + 1);

      setSelected("");

      setHasAnswered(false);

    } else {

      onQuizComplete(updatedScore);

    }

  };

  return (
    <div className="w-full max-w-4xl glass-card rounded-3xl border border-yellow-500/20 p-8 shadow-2xl">

      <div className="flex justify-center mb-8">
        <Image
          src="/logo-header.png"
          alt="Eka Infra"
          width={240}
          height={96}
          className="w-56 object-contain"
        />
      </div>

      <h1 className="text-4xl font-bold text-center text-[#ffc000] mb-10">
        Safety Assessment Quiz
      </h1>

      <div className="text-2xl font-semibold mb-8 text-white">
        Q{currentQuestion + 1}. {question.question}
      </div>

      <div className="space-y-4">

        {
          question.options.map((option, index) => (

            <button
              key={index}
              onClick={() => {
                if (!hasAnswered) {
                  setSelected(option);
                  setHasAnswered(true);
                }
              }}
              disabled={hasAnswered}
              className={`w-full text-left p-5 rounded-2xl border transition-all ${
                hasAnswered && option === question.answer
                  ? "bg-green-600 text-white border-green-400"
                  : hasAnswered && selected === option
                    ? "bg-red-600 text-white border-red-400"
                    : selected === option
                  ? "bg-[#ffc000] text-black border-[#ffc000]"
                  : "bg-[#1a1a1a] border-gray-700 text-white"
              } ${hasAnswered ? "cursor-default" : "hover:border-[#ffc000]"}`}
            >

              {option}

            </button>

          ))
        }

      </div>

      {hasAnswered && selected !== question.answer && (
        <p className="mt-5 text-center font-semibold text-green-300">
          Correct answer: {question.answer}
        </p>
      )}

      <button
        onClick={handleNext}
        disabled={!selected}
        className={`w-full mt-8 h-14 rounded-xl text-lg font-bold transition-all ${
          selected
            ? "bg-[#ffc000] text-black"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}
      >

        {
          currentQuestion === questions.length - 1
            ? "Submit Quiz"
            : "Next Question"
        }

      </button>

    </div>
  );
}
