import React, { useState } from 'react';
import './Onboarding.css';

interface OnboardingProps {
  onComplete: (answers: { platform: string; skill: string; struggle: string }) => void;
}

const PLATFORMS = ['Upwork', 'Fiverr', 'PeoplePerHour', 'Freelancer.com', 'Other'];
const SKILLS = ['Graphic Design', 'Writing & Copywriting', 'Web Development', 'Video Editing', 'Data Entry', 'Translation', 'Social Media', 'Other'];
const STRUGGLES = [
  'I get zero replies to proposals',
  'I don\'t know what to write',
  'I get scammed or ghosted by clients',
  'I can\'t figure out how to get paid',
  'My account got suspended or rejected',
  'I don\'t know which platform to use',
];

const steps = [
  {
    id: 1,
    emoji: '🌍',
    question: 'Which platform are you using most right now?',
    subtitle: 'We\'ll personalize your experience based on your platform.',
    options: PLATFORMS,
    field: 'platform' as const,
  },
  {
    id: 2,
    emoji: '🛠️',
    question: 'What is your main skill or service?',
    subtitle: 'We\'ll give you examples that actually match your work.',
    options: SKILLS,
    field: 'skill' as const,
  },
  {
    id: 3,
    emoji: '😤',
    question: 'What\'s your biggest struggle right now?',
    subtitle: 'Be honest — this helps us give you the most useful advice.',
    options: STRUGGLES,
    field: 'struggle' as const,
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ platform: '', skill: '', struggle: '' });
  const [selected, setSelected] = useState('');

  const current = steps[step];

  const handleSelect = (option: string) => setSelected(option);

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = { ...answers, [current.field]: selected };
    setAnswers(newAnswers);
    setSelected('');

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card animate-fade-in">
        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <span className="gradient-text">FreelanceClarity</span>
          </div>
          <div className="onboarding-progress-bar">
            <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="onboarding-step-label">Step {step + 1} of {steps.length}</p>
        </div>

        {/* Welcome message (first step only) */}
        {step === 0 && (
          <div className="onboarding-welcome">
            <p>👋 I know exactly how confusing and frustrating proposals can be when you're just starting — especially as an Ethiopian freelancer dealing with payment barriers on top of everything else. <strong>I've got you.</strong></p>
            <p>Let me ask you 3 quick questions to personalize your experience.</p>
          </div>
        )}

        {/* Question */}
        <div className="onboarding-question">
          <span className="onboarding-emoji">{current.emoji}</span>
          <h2>{current.question}</h2>
          <p className="onboarding-subtitle">{current.subtitle}</p>
        </div>

        {/* Options */}
        <div className="onboarding-options">
          {current.options.map((option) => (
            <button
              key={option}
              className={`onboarding-option ${selected === option ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          className="btn btn-primary btn-lg w-full"
          onClick={handleNext}
          disabled={!selected}
        >
          {step < steps.length - 1 ? 'Next →' : "Let's Go! 🚀"}
        </button>
      </div>
    </div>
  );
};
