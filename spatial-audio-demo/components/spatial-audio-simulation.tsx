"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";

interface SliderValue {
  value: number[];
  onValueChange: (value: number[]) => void;
}

const SpatialAudioSimulation = () => {
  const [sourceAngle, setSourceAngle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftVolume, setLeftVolume] = useState(1);
  const [rightVolume, setRightVolume] = useState(1);
  const [leftResistance, setLeftResistance] = useState(100);
  const [rightResistance, setRightResistance] = useState(100);
  const [perceivedAngle, setPerceivedAngle] = useState(0);

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] =
    useState<MediaElementAudioSourceNode | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [leftGain, setLeftGain] = useState<GainNode | null>(null);
  const [rightGain, setRightGain] = useState<GainNode | null>(null);
  const [merger, setMerger] = useState<ChannelMergerNode | null>(null);

  const initAudio = async () => {
    const audio = new Audio("/demo-music.mp3");
    audio.loop = true;

    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const leftGainNode = context.createGain();
    const rightGainNode = context.createGain();
    const channelMerger = context.createChannelMerger(2);

    const baseVolume = 0.9;
    leftGainNode.gain.setValueAtTime(baseVolume, context.currentTime);
    rightGainNode.gain.setValueAtTime(baseVolume, context.currentTime);

    const leftPanner = context.createStereoPanner();
    const rightPanner = context.createStereoPanner();
    leftPanner.pan.value = -1;
    rightPanner.pan.value = 1;

    source.connect(leftPanner);
    source.connect(rightPanner);
    leftPanner.connect(leftGainNode);
    rightPanner.connect(rightGainNode);
    leftGainNode.connect(channelMerger, 0, 0);
    rightGainNode.connect(channelMerger, 0, 1);
    channelMerger.connect(context.destination);

    setAudioContext(context);
    setAudioSource(source);
    setAudioElement(audio);
    setLeftGain(leftGainNode);
    setRightGain(rightGainNode);
    setMerger(channelMerger);

    try {
      await audio.play();
    } catch (error) {
      console.error("播放失败:", error);
    }
  };

  const handlePlayPause = async () => {
    if (!audioContext) {
      await initAudio();
      setIsPlaying(true);
      return;
    }

    if (audioElement) {
      if (audioContext.state === "suspended") {
        audioContext.resume();
        audioElement.play();
        setIsPlaying(true);
      } else if (audioContext.state === "running") {
        audioContext.suspend();
        audioElement.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleReset = () => {
    setSourceAngle(0);
    setIsPlaying(false);
    if (audioContext && audioElement) {
      const timeConstant = 0.1;
      const currentTime = audioContext.currentTime;

      if (leftGain && rightGain) {
        leftGain.gain.setTargetAtTime(0, currentTime, timeConstant);
        rightGain.gain.setTargetAtTime(0, currentTime, timeConstant);
      }

      audioContext.suspend();
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  };

  useEffect(() => {
    const angle = sourceAngle;

    const baseResistance = 100;
    const maxResistance = 400;
    const voltage = 5;

    const angleToResistanceRatio = (angle: number) => {
      return Math.pow(Math.abs(angle) / 90, 1.5);
    };

    const leftRes =
      baseResistance +
      angleToResistanceRatio(Math.max(0, angle)) *
        (maxResistance - baseResistance);
    const rightRes =
      baseResistance +
      angleToResistanceRatio(Math.max(0, -angle)) *
        (maxResistance - baseResistance);

    setLeftResistance(Math.round(leftRes));
    setRightResistance(Math.round(rightRes));

    const leftCurrent = voltage / leftRes;
    const rightCurrent = voltage / rightRes;
    const maxCurrent = voltage / baseResistance;

    const enhanceVolume = (vol: number) => {
      return Math.pow(vol, 1.2);
    };

    const leftVol = enhanceVolume(leftCurrent / maxCurrent);
    const rightVol = enhanceVolume(rightCurrent / maxCurrent);

    setLeftVolume(leftVol);
    setRightVolume(rightVol);

    setPerceivedAngle(angle);
  }, [sourceAngle]);

  useEffect(() => {
    if (leftGain && rightGain && audioContext) {
      const timeConstant = 0.1;
      const currentTime = audioContext.currentTime;

      const baseVolume = 0.9;
      const minVolume = 0.1;

      const enhancedLeftVolume =
        minVolume + (baseVolume - minVolume) * leftVolume;
      const enhancedRightVolume =
        minVolume + (baseVolume - minVolume) * rightVolume;

      leftGain.gain.setTargetAtTime(
        enhancedLeftVolume,
        currentTime,
        timeConstant
      );
      rightGain.gain.setTargetAtTime(
        enhancedRightVolume,
        currentTime,
        timeConstant
      );
    }
  }, [leftVolume, rightVolume, leftGain, rightGain, audioContext]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext, audioElement]);

  const handleSliderChange = (value: number[]) => {
    setSourceAngle(value[0]);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl">
      <CardHeader className="border-b py-8">
        <CardTitle className="text-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          耳机空间音频物理模拟
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-full max-w-md space-y-3">
              <label className="text-base font-medium flex items-center justify-between">
                <span>音源方位角度</span>
                <span className="text-blue-600 font-mono text-lg">
                  {sourceAngle}°
                </span>
              </label>
              <Slider
                value={[sourceAngle]}
                onValueChange={handleSliderChange}
                min={-90}
                max={90}
                step={1}
                className="w-full h-3"
              />
            </div>

            <div className="relative w-[min(100%,24rem)] h-[min(100%,24rem)] bg-gray-50 rounded-full shadow-inner">
              <div className="absolute top-1/2 left-1/2 w-48 h-48 border-6 border-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-blue-100 rounded-full" />

                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-blue-600 whitespace-nowrap">
                        人脸朝向
                      </span>
                      <div className="w-10 h-10 border-t-[6px] border-r-[6px] border-blue-500 transform -rotate-45" />
                    </div>
                  </div>

                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2">
                    <div
                      className="w-4 h-8 bg-green-500 rounded-l-full transition-all duration-300"
                      style={{ opacity: leftVolume }}
                    />
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 glow-red">
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm whitespace-nowrap font-medium">
                        左声源 ({Math.round(leftVolume * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
                    <div
                      className="w-4 h-8 bg-green-500 rounded-r-full transition-all duration-300"
                      style={{ opacity: rightVolume }}
                    />
                    <div className="absolute top-1/2 right-1/2 w-4 h-4 bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2 glow-red">
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm whitespace-nowrap font-medium">
                        右声源 ({Math.round(rightVolume * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-[0px] border-2 border-dashed border-yellow-200 rounded-full" />

              <div
                className="absolute top-1/2 left-1/2 w-6 h-6 bg-yellow-500 rounded-full transform -translate-y-1/2 transition-all duration-500 ease-out"
                style={{
                  transform: `
                    translate(-50%, -50%)
                    translate(${
                      188 * Math.sin((perceivedAngle * Math.PI) / 180)
                    }px, 
                             ${
                               -188 * Math.cos((perceivedAngle * Math.PI) / 180)
                             }px)
                  `,
                  boxShadow: "0 0 20px rgba(234, 179, 8, 0.6)",
                }}
              >
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm whitespace-nowrap font-medium">
                  感知声源 ({perceivedAngle}°)
                </span>
              </div>
            </div>

            <div className="flex justify-center space-x-6 mt-4">
              <button
                className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>
              <button
                className="p-4 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg transition-all duration-300 hover:scale-105"
                onClick={handleReset}
              >
                <RotateCcw size={32} />
              </button>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-blue-800">
                电路参数
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-700">左声道电阻</span>
                    <span className="text-xs font-mono text-blue-900">
                      {leftResistance}Ω
                    </span>
                  </div>
                  <div className="w-full h-2 bg-blue-100 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          ((leftResistance - 100) / (400 - 100)) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-700">右声道电阻</span>
                    <span className="text-xs font-mono text-blue-900">
                      {rightResistance}Ω
                    </span>
                  </div>
                  <div className="w-full h-2 bg-blue-100 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          ((rightResistance - 100) / (400 - 100)) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-green-800">音量参</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-green-700">左耳音量</span>
                    <span className="text-sm font-mono text-green-900">
                      {Math.round(leftVolume * 100)}%
                    </span>
                    <span className="text-xs text-green-600">
                      {(5 / leftResistance).toFixed(2)}mA
                    </span>
                  </div>
                  <div className="w-full h-2 bg-green-100 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${leftVolume * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-green-700">右耳音量</span>
                    <span className="text-sm font-mono text-green-900">
                      {Math.round(rightVolume * 100)}%
                    </span>
                    <span className="text-xs text-green-600">
                      {(5 / rightResistance).toFixed(2)}mA
                    </span>
                  </div>
                  <div className="w-full h-2 bg-green-100 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${rightVolume * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl shadow-sm space-y-3">
              <h3 className="text-base font-semibold text-yellow-800">
                声学参数
              </h3>
              <div className="space-y-4 text-base">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-700">双耳强度差(ILD)</span>
                  <span className="font-mono text-yellow-900">
                    {((rightVolume - leftVolume) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-700">实际声源角度</span>
                  <span className="font-mono text-yellow-900">
                    {sourceAngle}°
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-700">感知声源角度</span>
                  <span className="font-mono text-yellow-900">
                    {perceivedAngle}°
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpatialAudioSimulation;
