
import './App.css'
import { useEffect, useState } from 'react';
import Aurora from './components/Aurora';
import ProfileCard from './components/ProfileCard'
import FadeContent from './components/FadeContent';
import CurvedLoop from './components/CurvedLoop';
import Splash from './components/Splash';


function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
    {showSplash && (
      <Splash
        onFinish={() => setShowSplash(false)}
        logoSrc="/arya-logo.png"
        clawSrc="/clawMark.png"
      />
    )}
    <div className='topNameHolderAndAll' id='appHeader'>
      <img className='jpisPef' src="/jpisMain.png" alt="JPIS ISSO 2025" />
      <h1>JPIS ISSO 2025</h1>
      <img className='issoperfec' src="/isso.png" alt="JPIS ISSO 2025" />
    </div>
    <div className='jeele'>
    <Aurora
  colorStops={["#7cff67", "#b19eef", "#5227ff"]}
  blend={5}
  amplitude={0.5}
  speed={0.8}
/>
</div>

<div className='playedSafe' id='cards'>
<FadeContent blur={true} duration={500} easing="ease-out" initialOpacity={0.2}>
  <div className='foreas'>
<ProfileCard
  name="U-17 Basketball"
  title="Girls"
  avatarUrl="/basketballerGirl.png"
  showUserInfo={false}
  enableTilt={true}
  enableMobileTilt={true}
  onCardClick={() => (location.href = '/scoreboard?sport=basketball-u17-girls')}
  onContactClick={() => (location.href = '/scoreboard?sport=basketball-u17-girls')}
  iconUrl='/deka.png'
/>
</div>
</FadeContent>
<div className='textContainerCircluar'>
<CurvedLoop 
  marqueeText="JPIS ✦ STUDENT COUNCIL"
  speed={1}
  curveAmount={300}
  direction="right"
  interactive={true}
  className="custom-text-style"
/>
</div>
<FadeContent blur={true} duration={500} easing="ease-out" initialOpacity={0.2}>
  <div>
<ProfileCard
  name="U-19 Football"
  title="Boys"
  avatarUrl="/footballer.png"
  showUserInfo={false}
  enableTilt={true}
  enableMobileTilt={true}
  onCardClick={() => (location.href = '/scoreboard?sport=football-u19')}
  onContactClick={() => (location.href = '/scoreboard?sport=football-u19')}
  iconUrl='/deka.png'
/>
</div>
</FadeContent>
<FadeContent blur={true} duration={500} easing="ease-out" initialOpacity={0.2}>
<ProfileCard
  name="U-17 Basketball"
  title="Boys"
  avatarUrl="/basketballerBoy.png"
  showUserInfo={false}
  enableTilt={true}
  enableMobileTilt={true}
  onCardClick={() => (location.href = '/scoreboard?sport=basketball-u17-boys')}
  onContactClick={() => (location.href = '/scoreboard?sport=basketball-u17-boys')}
  iconUrl='/deka.png'
/>
</FadeContent>
</div>
  <h1 className='ifjisd'>Made by Piyush Dhumal</h1>
</>
  )
}

export default App
