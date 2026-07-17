"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";

import type { EmployeeData } from "../../lib/inductionApi";

type FormData = EmployeeData;

type Props = {
  language: string;
  onContinue: (data: FormData) => void;
};

export default function EmployeeForm({
  language,
  onContinue,
}: Props) {

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {

    console.log("Employee Details:", data);

    onContinue(data);

  };

  return (
    <div
      className="
      w-full
      max-w-3xl
      glass-card
      rounded-3xl
      shadow-2xl
      p-8
      md:p-12
      "
    >

      <div className="flex justify-center mb-8">
        <Image
          src="/logo-header.png"
          alt="Eka Infra"
          width={260}
          height={104}
          className="w-60 object-contain"
        />
      </div>

      <h1
        className="
        text-4xl
        font-bold
        text-center
        text-[#ffc000]
        mb-10
        "
      >
        {language === "Hindi"
          ? "कर्मचारी विवरण"
          : "Employee Details"}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >

        <input
          type="text"
          placeholder={
            language === "Hindi"
              ? "पूरा नाम"
              : "Full Name"
          }
          {...register("fullName", {
            required: true,
          })}
          className="
          w-full
          h-14
          rounded-xl
          bg-white
          px-5
          text-black
          text-lg
          outline-none
          "
        />

        <input
          type="text"
          placeholder={
            language === "Hindi"
              ? "कर्मचारी आईडी"
              : "Employee ID"
          }
          {...register("employeeId", {
            required: true,
          })}
          className="
          w-full
          h-14
          rounded-xl
          bg-white
          px-5
          text-black
          text-lg
          outline-none
          "
        />

        <input
          type="text"
          placeholder={
            language === "Hindi"
              ? "पदनाम"
              : "Designation"
          }
          {...register("designation", {
            required: true,
          })}
          className="
          w-full
          h-14
          rounded-xl
          bg-white
          px-5
          text-black
          text-lg
          outline-none
          "
        />

        <input
          type="text"
          placeholder={
            language === "Hindi"
              ? "विभाग"
              : "Department"
          }
          {...register("department", {
            required: true,
          })}
          className="
          w-full
          h-14
          rounded-xl
          bg-white
          px-5
          text-black
          text-lg
          outline-none
          "
        />

        <div>

          <label className="block mb-2 text-white">
            {language === "Hindi"
              ? "जॉइनिंग तिथि"
              : "Date of Joining"}
          </label>

          <input
            type="date"
            {...register("dateOfJoining", {
              required: true,
            })}
            className="
            w-full
            h-14
            rounded-xl
            bg-white
            px-5
            text-black
            text-lg
            outline-none
            "
          />

        </div>

        <div>

          <input
            type="text"
            placeholder={
              language === "Hindi"
                ? "मोबाइल नंबर"
                : "Mobile Number"
            }
            {...register("phone", {
              required: true,
              pattern: /^[0-9]{10}$/,
            })}
            className="
            w-full
            h-14
            rounded-xl
            bg-white
            px-5
            text-black
            text-lg
            outline-none
            "
          />

          {errors.phone && (
            <p className="text-red-500 mt-2">
              10 digit mobile number only
            </p>
          )}

        </div>

        <button
          type="submit"
          className="
          w-full
          h-14
          rounded-xl
          bg-[#ffc000]
          text-black
          text-lg
          font-bold
          "
        >
          Continue To Induction
        </button>

      </form>

    </div>
  );
}
