"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {

  onVideoComplete:()=>void;

};

export default function VideoInduction({

  onVideoComplete

}:Props){

  const videoRef = useRef<HTMLVideoElement>(null);
  const maxWatchedTimeRef = useRef(0);

  const [

    completed,
    setCompleted

  ] = useState(false);

  useEffect(()=>{

    const video = videoRef.current;

    if(!video) return;

    video.controls = false;

    const updateWatchedTime = ()=>{

      if(!video.seeking){

        maxWatchedTimeRef.current = Math.max(
          maxWatchedTimeRef.current,
          video.currentTime
        );

      }

    };

    const preventForward = ()=>{

      if(video.currentTime > maxWatchedTimeRef.current + 1){

        video.currentTime = maxWatchedTimeRef.current;

      }

    };

    const preventMute = ()=>{

      video.muted = false;

      if(video.volume === 0){

        video.volume = 1;

      }

    };

    video.addEventListener(
      "timeupdate",
      updateWatchedTime
    );

    video.addEventListener(
      "seeking",
      preventForward
    );

    video.addEventListener(
      "volumechange",
      preventMute
    );

    return ()=>{

      video.removeEventListener(
        "timeupdate",
        updateWatchedTime
      );

      video.removeEventListener(
        "seeking",
        preventForward
      );

      video.removeEventListener(
        "volumechange",
        preventMute
      );

    };

  },[]);

  return(

    <div
      className="
      w-full
      max-w-5xl
      glass-card
      rounded-3xl
      border
      border-yellow-500/20
      p-8
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
        text-4xl
        font-bold
        text-center
        text-[#ffc000]
        mb-8
        "
      >

        Safety Induction Video

      </h1>

      {/* VIDEO */}

      <div
        className="
        rounded-2xl
        overflow-hidden
        border
        border-yellow-500/20
        "
      >

        <video
          ref={videoRef}
          autoPlay
          playsInline
          controls={false}
          disablePictureInPicture
          controlsList="
          nodownload
          noplaybackrate
          nofullscreen
          "
          className="
          w-full
          rounded-2xl
          "
          onEnded={()=>{

            setCompleted(true);

          }}
        >

          <source
            src="/videos/induction.mp4"
            type="video/mp4"
          />

        </video>

      </div>

    

      {/* BUTTON */}

      <button
        disabled={!completed}
        onClick={onVideoComplete}
        className={`
        w-full
        mt-8
        h-14
        rounded-xl
        text-lg
        font-bold
        transition-all

        ${

          completed

          ? "bg-[#ffc000] text-black"

          : "bg-gray-700 text-gray-400 cursor-not-allowed"

        }
        `}
      >

        {

          completed

          ? "Start Quiz"

          : "Complete Video To Unlock Quiz"

        }

      </button>

    </div>

  );

}
