"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Slider } from "./ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";

const SpatialAudioSimulation = () => {
  const [headAngle, setHeadAngle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftVolume, setLeftVolume] = useState(1);
  const [rightVolume, setRightVolume] = useState(1);
  
  // 添加音频相关的状态
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);

  // 初始化音频上下文
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // 处理音频播放/暂停
  useEffect(() => {
    if (isPlaying && audioContextRef.current) {
      // 创建音频节点
      const oscillator = audioContextRef.current.createOscillator();
      const leftGain = audioContextRef.current.createGain();
      const rightGain = audioContextRef.current.createGain();
      const merger = audioContextRef.current.createChannelMerger(2);

      // 设置音频参数
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);

      // 连接音频节点
      oscillator.connect(leftGain);
      oscillator.connect(rightGain);
      leftGain.connect(merger, 0, 0);
      rightGain.connect(merger, 0, 1);
      merger.connect(audioContextRef.current.destination);

      // 保存引用
      oscillatorRef.current = oscillator;
      leftGainRef.current = leftGain;
      rightGainRef.current = rightGain;

      // 开始播放
      oscillator.start();
    } else {
      // 停止播放
      oscillatorRef.current?.stop();
      oscillatorRef.current = null;
    }
  }, [isPlaying]);

  // 更新音量
  useEffect(() => {
    if (leftGainRef.current) {
      leftGainRef.current.gain.setValueAtTime(leftVolume, audioContextRef.current?.currentTime || 0);
    }
    if (rightGainRef.current) {
      rightGainRef.current.gain.setValueAtTime(rightVolume, audioContextRef.current?.currentTime || 0);
    }
  }, [leftVolume, rightVolume]);

  // 计算音量
  useEffect(() => {
    const normalizedAngle = (((headAngle % 360) + 540) % 360) - 180;
    const leftVol = Math.cos((Math.max(0, normalizedAngle) * Math.PI) / 180);
    const rightVol = Math.cos((Math.max(0, -normalizedAngle) * Math.PI) / 180);

    setLeftVolume(Math.pow(leftVol, 2));
    setRightVolume(Math.pow(rightVol, 2));
  }, [headAngle]);

  const handleReset = () => {
    setHeadAngle(0);
    setIsPlaying(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center">耳机空间音频仿真演示</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 头部旋转控制 */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex justify-between">
            <span>头部旋转角度</span>
            <span className="text-blue-600">{headAngle}°</span>
          </label>
          <Slider
            value={[headAngle]}
            onValueChange={(value) => setHeadAngle(value[0])}
            min={-180}
            max={180}
            step={1}
            className="w-full"
          />
        </div>

        {/* 可视化表示 */}
        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 bg-blue-50 rounded-full opacity-20"></div>
          {/* 头部表示 */}
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 border-4 border-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
            style={{
              transform: `translate(-50%, -50%) rotate(${headAngle}deg)`,
            }}
          >
            {/* 面部指示器 */}
            <div className="absolute top-1/2 left-1/2 w-4 h-8 bg-blue-500 transform -translate-x-1/2 -translate-y-1/2" />

            {/* 左耳 */}
            <div
              className="absolute top-1/2 left-0 w-3 h-6 bg-green-500 transform -translate-y-1/2 -translate-x-full rounded-l-full transition-opacity duration-300"
              style={{ opacity: leftVolume }}
            />

            {/* 右耳 */}
            <div
              className="absolute top-1/2 right-0 w-3 h-6 bg-green-500 transform -translate-y-1/2 translate-x-full rounded-r-full transition-opacity duration-300"
              style={{ opacity: rightVolume }}
            />
          </div>

          {/* 声源（固定位置） */}
          <div className="absolute top-1/2 left-0 w-4 h-4 bg-red-500 rounded-full transform -translate-y-1/2 animate-pulse" />
        </div>

        {/* 音量指示器 */}
        <div className="flex justify-around text-sm">
          <div className="space-y-1">
            <div className="text-center">左耳音量</div>
            <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${leftVolume * 100}%` }}
              />
            </div>
            <div className="text-center text-green-600">{Math.round(leftVolume * 100)}%</div>
          </div>
          <div className="space-y-1">
            <div className="text-center">右耳音量</div>
            <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${rightVolume * 100}%` }}
              />
            </div>
            <div className="text-center text-green-600">{Math.round(rightVolume * 100)}%</div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            className="p-3 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200"
            onClick={handleReset}
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpatialAudioSimulation; 