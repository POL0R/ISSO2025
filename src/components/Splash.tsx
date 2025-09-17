import React, { useEffect } from 'react';
import './Splash.css';

interface SplashProps {
  onFinish?: () => void;
  totalDurationMs?: number;
  logoSrc?: string;
  clawSrc?: string;
}

const Splash: React.FC<SplashProps> = ({
  onFinish,
  totalDurationMs = 3200,
  logoSrc = '/arya-logo.png',
  clawSrc = '/clawMark.png'
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, totalDurationMs);
    return () => clearTimeout(timer);
  }, [onFinish, totalDurationMs]);

  return (
    <div className="splash-overlay">
      <div className="splash-stage">
        <img src={clawSrc} className="claw claw-left" alt="" />
        <img src={clawSrc} className="claw claw-right" alt="" />
        <img src={logoSrc} className="arya-logo" alt="Arya logo" />
      </div>
    </div>
  );
};

export default Splash;


