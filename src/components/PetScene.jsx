import React from 'react'

export default function PetScene() {
  return (
    <div className="pet-scene" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <span className="float-paw paw-a">●</span>
      <span className="float-paw paw-b">●</span>
      <span className="float-paw paw-c">●</span>

      <svg className="pet-illustration" viewBox="0 0 560 430" role="presentation">
        <defs>
          <linearGradient id="dogFill" x1="0" x2="1">
            <stop offset="0%" stopColor="#f6b787" />
            <stop offset="100%" stopColor="#ef956d" />
          </linearGradient>
          <linearGradient id="catFill" x1="0" x2="1">
            <stop offset="0%" stopColor="#7fd0c6" />
            <stop offset="100%" stopColor="#46aaa2" />
          </linearGradient>
        </defs>

        <g className="dog-group">
          <path d="M114 233c-19-91 23-154 106-154 77 0 123 57 112 140l-8 50c-9 66-59 108-120 108-69 0-111-49-99-117l9-27Z" fill="url(#dogFill)" />
          <path d="M132 128c-46-9-71 14-67 56 3 28 26 51 56 55" fill="#d97b59" />
          <path d="M289 122c42-25 79-10 89 28 8 34-9 64-50 79" fill="#d97b59" />
          <ellipse cx="188" cy="210" rx="13" ry="17" fill="#173d3b" />
          <ellipse cx="267" cy="210" rx="13" ry="17" fill="#173d3b" />
          <ellipse className="pet-blink left-blink" cx="188" cy="210" rx="14" ry="2" fill="#173d3b" />
          <ellipse className="pet-blink right-blink" cx="267" cy="210" rx="14" ry="2" fill="#173d3b" />
          <path d="M215 248c6-7 19-7 25 0-2 16-22 16-25 0Z" fill="#173d3b" />
          <path d="M228 265c-2 16-12 24-29 25m29-25c3 15 14 23 30 24" fill="none" stroke="#173d3b" strokeWidth="6" strokeLinecap="round" />
          <path d="M196 311c15 15 48 15 65-1" fill="none" stroke="#fff4ea" strokeWidth="9" strokeLinecap="round" />
        </g>

        <g className="cat-group">
          <path d="M333 218 351 143l46 35 49-28 8 73c37 21 56 59 50 104-7 55-50 90-102 90-54 0-97-35-102-91-5-46 10-83 33-108Z" fill="url(#catFill)" />
          <path d="m349 178 9-48 34 29m18 0 37-30 5 50" fill="none" stroke="#318d87" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="371" cy="257" rx="10" ry="14" fill="#173d3b" />
          <ellipse cx="433" cy="257" rx="10" ry="14" fill="#173d3b" />
          <path d="M394 283c4-5 14-5 18 0-3 12-16 12-18 0Z" fill="#173d3b" />
          <path d="M403 297c0 12-9 20-22 20m22-20c1 12 9 20 22 20" fill="none" stroke="#173d3b" strokeWidth="5" strokeLinecap="round" />
          <path className="cat-tail" d="M482 326c37 15 38 67 3 81-25 10-46-7-35-26 7-12 23-9 26 2" fill="none" stroke="#318d87" strokeWidth="14" strokeLinecap="round" />
        </g>

        <g className="heart-bob">
          <path d="M291 84c16-25 52-15 52 13 0 28-52 55-52 55s-52-27-52-55c0-28 36-38 52-13Z" fill="#fff" />
          <path d="M291 91c9-15 30-9 30 8 0 16-30 32-30 32s-30-16-30-32c0-17 21-23 30-8Z" fill="#ed7f72" />
        </g>
      </svg>

      <div className="mini-care-card mini-card-one">
        <strong>Gentle care</strong>
        <span>For every stage of life</span>
      </div>
      <div className="mini-care-card mini-card-two">
        <strong>Trusted vets</strong>
        <span>Professional & caring</span>
      </div>
    </div>
  )
}
