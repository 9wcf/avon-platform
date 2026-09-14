"use client";
import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function CountUp({ value, duration = 1.5, prefix = "", suffix = "" }: { value: number; duration?: number; prefix?: string; suffix?: string }) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString("en-US"));
  const [text, setText] = useState("0");

  useEffect(() => {
    spring.set(value);
    const unsub = display.on("change", (v) => setText(v));
    return unsub;
  }, [value, spring, display]);

  return <span>{prefix}{text}{suffix}</span>;
}
