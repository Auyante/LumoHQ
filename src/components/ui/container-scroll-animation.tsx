"use client";
/**
 * Container Scroll (Aceternity UI, via 21st.dev): a device frame that starts tilted back (rotateX 20°)
 * and straightens + settles in scale as its section scrolls through, while the title drifts up.
 *
 * LAB changes vs the original (prompt 12):
 * - Uses the `motion` package (`motion/react`), already in the lab: same API as framer-motion
 *   (renamed), so no second animation library.
 * - Mobile breakpoint via matchMedia (fires only when crossing 768px) instead of a resize listener.
 * - Reduced motion: frame rendered flat and still.
 * - Typed Header (was `any`); Card no longer takes an unused `translate`.
 * - `frameClassName` to re-skin the device bezel per brand.
 */
import React, { useRef } from "react";
import { useScroll, useTransform, useReducedMotion, motion, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

export const ContainerScroll = ({
  titleComponent,
  children,
  frameClassName,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
  frameClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  // Read after mount: useReducedMotion() is null on the server, so using it in the first render breaks hydration.
  const prefersReduced = useReducedMotion();
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => setReduced(!!prefersReduced), [prefersReduced]);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : isMobile ? [0.7, 0.9] : [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -100]);

  return (
    <div className="relative flex h-[60rem] items-center justify-center p-2 md:h-[80rem] md:p-20" ref={containerRef}>
      <div className="relative w-full py-10 md:py-40" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale} className={frameClassName}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: { translate: MotionValue<number>; titleComponent: React.ReactNode }) => (
  <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
    {titleComponent}
  </motion.div>
);

export const Card = ({
  rotate,
  scale,
  children,
  className,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    style={{
      rotateX: rotate,
      scale,
      boxShadow:
        "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
    }}
    className={cn(
      "mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-[#6C6C6C] bg-[#222222] p-2 shadow-2xl md:h-[40rem] md:p-6",
      className,
    )}
  >
    <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 md:rounded-2xl md:p-4 dark:bg-zinc-900">{children}</div>
  </motion.div>
);

export default ContainerScroll;
