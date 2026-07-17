"use client";

import Image from "next/image";

type Props = {

  onSelect:(lang:string)=>void;

};

export default function LanguageSelection({

  onSelect

}:Props){

  return(

    <div
      className="
      w-full
      max-w-4xl
      glass-card
      rounded-3xl
      p-10
      border
      border-yellow-500/20
      shadow-2xl
      "
    >

      {/* LOGO */}

      <div className="flex justify-center mb-8">

        <Image
          src="/logo-header.png"
          alt="Eka Infra"
          width={240}
          height={96}
          className="w-56 object-contain"
        />

      </div>

      {/* TITLE */}

      <h1
        className="
        text-5xl
        font-bold
        text-center
        text-[#ffc000]
        mb-12
        "
      >

        Select Language

      </h1>

      {/* BUTTONS */}

      <div
        className="
        flex
        justify-center
        gap-6
        "
      >

        <button
          type="button"
          onClick={()=>{

            console.log("English Selected");

            onSelect("English");

          }}
          className="
          bg-[#ffc000]
          text-black
          px-10
          py-5
          rounded-2xl
          text-2xl
          font-bold
          hover:bg-yellow-400
          transition-all
          "
        >

          English

        </button>

        <button
          type="button"
          onClick={()=>{

            console.log("Hindi Selected");

            onSelect("Hindi");

          }}
          className="
          bg-[#ffc000]
          text-black
          px-10
          py-5
          rounded-2xl
          text-2xl
          font-bold
          hover:bg-yellow-400
          transition-all
          "
        >

          हिंदी

        </button>

      </div>

    </div>

  );

}
